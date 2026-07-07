"use client";

import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  Select,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { FiFilter, FiRefreshCw, FiX } from "react-icons/fi";
import {
  DashboardOption,
  ScopedDashboardFilters,
  ScopedDashboardSummary,
} from "./types";

type DashboardFiltersProps = {
  role: "admin" | "departmenthead";
  value: ScopedDashboardFilters;
  options: ScopedDashboardSummary["filterOptions"];
  isLoading: boolean;
  onChange: (next: ScopedDashboardFilters) => void;
  onApply: () => void;
  onClear: () => void;
};

const batchOptions: DashboardOption[] = [
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const completionOptions: DashboardOption[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "not_started", label: "Not started" },
  { value: "pending", label: "Pending" },
];

const activityOptions: DashboardOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function FilterField({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: DashboardOption[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl>
      <FormLabel mb={1} fontSize="xs" color="gray.500">
        {label}
      </FormLabel>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="sm"
        borderRadius="lg"
        bg={useColorModeValue("white", "gray.800")}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}

export function DashboardFilters({
  role,
  value,
  options,
  isLoading,
  onChange,
  onApply,
  onClear,
}: DashboardFiltersProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isCompact = useBreakpointValue({ base: true, lg: false }) ?? true;
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const activeCount = Object.values(value).filter(Boolean).length;

  const update = (key: keyof ScopedDashboardFilters, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  const fields = (
    <Grid
      templateColumns={{
        base: "1fr",
        md: "repeat(2, minmax(0, 1fr))",
        xl: "repeat(4, minmax(0, 1fr))",
      }}
      gap={3}
    >
      <FormControl>
        <FormLabel mb={1} fontSize="xs" color="gray.500">
          From
        </FormLabel>
        <Input
          type="date"
          value={value.from}
          onChange={(event) => update("from", event.target.value)}
          size="sm"
          borderRadius="lg"
        />
      </FormControl>
      <FormControl>
        <FormLabel mb={1} fontSize="xs" color="gray.500">
          To
        </FormLabel>
        <Input
          type="date"
          value={value.to}
          onChange={(event) => update("to", event.target.value)}
          size="sm"
          borderRadius="lg"
        />
      </FormControl>
      {role === "admin" ? (
        <>
          <FilterField
            label="Department"
            value={value.departmentId}
            options={options?.departments || []}
            placeholder="All departments"
            onChange={(nextValue) => update("departmentId", nextValue)}
          />
          <FilterField
            label="Role"
            value={value.role}
            options={options?.roles || []}
            placeholder="All roles"
            onChange={(nextValue) => update("role", nextValue)}
          />
        </>
      ) : (
        <FilterField
          label="Learner"
          value={value.userId}
          options={options?.users || []}
          placeholder="All learners"
          onChange={(nextValue) => update("userId", nextValue)}
        />
      )}
      <FilterField
        label="Course"
        value={value.courseId}
        options={options?.courses || []}
        placeholder="All courses"
        onChange={(nextValue) => update("courseId", nextValue)}
      />
      <FilterField
        label="Batch"
        value={value.batchStatus}
        options={batchOptions}
        placeholder="All batch states"
        onChange={(nextValue) => update("batchStatus", nextValue)}
      />
      <FilterField
        label="Completion"
        value={value.completionStatus}
        options={completionOptions}
        placeholder="All completion states"
        onChange={(nextValue) => update("completionStatus", nextValue)}
      />
      <FilterField
        label="Account status"
        value={value.activityStatus}
        options={activityOptions}
        placeholder="All accounts"
        onChange={(nextValue) => update("activityStatus", nextValue)}
      />
    </Grid>
  );

  const actions = (
    <HStack justify="flex-end" mt={4}>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<FiX />}
        onClick={onClear}
        isDisabled={!activeCount || isLoading}
      >
        Clear
      </Button>
      <Button
        size="sm"
        colorScheme="purple"
        leftIcon={<FiRefreshCw />}
        onClick={() => {
          onApply();
          onClose();
        }}
        isLoading={isLoading}
      >
        Apply filters
      </Button>
    </HStack>
  );

  if (isCompact) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FiFilter />}
          onClick={onOpen}
          borderRadius="full"
          bg={bg}
        >
          Filters
          {activeCount ? (
            <Badge ml={2} colorScheme="purple" borderRadius="full">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
        <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent borderTopRadius="2xl" maxH="88dvh">
            <DrawerCloseButton />
            <DrawerHeader pb={2}>Dashboard filters</DrawerHeader>
            <DrawerBody>{fields}</DrawerBody>
            <DrawerFooter display="block">{actions}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Box
      bg={bg}
      w={'100%'}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={4}
      
      boxShadow="sm"
    >
      <HStack justify="space-between" mb={3}>
        <HStack>
          <FiFilter />
          <Text fontSize="sm" fontWeight="semibold">
            Filters
          </Text>
        </HStack>
        {activeCount ? (
          <Badge colorScheme="purple" borderRadius="full">
            {activeCount} active
          </Badge>
        ) : null}
      </HStack>
      {fields}
      {actions}
    </Box>
  );
}
