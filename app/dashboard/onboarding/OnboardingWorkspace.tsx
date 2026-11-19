"use client";
import { Alert, AlertIcon, Box, Button, Heading, Skeleton, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import stores from "@/app/store/stores";
import PermissionGate from "@/app/component/common/PermissionGate";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { normalizeRole } from "@/app/config/utils/roleAccess";
import { onboardingGet } from "./onboardingApi";
import ChecklistTemplatesWorkspace from "./ChecklistTemplatesWorkspace";
import EmployeeOnboardingList from "./EmployeeOnboardingList";
import OnboardingAutomationPanel from "./OnboardingAutomationPanel";
import OnboardingDocumentSecurityPanel from "./OnboardingDocumentSecurityPanel";
import OnboardingPoliciesWorkspace from "./OnboardingPoliciesWorkspace";

export default observer(function OnboardingWorkspace() {
  const queryString = useSearchParams().toString();
  const user = stores.auth.user, ready = stores.auth.sessionReady && Boolean(user);
  const role = normalizeRole(user?.role);
  const companyAccount = Boolean(user?.company) && role !== "superadmin";
  const showMyOnboarding = role !== "hradmin";
  const accountKey = `${user?._id || ""}:${user?.company?._id || user?.company || ""}`;
  const [options, setOptions] = useState<{ canView: boolean; canManage: boolean; canViewAssignedTasks: boolean; canViewTemplates: boolean; canManageAutomation: boolean; canManageDocumentSecurity: boolean } | null>(null);
  const [error, setError] = useState(""), [reload, setReload] = useState(0), [tab, setTab] = useState(0);
  const [initial, setInitial] = useState<{ employeeId?: string; instanceId?: string }>({});
  useEffect(() => {
    if (!ready || !companyAccount) return;
    const controller = new AbortController(); setOptions(null); setError("");
    const params = new URLSearchParams(queryString);
    setInitial({ employeeId: params.get("employeeId") || undefined, instanceId: params.get("instanceId") || undefined });
    onboardingGet<{ data: NonNullable<typeof options> }>("/workspace", undefined, controller.signal).then(({ data }) => {
      if (!controller.signal.aborted) {
        setOptions(data);
        const scopes = [...(data.canView ? ["organization"] : []), ...(showMyOnboarding ? ["mine"] : []), ...(data.canViewAssignedTasks ? ["tasks"] : []), ...(data.canViewTemplates ? ["templates", "policies"] : []), ...(data.canManageAutomation ? ["automation"] : []), ...(data.canManageDocumentSecurity ? ["security"] : [])];
        const requested = scopes.indexOf(params.get("tab") || ""); setTab(requested >= 0 ? requested : 0);
      }
    }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Unable to load onboarding")); });
    return () => controller.abort();
  }, [ready, companyAccount, accountKey, reload, queryString, showMyOnboarding]);
  if (!ready) return <Stack p={6}><Skeleton h="40px" /><Skeleton h="150px" /></Stack>;
  const panels = [...(options?.canView ? [{ name: "Employee onboarding", scope: "organization" }] : []), ...(showMyOnboarding ? [{ name: "My onboarding", scope: "mine" }] : []), ...(options?.canViewAssignedTasks ? [{ name: "My tasks", scope: "tasks" }] : []), ...(options?.canViewTemplates ? [{ name: "Checklist templates", scope: "templates" }, { name: "Policy library", scope: "policies" }] : []), ...(options?.canManageAutomation ? [{ name: "Automation", scope: "automation" }] : []), ...(options?.canManageDocumentSecurity ? [{ name: "Document security", scope: "security" }] : [])];
  return <PermissionGate allowed={companyAccount} title="Company account required" description="Employee onboarding is managed inside a company."><Box p={{ base: 3, md: 6 }} minW={0}><Stack maxW="1500px" mx="auto" spacing={5}>
    <Heading size="lg">Onboarding</Heading>
    {error && <Alert status="error"><AlertIcon />{error}<Button ml="auto" size="sm" onClick={() => setReload((n) => n + 1)}>Retry</Button></Alert>}
    {!options ? !error && <Skeleton h="150px" /> : <Tabs index={tab} onChange={setTab} isLazy><TabList overflowX="auto">{panels.map((item) => <Tab key={item.scope} whiteSpace="nowrap" flexShrink={0}>{item.name}</Tab>)}</TabList><TabPanels>{panels.map((item) => <TabPanel key={item.scope} px={0}>
      {item.scope === "templates" ? <ChecklistTemplatesWorkspace embedded /> : item.scope === "policies" ? <OnboardingPoliciesWorkspace key={accountKey} /> : item.scope === "automation" ? <OnboardingAutomationPanel key={accountKey} accountKey={accountKey} /> : item.scope === "security" ? <OnboardingDocumentSecurityPanel key={accountKey} accountKey={accountKey} /> : <EmployeeOnboardingList key={`${accountKey}:${item.scope}`} scope={item.scope} canManage={options.canManage && item.scope === "organization"} employeeId={item.scope === "organization" ? initial.employeeId : undefined} initialInstanceId={initial.instanceId} />}
    </TabPanel>)}</TabPanels></Tabs>}
  </Stack></Box></PermissionGate>;
});
