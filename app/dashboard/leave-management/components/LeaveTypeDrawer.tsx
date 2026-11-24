"use client";

import {
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
  FormErrorMessage,
  FormLabel,
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
import {
  LeaveTypeItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import { leaveTypeFieldErrors } from "./leaveFormValidation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  leaveType?: LeaveTypeItem | null;
  onSaved: () => Promise<void> | void;
};

export default function LeaveTypeDrawer({
  isOpen,
  onClose,
  companyId,
  leaveType,
  onSaved,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [paid, setPaid] = useState(true);
  const [balanceTracked, setBalanceTracked] = useState(true);
  const [unit, setUnit] = useState<"days" | "hours">("days");
  const [allowHalfDay, setAllowHalfDay] = useState(true);
  const [color, setColor] = useState("#3182CE");
  const [displayOrder, setDisplayOrder] = useState("0");

  useEffect(() => {
    if (!isOpen) return;
    setName(leaveType?.name || "");
    setCode(leaveType?.code || "");
    setDescription(leaveType?.description || "");
    setPaid(leaveType?.paid ?? true);
    setBalanceTracked(leaveType?.balanceTracked ?? true);
    setUnit(leaveType?.unit || "days");
    setAllowHalfDay(leaveType?.allowHalfDay ?? true);
    setColor(leaveType?.color || "#3182CE");
    setDisplayOrder(String(leaveType?.displayOrder || 0));
  }, [isOpen, leaveType]);

  const fieldErrors = useMemo(() => leaveTypeFieldErrors({ name, code, color }), [code, color, name]);
  const validationError = Object.values(fieldErrors)[0] || "";

  const save = async () => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 3500 });
      return;
    }
    try {
      const payload = {
        companyId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        paid,
        balanceTracked,
        unit,
        allowHalfDay: unit === "days" && allowHalfDay,
        color,
        displayOrder: Number(displayOrder || 0),
      };
      if (leaveType) {
        await workforcePolicyStore.updateLeaveType(leaveType._id, payload);
      } else {
        await workforcePolicyStore.createLeaveType(payload);
      }
      await onSaved();
      toast({ title: leaveType ? "Leave type updated" : "Leave type created", status: "success" });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save leave type", status: "error", duration: 5000 });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">{leaveType ? "Edit leave type" : "Create leave type"}</Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">
            Codes such as CL, SL and PL remain company-specific.
          </Text>
        </DrawerHeader>
        <DrawerBody py={5}>
          <Stack spacing={5}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired isInvalid={Boolean(fieldErrors.name)}>
                <FormLabel fontSize="sm">Name</FormLabel>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Casual Leave" />
                <FormErrorMessage>{fieldErrors.name}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={Boolean(fieldErrors.code)}>
                <FormLabel fontSize="sm">Code</FormLabel>
                <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="CL" />
                <FormErrorMessage>{fieldErrors.code}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel fontSize="sm">Description</FormLabel>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </FormControl>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Unit</FormLabel>
                <Select value={unit} onChange={(event) => setUnit(event.target.value as "days" | "hours")}>
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Display order</FormLabel>
                <Input type="number" min={0} value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} />
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              <Checkbox isChecked={paid} onChange={(event) => setPaid(event.target.checked)}>Paid leave</Checkbox>
              <Checkbox isChecked={balanceTracked} onChange={(event) => setBalanceTracked(event.target.checked)}>Track balance</Checkbox>
              <Checkbox isChecked={allowHalfDay} isDisabled={unit !== "days"} onChange={(event) => setAllowHalfDay(event.target.checked)}>Allow half day</Checkbox>
            </SimpleGrid>
            <FormControl isInvalid={Boolean(fieldErrors.color)}>
              <FormLabel fontSize="sm">Display color</FormLabel>
              <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} maxW="100px" p={1} />
              <FormErrorMessage>{fieldErrors.color}</FormErrorMessage>
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={3} flexWrap="wrap">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Tooltip label={validationError} isDisabled={!validationError} shouldWrapChildren hasArrow>
            <Button colorScheme="blue" onClick={save} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>
              {leaveType ? "Save changes" : "Create leave type"}
            </Button>
          </Tooltip>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
