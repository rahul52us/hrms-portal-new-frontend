"use client";

import CustomInput from "@/app/component/config/component/customInput/CustomInput";
import { OrganizationNode } from "@/app/store/organizationStore/organizationStore";
import stores from "@/app/store/stores";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  node: OrganizationNode | null;
  nodes: OrganizationNode[];
  companyId: string;
  isOpen: boolean;
  canAssignManagers: boolean;
  onClose: () => void;
  onHierarchyUpdated: () => Promise<void>;
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    user: "Employee",
    departmenthead: "Department Head",
    hradmin: "HR Admin",
    hr: "HR",
  };

  return labels[role] || role || "Employee";
}

function managerOption(node: OrganizationNode | null) {
  if (!node?.reportingManager?._id) {
    return null;
  }

  const manager = node.reportingManager;
  return {
    label: `${manager.name}${manager.designation ? ` - ${manager.designation}` : ""}${manager.department ? ` - ${manager.department}` : ""}`,
    value: manager._id,
    name: manager.name,
    email: manager.email || "",
    role: manager.role,
  };
}

const OrganizationPersonDrawer = ({
  node,
  nodes,
  companyId,
  isOpen,
  canAssignManagers,
  onClose,
  onHierarchyUpdated,
}: Props) => {
  const { userStore } = stores;
  const toast = useToast();
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("gray.50", "whiteAlpha.50");

  useEffect(() => {
    setSelectedManager(managerOption(node));
  }, [node]);

  const nodeById = useMemo(
    () => new Map(nodes.map((item) => [item._id, item])),
    [nodes]
  );
  const directReports = useMemo(
    () =>
      (node?.directReportIds || [])
        .map((id) => nodeById.get(id))
        .filter((item): item is OrganizationNode => Boolean(item)),
    [node, nodeById]
  );

  const saveReportingManager = async () => {
    if (!node || node.isContextOnly || !canAssignManagers) {
      return;
    }

    const reportingManagerId = String(selectedManager?.value || "");
    if (reportingManagerId === String(node.reportingManagerId || "")) {
      toast({
        title: "No hierarchy change",
        description: "The selected reporting manager is already assigned.",
        status: "info",
        duration: 2500,
      });
      return;
    }

    setIsSaving(true);
    try {
      await userStore.updateManagedUser(node._id, {
        reportingManagerId: reportingManagerId || null,
      });
      await onHierarchyUpdated();
      toast({
        title: "Reporting manager updated",
        description: reportingManagerId
          ? `${node.name}'s reporting line has been updated.`
          : `${node.name} is now a top-level employee.`,
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update reporting manager",
        description:
          error?.error || error?.message || "The reporting line could not be updated.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          Employee hierarchy
        </DrawerHeader>

        <DrawerBody py={5}>
          {node ? (
            <Stack spacing={6}>
              <HStack align="flex-start" spacing={4}>
                <Avatar size="lg" name={node.name} src={node.pic?.url || undefined} />
                <Box minW={0}>
                  <HStack spacing={2} flexWrap="wrap">
                    <Text fontSize="lg" fontWeight="800">
                      {node.name}
                    </Text>
                    <Badge colorScheme="blue">{roleLabel(node.role)}</Badge>
                    {node.isContextOnly ? <Badge colorScheme="gray">Context only</Badge> : null}
                  </HStack>
                  <Text color={muted}>
                    {node.designation || "No designation"}
                  </Text>
                  {node.email ? (
                    <Text mt={1} fontSize="sm" color={muted}>
                      {node.email}
                    </Text>
                  ) : null}
                </Box>
              </HStack>

              <SimpleGrid columns={2} spacing={3}>
                <Box bg={sectionBg} borderRadius="md" p={3}>
                  <Text fontSize="xs" color={muted} textTransform="uppercase">
                    Direct reports
                  </Text>
                  <Text mt={1} fontSize="xl" fontWeight="800">
                    {node.directReportCount}
                  </Text>
                </Box>
                <Box bg={sectionBg} borderRadius="md" p={3}>
                  <Text fontSize="xs" color={muted} textTransform="uppercase">
                    Total reports
                  </Text>
                  <Text mt={1} fontSize="xl" fontWeight="800">
                    {node.totalReportCount}
                  </Text>
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontWeight="800">Organization details</Text>
                <Stack mt={3} spacing={2}>
                  {[
                    ["Department", node.department || "Not assigned"],
                    ["Team", node.team || "Not assigned"],
                    ["Location", node.officeLocation?.name || "Not assigned"],
                    ["Status", node.status],
                    ["Level", `Level ${node.depth + 1}`],
                  ].map(([label, value]) => (
                    <Flex key={label} justify="space-between" gap={4}>
                      <Text fontSize="sm" color={muted}>
                        {label}
                      </Text>
                      <Text fontSize="sm" fontWeight="700" textAlign="right">
                        {value}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Text fontWeight="800">Reporting line</Text>
                <Stack mt={3} spacing={2}>
                  {node.managerChain.length > 0 ? (
                    node.managerChain.map((manager) => (
                      <Flex
                        key={`${manager._id}:${manager.level}`}
                        align="center"
                        justify="space-between"
                        gap={3}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        p={3}
                      >
                        <Box minW={0}>
                          <Text fontWeight="700" noOfLines={1}>
                            {manager.name}
                          </Text>
                          <Text fontSize="xs" color={muted} noOfLines={1}>
                            {manager.designation || manager.department || roleLabel(manager.role)}
                          </Text>
                        </Box>
                        <Badge variant="subtle">Level {manager.level}</Badge>
                      </Flex>
                    ))
                  ) : (
                    <Text fontSize="sm" color={muted}>
                      This is a top-level employee.
                    </Text>
                  )}
                </Stack>
              </Box>

              {directReports.length > 0 ? (
                <Box>
                  <Text fontWeight="800">Direct reports</Text>
                  <Stack mt={3} spacing={2}>
                    {directReports.map((report) => (
                      <HStack
                        key={report._id}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        p={3}
                        spacing={3}
                      >
                        <Avatar size="xs" name={report.name} src={report.pic?.url || undefined} />
                        <Box minW={0}>
                          <Text fontWeight="700" noOfLines={1}>
                            {report.name}
                          </Text>
                          <Text fontSize="xs" color={muted} noOfLines={1}>
                            {report.designation || report.department || roleLabel(report.role)}
                          </Text>
                        </Box>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {!node.isContextOnly && canAssignManagers ? (
                <>
                  <Divider />
                  <Box>
                    <Text fontWeight="800">Change reporting manager</Text>
                    <Text mt={1} mb={3} fontSize="sm" color={muted}>
                      Clearing the field makes this person a top-level employee.
                    </Text>
                    <CustomInput
                      label="Reporting Manager"
                      type="real-time-user-search"
                      name="organizationReportingManager"
                      value={selectedManager}
                      query={{
                        companyId,
                        purpose: "reporting-manager",
                        excludeUserId: node._id,
                      }}
                      isSearchable
                      isClear
                      placeholder="Search by employee name or email"
                      loadOptionsOnMenuOpen
                      excludeOptionValues={[node._id]}
                      excludeUserRoles={["admin", "superadmin"]}
                      excludeDisabledUsers
                      emptyOptionsMessage="No eligible employees found"
                      onChange={(value: any) => setSelectedManager(value || null)}
                    />
                  </Box>
                </>
              ) : null}
            </Stack>
          ) : null}
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {node && !node.isContextOnly && canAssignManagers ? (
            <Button
              colorScheme="blue"
              ml={3}
              isLoading={isSaving}
              onClick={saveReportingManager}
            >
              Save reporting line
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrganizationPersonDrawer;
