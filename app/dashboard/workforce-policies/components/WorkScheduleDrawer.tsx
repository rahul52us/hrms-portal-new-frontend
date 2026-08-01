"use client";

import {
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  PolicyVersion,
  WorkforcePolicyItem,
  WorkScheduleRules,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

const REGULAR_WORK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Sunday",
];

const DEFAULT_RULES: WorkScheduleRules = {
  timezone: "Asia/Kolkata",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  saturdayRule: "all_off",
  customSaturdayOffWeeks: [],
  startTime: "09:30",
  endTime: "18:30",
  unpaidBreakMinutes: 60,
};

type WorkScheduleDrawerMode = "create" | "edit_draft" | "new_version";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: WorkScheduleDrawerMode;
  resource?: WorkforcePolicyItem | null;
  version?: PolicyVersion | null;
  onSaved: () => Promise<void> | void;
};

function dateValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function WorkScheduleDrawer({
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
  const [changeReason, setChangeReason] = useState("");
  const [rules, setRules] = useState<WorkScheduleRules>(DEFAULT_RULES);

  useEffect(() => {
    if (!isOpen) return;
    const sourceRules = (version?.rules ||
      resource?.latestPublishedVersion?.rules ||
      DEFAULT_RULES) as WorkScheduleRules;
    setName(resource?.name || "");
    setCode(resource?.code || "");
    setDescription(resource?.description || "");
    setEffectiveFrom(mode === "new_version" ? "" : dateValue(version?.effectiveFrom));
    setChangeReason(
      mode === "create"
        ? "Initial work schedule"
        : mode === "new_version"
          ? ""
          : version?.changeReason || ""
    );
    setRules({
      ...DEFAULT_RULES,
      ...sourceRules,
      workingDays: sourceRules.workingDays || DEFAULT_RULES.workingDays,
      customSaturdayOffWeeks: sourceRules.customSaturdayOffWeeks || [],
    });
  }, [isOpen, mode, resource, version]);

  const title =
    mode === "create"
      ? "New work schedule"
      : mode === "new_version"
        ? `New version of ${resource?.name || "schedule"}`
        : `Edit ${resource?.name || "schedule"} draft`;
  const spansNextDay = timeToMinutes(rules.endTime) < timeToMinutes(rules.startTime);
  const validationError = useMemo(() => {
    if (mode === "create" && (!name.trim() || !code.trim())) {
      return "Schedule name and code are required.";
    }
    if (!effectiveFrom) return "Effective-from date is required before publishing.";
    if (!rules.workingDays.length && rules.saturdayRule === "all_off") {
      return "Select at least one working day.";
    }
    if (rules.startTime === rules.endTime) {
      return "Schedule start and end time cannot be the same.";
    }
    const startMinutes = timeToMinutes(rules.startTime);
    const endMinutes = timeToMinutes(rules.endTime);
    const duration =
      endMinutes > startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;
    if (Number(rules.unpaidBreakMinutes) >= duration) {
      return "Unpaid break must be shorter than the scheduled shift.";
    }
    if (
      rules.saturdayRule === "custom_weeks_off" &&
      !rules.customSaturdayOffWeeks.length
    ) {
      return "Select the Saturday week numbers that are off.";
    }
    if (mode !== "create" && changeReason.trim().length < 3) {
      return "Describe why this schedule version is changing.";
    }
    return "";
  }, [changeReason, code, effectiveFrom, mode, name, rules]);

  const setRule = (key: keyof WorkScheduleRules, value: any) => {
    setRules((current) => ({ ...current, [key]: value }));
  };

  const toggleWorkingDay = (day: string, checked: boolean) => {
    setRules((current) => {
      const selectedDays = new Set(current.workingDays);
      if (checked) selectedDays.add(day);
      else selectedDays.delete(day);
      return {
        ...current,
        workingDays: REGULAR_WORK_DAYS.filter((weekDay) => selectedDays.has(weekDay)),
      };
    });
  };

  const toggleSaturdayWeek = (week: number, checked: boolean) => {
    setRules((current) => {
      const selectedWeeks = new Set(current.customSaturdayOffWeeks);
      if (checked) selectedWeeks.add(week);
      else selectedWeeks.delete(week);
      return {
        ...current,
        customSaturdayOffWeeks: Array.from(selectedWeeks).sort((left, right) => left - right),
      };
    });
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
        changeReason: changeReason.trim(),
        rules,
      };
      let scheduleId = resource?._id || "";
      let versionId = version?._id || "";
      if (mode === "create") {
        const created = await workforcePolicyStore.createWorkSchedule({
          ...payload,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });
        scheduleId = created?.data?.schedule?._id;
        versionId = created?.data?.version?._id;
      } else if (mode === "new_version") {
        const created = await workforcePolicyStore.createWorkScheduleVersion(scheduleId, payload);
        versionId = created?.data?._id;
      } else {
        await workforcePolicyStore.updateWorkScheduleDraft(scheduleId, versionId, payload);
      }
      if (publish) {
        await workforcePolicyStore.publishWorkScheduleVersion(scheduleId, versionId, {
          companyId,
          effectiveFrom,
          changeReason: changeReason.trim(),
        });
      }
      await onSaved();
      toast({
        title: publish ? "Work schedule published" : "Work schedule draft saved",
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save work schedule", status: "error", duration: 5000 });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">{title}</Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">
            Work schedule versions preserve the expected days and hours used for historical attendance.
          </Text>
        </DrawerHeader>

        <DrawerBody py={5}>
          <Stack spacing={6}>
            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Schedule identity</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired isDisabled={mode !== "create"}>
                  <FormLabel fontSize="sm">Name</FormLabel>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="General office schedule" />
                </FormControl>
                <FormControl isRequired isDisabled={mode !== "create"}>
                  <FormLabel fontSize="sm">Code</FormLabel>
                  <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="SCH-GENERAL" />
                </FormControl>
              </SimpleGrid>
              {mode === "create" ? (
                <FormControl mt={4}>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
                </FormControl>
              ) : null}
            </Box>

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Validity and timezone</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Effective from</FormLabel>
                  <Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Timezone</FormLabel>
                  <Input value={rules.timezone} onChange={(event) => setRule("timezone", event.target.value)} placeholder="Asia/Kolkata" />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Weekly pattern</Text>
              <FormControl>
                <FormLabel fontSize="sm">Regular working days</FormLabel>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                  {REGULAR_WORK_DAYS.map((day) => (
                    <Checkbox
                      key={day}
                      id={`schedule-working-day-${day.toLowerCase()}`}
                      name="scheduleWorkingDays"
                      value={day}
                      isChecked={rules.workingDays.includes(day)}
                      onChange={(event) => toggleWorkingDay(day, event.target.checked)}
                    >
                      {day}
                    </Checkbox>
                  ))}
                </SimpleGrid>
                <FormHelperText>Saturday is controlled separately below.</FormHelperText>
              </FormControl>
              <FormControl mt={4}>
                <FormLabel fontSize="sm">Saturday rule</FormLabel>
                <Select value={rules.saturdayRule} onChange={(event) => setRule("saturdayRule", event.target.value)}>
                  <option value="working">Every Saturday working</option>
                  <option value="all_off">Every Saturday off</option>
                  <option value="first_and_third_off">First and third Saturday off</option>
                  <option value="second_and_fourth_off">Even Saturdays off (2nd and 4th)</option>
                  <option value="custom_weeks_off">Custom Saturday weeks off</option>
                </Select>
              </FormControl>
              {rules.saturdayRule === "custom_weeks_off" ? (
                <FormControl mt={4}>
                  <FormLabel fontSize="sm">Saturday weeks that are off</FormLabel>
                  <HStack spacing={5} wrap="wrap">
                    {[1, 2, 3, 4, 5].map((week) => (
                      <Checkbox
                        key={week}
                        id={`schedule-saturday-week-${week}`}
                        name="scheduleCustomSaturdayOffWeeks"
                        value={String(week)}
                        isChecked={rules.customSaturdayOffWeeks.includes(week)}
                        onChange={(event) => toggleSaturdayWeek(week, event.target.checked)}
                      >
                        Week {week}
                      </Checkbox>
                    ))}
                  </HStack>
                </FormControl>
              ) : null}
            </Box>

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Scheduled hours</Text>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Start time</FormLabel>
                  <Input type="time" value={rules.startTime} onChange={(event) => setRule("startTime", event.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">End time</FormLabel>
                  <Input type="time" value={rules.endTime} onChange={(event) => setRule("endTime", event.target.value)} />
                  {spansNextDay ? <FormHelperText>Ends on the following day.</FormHelperText> : null}
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Unpaid break (minutes)</FormLabel>
                  <NumberInput min={0} value={rules.unpaidBreakMinutes} onChange={(_, value) => setRule("unpaidBreakMinutes", value || 0)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </Box>

            <FormControl isRequired={mode !== "create"}>
              <FormLabel fontSize="sm">Change reason</FormLabel>
              <Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} rows={2} placeholder="Why these scheduled hours apply from this date" />
            </FormControl>
          </Stack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" gap={3} flexDirection={{ base: "column-reverse", sm: "row" }}>
          <Button w={{ base: "full", sm: "auto" }} variant="ghost" onClick={onClose}>Cancel</Button>
          <Button w={{ base: "full", sm: "auto" }} variant="outline" onClick={() => save(false)} isLoading={workforcePolicyStore.submitting}>Save draft</Button>
          <Button w={{ base: "full", sm: "auto" }} colorScheme="blue" onClick={() => save(true)} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>Save and publish</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
