"use client";

import { Box, Checkbox, Flex, FormControl, FormHelperText, FormLabel, HStack, IconButton, Input, Select, SimpleGrid, Stack, Text, Textarea, Tooltip } from "@chakra-ui/react";
import AsyncSelect from "react-select/async";
import { FiArrowDown, FiArrowUp, FiTrash2 } from "react-icons/fi";
import { onboardingGet, ownerLabels, Page, Person, Task } from "./onboardingApi";

export type TaskForm = Omit<Task, "dueDays"> & { key: string; dueWhen: "on" | "before" | "after"; dueAmount: string };
export const taskForm = (task?: Task): TaskForm => ({ _id: task?._id, key: task?._id || crypto.randomUUID(), title: task?.title || "", instructions: task?.instructions || "", owner: task?.owner || "employee", ownerUser: task?.ownerUser || null, ownerNameSnapshot: task?.ownerNameSnapshot || "", required: task?.required ?? true, requiresDocument: task?.requiresDocument ?? false, dueWhen: !task?.dueDays ? "on" : task.dueDays < 0 ? "before" : "after", dueAmount: task?.dueDays ? String(Math.abs(task.dueDays)) : "" });
export const taskPayload = (task: TaskForm): Task => {
  const amount = task.dueWhen === "on" ? 0 : Number(task.dueAmount);
  if (!Number.isSafeInteger(amount) || (task.dueWhen !== "on" && amount < 1)) throw new Error(`Enter a whole number of days for ${task.title || "each task"}.`);
  return { ...(task._id ? { _id: task._id } : {}), title: task.title.trim(), instructions: task.instructions.trim(), owner: task.owner, ownerUser: task.owner === "specific_user" ? task.ownerUser : null, ownerNameSnapshot: "", required: task.required, requiresDocument: task.requiresDocument, dueDays: task.dueWhen === "before" ? -amount : amount };
};
export default function TemplateTaskEditor({ task, index, count, disabled, onChange, onRemove, onMove }: {
  task: TaskForm; index: number; count: number; disabled: boolean; onChange: (value: TaskForm) => void; onRemove: () => void; onMove: (offset: number) => void;
}) {
  const field = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => onChange({ ...task, [key]: value });
  const prefix = `onboarding-task-${task.key}`;
  const people = async (search: string) => {
    const result = await onboardingGet<Page<Person>>("/people", { search: search || undefined, limit: 20 });
    return result.data.map((person) => ({ value: person._id, label: `${person.name || "Employee"}${person.code ? ` (${person.code})` : ""}` }));
  };
  return <Box borderWidth="1px" borderRadius="md" p={{ base: 3, md: 4 }} minW={0}><Stack spacing={4}>
    <Flex justify="space-between" align="center" gap={2}><Text fontWeight="700">Task {index + 1}</Text><HStack spacing={1}>
      <Tooltip label="Move task up"><IconButton aria-label={`Move task ${index + 1} up`} size="sm" variant="ghost" icon={<FiArrowUp />} isDisabled={disabled || index === 0} onClick={() => onMove(-1)} /></Tooltip>
      <Tooltip label="Move task down"><IconButton aria-label={`Move task ${index + 1} down`} size="sm" variant="ghost" icon={<FiArrowDown />} isDisabled={disabled || index === count - 1} onClick={() => onMove(1)} /></Tooltip>
      <Tooltip label="Remove task"><IconButton aria-label={`Remove task ${index + 1}`} size="sm" variant="ghost" colorScheme="red" icon={<FiTrash2 />} isDisabled={disabled} onClick={onRemove} /></Tooltip>
    </HStack></Flex>
    <FormControl isRequired><FormLabel htmlFor={`${prefix}-title`}>Task title</FormLabel><Input id={`${prefix}-title`} maxLength={150} value={task.title} isDisabled={disabled} placeholder="Collect identity documents" onChange={(e) => field("title", e.target.value)} /></FormControl>
    <FormControl><FormLabel htmlFor={`${prefix}-instructions`}>Instructions</FormLabel><Textarea id={`${prefix}-instructions`} maxLength={2000} value={task.instructions} isDisabled={disabled} onChange={(e) => field("instructions", e.target.value)} /></FormControl>
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} minW={0}>
      <FormControl isRequired><FormLabel htmlFor={`${prefix}-owner`}>Task owner</FormLabel><Select id={`${prefix}-owner`} value={task.owner} isDisabled={disabled} onChange={(e) => onChange({ ...task, owner: e.target.value as Task["owner"], ownerUser: null, ownerNameSnapshot: "" })}>{Object.entries(ownerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormControl>
      {task.owner === "specific_user" && <FormControl isRequired minW={0}><FormLabel htmlFor={`${prefix}-person`}>Person responsible</FormLabel><AsyncSelect inputId={`${prefix}-person`} isDisabled={disabled} isClearable defaultOptions loadOptions={people} value={task.ownerUser ? { value: task.ownerUser, label: task.ownerNameSnapshot || "Selected person" } : null} onChange={(value) => onChange({ ...task, ownerUser: value?.value || null, ownerNameSnapshot: value?.label || "" })} placeholder="Search name or employee code" noOptionsMessage={() => "No active people found"} /></FormControl>}
      <FormControl isRequired><FormLabel htmlFor={`${prefix}-due`}>Due</FormLabel><Select id={`${prefix}-due`} value={task.dueWhen} isDisabled={disabled} onChange={(e) => onChange({ ...task, dueWhen: e.target.value as TaskForm["dueWhen"], dueAmount: "" })}><option value="on">On joining day</option><option value="before">Before joining</option><option value="after">After joining</option></Select></FormControl>
      {task.dueWhen !== "on" && <FormControl isRequired><FormLabel htmlFor={`${prefix}-days`}>Number of days</FormLabel><Input id={`${prefix}-days`} type="number" min={1} max={task.dueWhen === "before" ? 90 : 365} step={1} value={task.dueAmount} isDisabled={disabled} onChange={(e) => field("dueAmount", e.target.value)} /><FormHelperText>Calendar days {task.dueWhen} the joining date.</FormHelperText></FormControl>}
    </SimpleGrid>
    <Flex gap={6} wrap="wrap"><Checkbox id={`${prefix}-required`} isChecked={task.required} isDisabled={disabled} onChange={(e) => field("required", e.target.checked)}>Required task</Checkbox><Checkbox id={`${prefix}-document`} isChecked={task.requiresDocument} isDisabled={disabled} onChange={(e) => field("requiresDocument", e.target.checked)}>Document required to complete</Checkbox></Flex>
  </Stack></Box>;
}
