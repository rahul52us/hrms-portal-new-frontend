"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import {
  Badge,
  Box,
  Divider,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const titleCase = (value: string) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const displayValue = (value: any) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }
  return String(value).replace(/_/g, " ");
};

function Snapshot({ label, value }: { label: string; value: any }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500">{label}</Text>
      <Text fontSize="sm" fontWeight="650">{displayValue(value)}</Text>
    </Box>
  );
}

export default function AttendanceRevisionDrawer({
  isOpen,
  onClose,
  employeeName,
  attendanceDate,
  revisions,
}: {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  attendanceDate: string;
  revisions: any[];
}) {
  const panel = useColorModeValue("gray.50", "gray.900");
  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix="Attendance history"
      titleSuffix={attendanceDate}
      subtitle={employeeName}
      maxW={{ base: "100%", lg: "720px" }}
    >
      {revisions.length ? (
        <Stack spacing={4} divider={<Divider />}>
          {revisions.map((revision) => {
            const before = revision.changes?.before || {};
            const after = revision.changes?.after || {};
            return (
              <Box key={revision._id} pb={4}>
                <Flex justify="space-between" gap={3} flexWrap="wrap">
                  <Box>
                    <Badge colorScheme="blue">{titleCase(revision.action)}</Badge>
                    <Text fontSize="sm" fontWeight="700" mt={2}>{revision.reason || "Attendance record updated"}</Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {revision.actor?.name || "System"} | {titleCase(revision.source)} | Revision {revision.revisionNumber}
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500">
                    {new Intl.DateTimeFormat("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(revision.createdAt))}
                  </Text>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={4}>
                  <Box bg={panel} borderRadius="md" p={3}>
                    <Text fontSize="xs" fontWeight="800" mb={3}>BEFORE</Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <Snapshot label="State" value={before.state} />
                      <Snapshot label="Status" value={before.status} />
                      <Snapshot label="Work mode" value={before.workMode} />
                      <Snapshot label="Punch in" value={before.firstPunchIn} />
                      <Snapshot label="Final punch out" value={before.finalPunchOut} />
                      <Snapshot label="Worked minutes" value={before.workedMinutes} />
                      <Snapshot label="Late minutes" value={before.lateMinutes} />
                      <Snapshot label="Early exit minutes" value={before.earlyExitMinutes} />
                      <Snapshot label="Overtime minutes" value={before.overtimeMinutes} />
                      <Snapshot label="Missing punch" value={before.hasMissingPunch} />
                    </SimpleGrid>
                  </Box>
                  <Box bg={panel} borderRadius="md" p={3}>
                    <Text fontSize="xs" fontWeight="800" mb={3}>AFTER</Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <Snapshot label="State" value={after.state} />
                      <Snapshot label="Status" value={after.status} />
                      <Snapshot label="Work mode" value={after.workMode} />
                      <Snapshot label="Punch in" value={after.firstPunchIn} />
                      <Snapshot label="Final punch out" value={after.finalPunchOut} />
                      <Snapshot label="Worked minutes" value={after.workedMinutes} />
                      <Snapshot label="Late minutes" value={after.lateMinutes} />
                      <Snapshot label="Early exit minutes" value={after.earlyExitMinutes} />
                      <Snapshot label="Overtime minutes" value={after.overtimeMinutes} />
                      <Snapshot label="Missing punch" value={after.hasMissingPunch} />
                    </SimpleGrid>
                  </Box>
                </SimpleGrid>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Text color="gray.500">No attendance revisions have been recorded.</Text>
      )}
    </DashboardDrawer>
  );
}
