"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  PolicyVersion,
  WorkforcePolicyItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

type CalendarDrawerMode = "create" | "edit_draft" | "new_version";

type HolidayRow = {
  id: string;
  date: string;
  name: string;
  type: "mandatory" | "optional";
  isHalfDay: boolean;
  description: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: CalendarDrawerMode;
  resource?: WorkforcePolicyItem | null;
  version?: PolicyVersion | null;
  onSaved: () => Promise<void> | void;
};

function dateValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function blankHoliday(): HolidayRow {
  return {
    id: `${Date.now()}-${Math.random()}`,
    date: "",
    name: "",
    type: "mandatory",
    isHalfDay: false,
    description: "",
  };
}

export default function HolidayCalendarDrawer({
  isOpen,
  onClose,
  companyId,
  mode,
  resource,
  version,
  onSaved,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [changeReason, setChangeReason] = useState("");
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const source = version || resource?.latestPublishedVersion || null;
    setName(resource?.name || "");
    setCode(resource?.code || "");
    setDescription(resource?.description || "");
    setEffectiveFrom(mode === "new_version" ? "" : dateValue(source?.effectiveFrom));
    setTimezone(source?.timezone || "Asia/Kolkata");
    setChangeReason(
      mode === "create"
        ? "Initial holiday calendar"
        : mode === "new_version"
          ? ""
          : source?.changeReason || ""
    );
    setHolidays(
      (source?.holidays || []).map((holiday, index) => ({
        id: holiday._id || `${index}-${holiday.date}`,
        date: dateValue(holiday.date),
        name: holiday.name || "",
        type: holiday.type || "mandatory",
        isHalfDay: holiday.isHalfDay === true,
        description: holiday.description || "",
      }))
    );
  }, [isOpen, mode, resource, version]);

  const title =
    mode === "create"
      ? "New holiday calendar"
      : mode === "new_version"
        ? `New version of ${resource?.name || "calendar"}`
        : `Edit ${resource?.name || "calendar"} draft`;
  const validationError = useMemo(() => {
    if (mode === "create" && (!name.trim() || !code.trim())) {
      return "Calendar name and code are required.";
    }
    if (!effectiveFrom) return "Effective-from date is required before publishing.";
    if (mode !== "create" && changeReason.trim().length < 3) {
      return "Describe why this calendar version is changing.";
    }
    const incompleteHoliday = holidays.find((holiday) => !holiday.date || !holiday.name.trim());
    if (incompleteHoliday) return "Each holiday needs a date and name.";
    const dates = holidays.map((holiday) => holiday.date);
    if (new Set(dates).size !== dates.length) return "A calendar cannot contain duplicate holiday dates.";
    return "";
  }, [changeReason, code, effectiveFrom, holidays, mode, name]);

  const updateHoliday = (id: string, key: keyof HolidayRow, value: any) => {
    setHolidays((current) =>
      current.map((holiday) => (holiday.id === id ? { ...holiday, [key]: value } : holiday))
    );
  };

  const save = async (publish: boolean) => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 3500 });
      return;
    }
    try {
      const payload = {
        companyId,
        effectiveFrom,
        timezone,
        changeReason: changeReason.trim(),
        holidays: holidays.map((holiday) => ({
          date: holiday.date,
          name: holiday.name,
          type: holiday.type,
          isHalfDay: holiday.isHalfDay,
          description: holiday.description,
        })),
      };
      let calendarId = resource?._id || "";
      let versionId = version?._id || "";
      if (mode === "create") {
        const created = await workforcePolicyStore.createHolidayCalendar({
          ...payload,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });
        calendarId = created?.data?.calendar?._id;
        versionId = created?.data?.version?._id;
      } else if (mode === "new_version") {
        const created = await workforcePolicyStore.createHolidayVersion(calendarId, payload);
        versionId = created?.data?._id;
      } else {
        await workforcePolicyStore.updateHolidayDraft(calendarId, versionId, payload);
      }
      if (publish) {
        await workforcePolicyStore.publishHolidayVersion(calendarId, versionId, {
          companyId,
          effectiveFrom,
          changeReason: changeReason.trim(),
        });
      }
      await onSaved();
      toast({
        title: publish ? "Holiday calendar published" : "Holiday calendar draft saved",
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save holiday calendar", status: "error", duration: 5000 });
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix={mode === "create" ? "New" : mode === "new_version" ? "New version of" : "Edit"}
      titleSuffix={mode === "create" ? "holiday calendar" : `${resource?.name || "calendar"}${mode === 'edit_draft' ? ' draft' : ''}`}
      subtitle="Calendar versions preserve the holidays that applied to earlier attendance dates."
      maxW={{ base: "100%", md: "70%" }}
      footerContent={
        <Flex w="full" justify="flex-end" gap={3}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} isLoading={workforcePolicyStore.submitting}>Save draft</Button>
          <Button colorScheme="blue" onClick={() => save(true)} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>Save and publish</Button>
        </Flex>
      }
    >
      <Stack spacing={6} maxW="900px" mx="auto">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired isDisabled={mode !== "create"}>
            <FormLabel fontSize="sm">Calendar name</FormLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="India holiday calendar" />
          </FormControl>
          <FormControl isRequired isDisabled={mode !== "create"}>
            <FormLabel fontSize="sm">Code</FormLabel>
            <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="HOL-INDIA" />
          </FormControl>
        </SimpleGrid>
        {mode === "create" ? (
          <FormControl>
            <FormLabel fontSize="sm">Description</FormLabel>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
          </FormControl>
        ) : null}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Effective from</FormLabel>
            <Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Timezone</FormLabel>
            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          </FormControl>
        </SimpleGrid>

        <Box>
          <HStack mb={3} justify="space-between">
            <Box>
              <Text fontSize="sm" fontWeight="800">Holidays</Text>
              <Text fontSize="xs" color="gray.500">Dates are stored in this calendar version.</Text>
            </Box>
            <Button size="sm" leftIcon={<FiPlus />} onClick={() => setHolidays((current) => [...current, blankHoliday()])}>
              Add holiday
            </Button>
          </HStack>
          <Stack spacing={3}>
            {holidays.length === 0 ? (
              <Box borderWidth="1px" borderStyle="dashed" borderRadius="md" p={5} textAlign="center">
                <Text fontSize="sm" color="gray.500">No holidays added to this version.</Text>
              </Box>
            ) : null}
            {holidays.map((holiday) => (
              <Box key={holiday.id} borderWidth="1px" borderRadius="md" p={3}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Date</FormLabel>
                    <Input type="date" size="sm" value={holiday.date} onChange={(event) => updateHoliday(holiday.id, "date", event.target.value)} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Holiday name</FormLabel>
                    <Input size="sm" value={holiday.name} onChange={(event) => updateHoliday(holiday.id, "name", event.target.value)} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">Type</FormLabel>
                    <Select size="sm" value={holiday.type} onChange={(event) => updateHoliday(holiday.id, "type", event.target.value)}>
                      <option value="mandatory">Mandatory</option>
                      <option value="optional">Optional</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <Stack mt={3} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "end" }}>
                  <FormControl>
                    <FormLabel fontSize="xs">Description</FormLabel>
                    <Input size="sm" value={holiday.description} onChange={(event) => updateHoliday(holiday.id, "description", event.target.value)} />
                  </FormControl>
                  <Checkbox pb={2} isChecked={holiday.isHalfDay} onChange={(event) => updateHoliday(holiday.id, "isHalfDay", event.target.checked)} whiteSpace="nowrap">
                    Half day
                  </Checkbox>
                  <Tooltip label="Remove holiday">
                    <IconButton aria-label="Remove holiday" icon={<FiTrash2 />} size="sm" colorScheme="red" variant="ghost" onClick={() => setHolidays((current) => current.filter((item) => item.id !== holiday.id))} />
                  </Tooltip>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        <FormControl isRequired={mode !== "create"}>
          <FormLabel fontSize="sm">Change reason</FormLabel>
          <Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} rows={2} />
        </FormControl>
      </Stack>
    </DashboardDrawer>
  );
}
