"use client";

import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

type Props = { companyId: string; canManage: boolean };

type PayrollSettingsForm = {
  currency: string;
  currencyMinorUnits: number;
  payFrequency: "monthly";
  payDay: number;
  roundingMode: "nearest" | "floor" | "ceil";
  employeeCompensationVisibility: "hidden" | "current" | "history";
};

const defaults: PayrollSettingsForm = {
  currency: "INR",
  currencyMinorUnits: 2,
  payFrequency: "monthly",
  payDay: 31,
  roundingMode: "nearest",
  employeeCompensationVisibility: "hidden",
};

function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

export default function PayrollSettingsPanel({ companyId, canManage }: Props) {
  const toast = useToast();
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/payroll/settings", { params: { companyId } });
      setForm({ ...defaults, ...(data.data || {}) });
    } catch (error) {
      toast({ title: "Unable to load payroll settings", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await axios.patch("/payroll/settings", { companyId, ...form });
      setForm({ ...defaults, ...(data.data || {}) });
      toast({ title: "Payroll settings updated", status: "success" });
    } catch (error) {
      toast({ title: "Unable to update payroll settings", description: message(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton h="280px" borderRadius="md" />;

  return (
    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={{ base: 4, md: 6 }}>
      <Stack spacing={6} maxW="900px">
        <Box>
          <Text fontSize="lg" fontWeight="800">Payroll settings</Text>
          <Text mt={1} fontSize="sm" color={muted}>Defaults copied into each salary-structure version. Existing published versions never change.</Text>
        </Box>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <FormControl isRequired>
            <FormLabel>Currency</FormLabel>
            <Input value={form.currency} maxLength={3} isDisabled={!canManage} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") }))} />
            <FormHelperText>Three-letter code, for example INR, USD, or AED.</FormHelperText>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Currency decimal places</FormLabel>
            <Select value={form.currencyMinorUnits} isDisabled={!canManage} onChange={(event) => setForm((value) => ({ ...value, currencyMinorUnits: Number(event.target.value) }))}>
              <option value={0}>0</option><option value={2}>2</option><option value={3}>3</option>
            </Select>
            <FormHelperText>INR and USD use 2. JPY uses 0. Some currencies use 3.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Pay frequency</FormLabel>
            <Select value={form.payFrequency} isDisabled>
              <option value="monthly">Monthly</option>
            </Select>
            <FormHelperText>Monthly is aligned with the current attendance payroll handoff.</FormHelperText>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Pay day</FormLabel>
            <Input type="number" min={1} max={31} value={form.payDay} isDisabled={!canManage} onChange={(event) => setForm((value) => ({ ...value, payDay: Number(event.target.value) }))} />
            <FormHelperText>For shorter months, the final calendar day is used.</FormHelperText>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Percentage rounding</FormLabel>
            <Select value={form.roundingMode} isDisabled={!canManage} onChange={(event) => setForm((value) => ({ ...value, roundingMode: event.target.value as PayrollSettingsForm["roundingMode"] }))}>
              <option value="nearest">Nearest minor unit</option>
              <option value="floor">Always round down</option>
              <option value="ceil">Always round up</option>
            </Select>
            <FormHelperText>Applied when percentage-based components produce fractions.</FormHelperText>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Employee compensation visibility</FormLabel>
            <Select
              value={form.employeeCompensationVisibility}
              isDisabled={!canManage}
              onChange={(event) => setForm((value) => ({
                ...value,
                employeeCompensationVisibility: event.target.value as PayrollSettingsForm["employeeCompensationVisibility"],
              }))}
            >
              <option value="hidden">Hide compensation details</option>
              <option value="current">Current compensation only</option>
              <option value="history">Current compensation and history</option>
            </Select>
            <FormHelperText>Future and cancelled assignments, audit reasons, and internal actor details are never shown.</FormHelperText>
          </FormControl>
        </SimpleGrid>
        {canManage ? <Button alignSelf="flex-start" colorScheme="blue" isLoading={saving} isDisabled={!/^[A-Z]{3}$/.test(form.currency) || form.payDay < 1 || form.payDay > 31} onClick={() => void save()}>Save settings</Button> : null}
      </Stack>
    </Box>
  );
}

