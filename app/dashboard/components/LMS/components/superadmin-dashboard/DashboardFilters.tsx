"use client";

import {
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
  Icon,
  Input,
  Select,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  DashboardFiltersValue,
  FilterOption,
} from "./types";

type DashboardFiltersProps = {
  value: DashboardFiltersValue;
  companies: FilterOption[];
  roles: FilterOption[];
  courses: FilterOption[];
  isLoading: boolean;
  onChange: (next: DashboardFiltersValue) => void;
  onApply: () => void;
  onReset: () => void;
};

const filterFields = [
  { key: "from", label: "From", type: "date" },
  { key: "to", label: "To", type: "date" },
] as const;

export function DashboardFilters({
  value,
  companies,
  roles,
  courses,
  isLoading,
  onChange,
  onApply,
  onReset,
}: DashboardFiltersProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const setField = (key: keyof DashboardFiltersValue, fieldValue: string) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const fields = (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(7, minmax(0, 1fr))" }}
      gap={3}
    >
      {filterFields.map((field) => (
        <FormControl key={field.key}>
          <FormLabel fontSize="xs" color={muted} mb={1}>
            {field.label}
          </FormLabel>
          <Input
            type={field.type}
            size="sm"
            value={value[field.key]}
            onChange={(event) => setField(field.key, event.target.value)}
          />
        </FormControl>
      ))}
      <FormControl>
        <FormLabel fontSize="xs" color={muted} mb={1}>
          Company
        </FormLabel>
        <Select
          size="sm"
          value={value.companyId}
          onChange={(event) => setField("companyId", event.target.value)}
        >
          <option value="">All companies</option>
          {companies.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="xs" color={muted} mb={1}>
          Role
        </FormLabel>
        <Select
          size="sm"
          value={value.role}
          onChange={(event) => setField("role", event.target.value)}
        >
          <option value="">All roles</option>
          {roles.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="xs" color={muted} mb={1}>
          Course
        </FormLabel>
        <Select
          size="sm"
          value={value.courseId}
          onChange={(event) => setField("courseId", event.target.value)}
        >
          <option value="">All courses</option>
          {courses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="xs" color={muted} mb={1}>
          Batch status
        </FormLabel>
        <Select
          size="sm"
          value={value.batchStatus}
          onChange={(event) => setField("batchStatus", event.target.value)}
        >
          <option value="">All batches</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="xs" color={muted} mb={1}>
          User status
        </FormLabel>
        <Select
          size="sm"
          value={value.activityStatus}
          onChange={(event) => setField("activityStatus", event.target.value)}
        >
          <option value="">All users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FormControl>
    </Grid>
  );

  return (
    <>
      <Box
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        p={4}
        boxShadow="sm"
      >
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={SlidersHorizontal} color="purple.500" boxSize={4} />
            <Text fontSize="sm" fontWeight="semibold">
              Analytics filters
            </Text>
          </HStack>
          <Button
            display={{ base: "inline-flex", xl: "none" }}
            size="sm"
            variant="outline"
            leftIcon={<Filter size={15} />}
            onClick={onOpen}
          >
            Filters
          </Button>
        </HStack>

        <Box display={{ base: "none", xl: "block" }} mt={3}>
          {fields}
          <HStack justify="flex-end" mt={3}>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<RotateCcw size={14} />}
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              size="sm"
              colorScheme="purple"
              isLoading={isLoading}
              onClick={onApply}
            >
              Apply filters
            </Button>
          </HStack>
        </Box>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Dashboard filters</DrawerHeader>
          <DrawerBody>{fields}</DrawerBody>
          <DrawerFooter gap={2}>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button
              colorScheme="purple"
              isLoading={isLoading}
              onClick={() => {
                onApply();
                onClose();
              }}
            >
              Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
