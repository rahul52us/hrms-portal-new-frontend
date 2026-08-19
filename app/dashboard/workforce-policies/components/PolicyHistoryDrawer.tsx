"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import {
  AttendanceRules,
  LeavePolicyRule,
  PolicyResourceType,
  WorkforcePolicyItem,
  WorkScheduleRules,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  resourceType: PolicyResourceType;
  resource?: WorkforcePolicyItem | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Open ended";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

const PolicyHistoryDrawer = observer(function PolicyHistoryDrawer({
  isOpen,
  onClose,
  resourceType,
  resource,
}: Props) {
  const detail = workforcePolicyStore.selectedResource;
  const detailResource =
    resourceType === "attendance_policy"
      ? detail?.policy
      : resourceType === "work_schedule"
        ? detail?.schedule
        : resourceType === "holiday_calendar"
          ? detail?.calendar
          : detail?.policy;
  const versions = detailResource?._id === resource?._id ? detail?.versions || [] : [];

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">{resource?.name || "Version history"}</Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">
            {resource?.code} / complete effective-dated history
          </Text>
        </DrawerHeader>
        <DrawerBody py={5}>
          {workforcePolicyStore.detailLoading ? (
            <Stack spacing={4}>
              <Skeleton h="120px" /><Skeleton h="120px" />
            </Stack>
          ) : workforcePolicyStore.detailError ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{workforcePolicyStore.detailError}</AlertDescription>
            </Alert>
          ) : (
            <Stack spacing={0} borderWidth="1px" borderRadius="md" overflow="hidden">
              {versions.length === 0 ? (
                <Box p={6} textAlign="center"><Text color="gray.500">No versions found.</Text></Box>
              ) : null}
              {versions.map((version, index) => (
                <Box key={version._id} p={4} borderBottomWidth={index === versions.length - 1 ? "0" : "1px"}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <HStack spacing={2}>
                        <Text fontWeight="800">Version {version.versionNumber}</Text>
                        <Badge colorScheme={version.status === "published" ? "green" : version.status === "draft" ? "orange" : "gray"}>
                          {version.status}
                        </Badge>
                      </HStack>
                      <Text mt={1} fontSize="sm" color="gray.600">
                        {formatDate(version.effectiveFrom)} to {formatDate(version.effectiveTo)}
                      </Text>
                    </Box>
                    <Text fontSize="xs" color="gray.500">
                      {version.status === "published" ? "Immutable" : "Editable draft"}
                    </Text>
                  </HStack>
                  <Text mt={3} fontSize="sm">{version.changeReason || "No change reason recorded"}</Text>
                  {resourceType === "attendance_policy" && version.rules ? (
                    <HStack mt={3} spacing={4} wrap="wrap" color="gray.600">
                      <Text fontSize="xs">{(version.rules as AttendanceRules).minimumFullDayMinutes} full-day minutes</Text>
                      <Text fontSize="xs">Late grace: {(version.rules as AttendanceRules).gracePeriodMinutesLate} min</Text>
                      <Text fontSize="xs">Missing punch: {(version.rules as AttendanceRules).missingPunchTreatment.replaceAll("_", " ")}</Text>
                    </HStack>
                  ) : null}
                  {resourceType === "work_schedule" && version.rules ? (
                    <HStack mt={3} spacing={4} wrap="wrap" color="gray.600">
                      <Text fontSize="xs">{(version.rules as WorkScheduleRules).startTime}-{(version.rules as WorkScheduleRules).endTime}</Text>
                      <Text fontSize="xs">{(version.rules as WorkScheduleRules).workingDays.join(", ")}</Text>
                      <Text fontSize="xs">Saturday: {(version.rules as WorkScheduleRules).saturdayRule.replaceAll("_", " ")}</Text>
                      <Text fontSize="xs">{(version.rules as WorkScheduleRules).timezone}</Text>
                    </HStack>
                  ) : null}
                  {resourceType === "holiday_calendar" ? (
                    <Text mt={3} fontSize="xs" color="gray.600">
                      {version.holidays?.length || 0} holidays / {version.timezone || "Timezone not set"}
                    </Text>
                  ) : null}
                  {resourceType === "leave_policy" && Array.isArray(version.rules) ? (
                    <Stack mt={3} spacing={1}>
                      <Text fontSize="xs" color="gray.600">
                        Leave year starts {version.leaveYearStartDay || 1}/{version.leaveYearStartMonth || 1}
                      </Text>
                      {(version.rules as LeavePolicyRule[]).map((rule) => (
                        <Text key={String(rule.leaveType)} fontSize="xs" color="gray.600">
                          {rule.leaveTypeCodeSnapshot || rule.leaveTypeNameSnapshot}: {rule.balanceTracked === false ? "No balance" : `${rule.annualEntitlement} days / ${rule.accrualFrequency}`}
                        </Text>
                      ))}
                    </Stack>
                  ) : null}
                </Box>
              ))}
            </Stack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
});

export default PolicyHistoryDrawer;
