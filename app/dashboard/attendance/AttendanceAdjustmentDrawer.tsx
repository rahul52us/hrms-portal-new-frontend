"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { AttendanceOverviewRow } from "./attendanceAdminApi";
import { updateAttendanceEmployeeDay } from "./attendanceAdminApi";

function localTime(value: string | null | undefined, timezone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone || "Asia/Kolkata",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("hour")}:${part("minute")}`;
}

function localDate(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone || "Asia/Kolkata",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function AttendanceAdjustmentDrawer({
  row,
  isOpen,
  onClose,
  onSaved,
}: {
  row: AttendanceOverviewRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [punchInTime, setPunchInTime] = useState("");
  const [punchOutTime, setPunchOutTime] = useState("");
  const [punchOutNextDay, setPunchOutNextDay] = useState(false);
  const [clearPunches, setClearPunches] = useState(false);
  const [status, setStatus] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!row || !isOpen) return;
    setPunchInTime(localTime(row.firstIn, row.timezone));
    setPunchOutTime(localTime(row.lastOut, row.timezone));
    setPunchOutNextDay(
      Boolean(row.firstIn && row.lastOut) &&
        localDate(row.lastOut as string, row.timezone) !== localDate(row.firstIn as string, row.timezone)
    );
    setClearPunches(false);
    setStatus("");
    setWorkMode(row.workMode || "office");
    setReason("");
  }, [isOpen, row]);

  const submit = async () => {
    if (!row) return;
    setSubmitting(true);
    try {
      await updateAttendanceEmployeeDay(row.employee.id, {
        attendanceDate: row.attendanceDate,
        reason,
        punchInTime: clearPunches ? undefined : punchInTime || (row.firstIn ? "" : undefined),
        punchOutTime: clearPunches ? undefined : punchOutTime || (row.lastOut ? "" : undefined),
        punchOutNextDay,
        clearPunches,
        status: status || undefined,
        workMode: workMode || undefined,
      });
      toast({ title: "Attendance updated", status: "success", duration: 3000 });
      onSaved();
      onClose();
    } catch (error: any) {
      toast({
        title: "Unable to update attendance",
        description: getApiErrorMessage(error?.response?.data || error, "Attendance update failed"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix="Adjust attendance"
      titleSuffix={row?.attendanceDate || ""}
      subtitle={row ? `${row.employee.name} | ${row.employee.code}` : ""}
      maxW={{ base: "100%", md: "620px" }}
      footerContent={
        <Stack direction="row" justify="flex-end" w="100%">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="blue"
            onClick={submit}
            isLoading={submitting}
            isDisabled={!row || reason.trim().length < 3 || row.state === "finalized"}
          >
            Save adjustment
          </Button>
        </Stack>
      }
    >
      <Stack spacing={5}>
        {row?.state === "finalized" ? (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertDescription>Reopen this finalized record before changing it.</AlertDescription>
          </Alert>
        ) : null}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isDisabled={clearPunches}>
            <FormLabel>Punch in</FormLabel>
            <Input type="time" value={punchInTime} onChange={(event) => setPunchInTime(event.target.value)} />
          </FormControl>
          <FormControl isDisabled={clearPunches}>
            <FormLabel>Final punch out</FormLabel>
            <Input type="time" value={punchOutTime} onChange={(event) => setPunchOutTime(event.target.value)} />
          </FormControl>
        </SimpleGrid>
        <Stack spacing={3}>
          <Checkbox isChecked={punchOutNextDay} onChange={(event) => setPunchOutNextDay(event.target.checked)} isDisabled={clearPunches}>
            Punch-out is on the next day
          </Checkbox>
          <Checkbox isChecked={clearPunches} onChange={(event) => setClearPunches(event.target.checked)}>
            Clear recorded punches
          </Checkbox>
        </Stack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>Attendance status</FormLabel>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Calculate from punches</option>
              <option value="pending">Pending</option>
              <option value="present">Present</option>
              <option value="half_day">Half day</option>
              <option value="absent">Absent</option>
              <option value="incomplete">Incomplete</option>
              <option value="holiday">Holiday</option>
              <option value="weekly_off">Weekly off</option>
            </Select>
            <FormHelperText>A selected status overrides the calculated result.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Work mode</FormLabel>
            <Select value={workMode} onChange={(event) => setWorkMode(event.target.value)}>
              <option value="office">Office</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="field">Field</option>
            </Select>
          </FormControl>
        </SimpleGrid>
        <FormControl isRequired>
          <FormLabel>Reason for adjustment</FormLabel>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what was verified and changed" maxLength={500} />
          <FormHelperText>This reason is saved in the attendance audit history.</FormHelperText>
        </FormControl>
      </Stack>
    </DashboardDrawer>
  );
}
