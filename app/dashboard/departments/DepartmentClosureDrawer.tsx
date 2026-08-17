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
  Flex,
  FormControl,
  FormLabel,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  DepartmentArchiveImpact,
  DepartmentTransferPreview,
  departmentStore,
} from "@/app/store/departmentStore/departmentStore";
import { useEffect, useMemo, useState } from "react";

type EmployeeOverride = {
  targetDepartmentId?: string;
  targetTeamId?: string;
};

const DepartmentClosureDrawer = ({
  isOpen,
  onClose,
  departmentId,
  onTransferred,
}: {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: string | null;
  onTransferred: (_impact: DepartmentArchiveImpact) => void;
}) => {
  const [preview, setPreview] = useState<DepartmentTransferPreview | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [teamMappings, setTeamMappings] = useState<Record<string, string>>({});
  const [employeeOverrides, setEmployeeOverrides] = useState<
    Record<string, EmployeeOverride>
  >({});
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const surface = useColorModeValue("white", "gray.900");
  const subtle = useColorModeValue("gray.50", "gray.800");

  useEffect(() => {
    if (!isOpen || !departmentId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setPreview(null);
    setTargetDepartmentId("");
    setTeamMappings({});
    setEmployeeOverrides({});
    setReason("");

    departmentStore
      .getDepartmentTransferPreview(departmentId)
      .then((data) => {
        setPreview(data);
        if (data.destinations.length === 1) {
          setTargetDepartmentId(data.destinations[0]._id);
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Failed to load employee transfer details"
        );
      })
      .finally(() => setIsLoading(false));
  }, [departmentId, isOpen]);

  const defaultDestination = useMemo(
    () =>
      preview?.destinations.find(
        (department) => department._id === targetDepartmentId
      ) || null,
    [preview, targetDepartmentId]
  );

  const updateEmployeeOverride = (
    employeeId: string,
    changes: EmployeeOverride
  ) => {
    setEmployeeOverrides((current) => {
      const next = {
        ...current,
        [employeeId]: {
          ...(current[employeeId] || {}),
          ...changes,
        },
      };

      if (
        !next[employeeId].targetDepartmentId &&
        !Object.prototype.hasOwnProperty.call(
          next[employeeId],
          "targetTeamId"
        )
      ) {
        delete next[employeeId];
      }

      return next;
    });
  };

  const getEmployeeDestination = (employeeId: string) => {
    const destinationId =
      employeeOverrides[employeeId]?.targetDepartmentId ||
      targetDepartmentId;
    return (
      preview?.destinations.find(
        (department) => department._id === destinationId
      ) || null
    );
  };

  const submitTransfer = async () => {
    if (
      !departmentId ||
      !preview ||
      !targetDepartmentId ||
      reason.trim().length < 3
    ) {
      return;
    }

    setError("");
    try {
      const overrides = Object.entries(employeeOverrides).map(
        ([employeeId, override]) => ({
          employeeId,
          ...(override.targetDepartmentId
            ? { targetDepartmentId: override.targetDepartmentId }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(override, "targetTeamId")
            ? { targetTeamId: override.targetTeamId }
            : {}),
        })
      );
      const response = await departmentStore.transferDepartmentEmployees(
        departmentId,
        {
          targetDepartmentId,
          reason: reason.trim(),
          teamMappings: preview.sourceDepartment.teams.map((team) => ({
            sourceTeamId: team._id,
            sourceTeamName: team.name,
            targetTeamId: teamMappings[team._id] || "",
          })),
          employeeOverrides: overrides,
        }
      );

      onTransferred(response.data.impact);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          departmentStore.error ||
          "Failed to transfer employees"
      );
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" size="full" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg={surface}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pr={12}>
          <Text>Transfer Employees</Text>
          <Text fontSize="sm" color={muted} fontWeight="500" mt={1}>
            {preview?.sourceDepartment.departmentName ||
              "Department closure workflow"}
          </Text>
        </DrawerHeader>

        <DrawerBody py={5}>
          {isLoading ? (
            <Flex justify="center" py={16}>
              <Spinner color="blue.500" />
            </Flex>
          ) : error && !preview ? (
            <Box
              borderWidth="1px"
              borderColor="red.200"
              bg="red.50"
              color="red.700"
              borderRadius="md"
              p={4}
            >
              {error}
            </Box>
          ) : preview ? (
            <VStack align="stretch" spacing={6}>
              {error ? (
                <Box
                  borderWidth="1px"
                  borderColor="red.200"
                  bg="red.50"
                  color="red.700"
                  borderRadius="md"
                  p={4}
                >
                  {error}
                </Box>
              ) : null}

              <Flex
                justify="space-between"
                align={{ base: "start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap={3}
              >
                <Box>
                  <Text fontWeight="700">
                    {preview.employees.length} employees will be transferred
                  </Text>
                  <Text color={muted} fontSize="sm">
                    Reporting-manager relationships will remain unchanged.
                  </Text>
                </Box>
                {preview.sourceDepartment.departmentHeadId ? (
                  <Badge colorScheme="orange">
                    Department head will become an employee
                  </Badge>
                ) : null}
              </Flex>

              <FormControl isRequired>
                <FormLabel>Default Destination Department</FormLabel>
                <Select
                  value={targetDepartmentId}
                  onChange={(event) => {
                    setTargetDepartmentId(event.target.value);
                    setTeamMappings({});
                    setEmployeeOverrides({});
                  }}
                >
                  <option value="">Select destination</option>
                  {preview.destinations.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.departmentName}
                      {department.code ? ` (${department.code})` : ""}
                    </option>
                  ))}
                </Select>
                {preview.destinations.length === 0 ? (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    Create another department before transferring employees.
                  </Text>
                ) : null}
              </FormControl>

              {preview.sourceDepartment.teams.length > 0 ? (
                <Box>
                  <Text fontWeight="700" mb={1}>
                    Default Team Mapping
                  </Text>
                  <Text color={muted} fontSize="sm" mb={3}>
                    Employees from unmapped teams will move without a team.
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {preview.sourceDepartment.teams.map((sourceTeam) => (
                      <Flex
                        key={sourceTeam._id}
                        align={{ base: "start", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        p={3}
                      >
                        <Text flex="1" fontWeight="600">
                          {sourceTeam.name}
                        </Text>
                        <Select
                          maxW={{ base: "100%", md: "360px" }}
                          value={teamMappings[sourceTeam._id] || ""}
                          onChange={(event) =>
                            setTeamMappings((current) => ({
                              ...current,
                              [sourceTeam._id]: event.target.value,
                            }))
                          }
                          isDisabled={!defaultDestination}
                        >
                          <option value="">No team</option>
                          {(defaultDestination?.teams || []).map((team) => (
                            <option key={team._id} value={team._id}>
                              {team.name}
                            </option>
                          ))}
                        </Select>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              ) : null}

              <Box>
                <Text fontWeight="700" mb={1}>
                  Employee Overrides
                </Text>
                <Text color={muted} fontSize="sm" mb={3}>
                  Leave an override blank to use the default department and team
                  mapping.
                </Text>
                <Box
                  overflowX="auto"
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                >
                  <Table size="sm">
                    <Thead bg={subtle}>
                      <Tr>
                        <Th>Employee</Th>
                        <Th>Current Team</Th>
                        <Th>Department Override</Th>
                        <Th>Team Override</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {preview.employees.map((employee) => {
                        const override = employeeOverrides[employee._id] || {};
                        const destination = getEmployeeDestination(employee._id);
                        const hasTeamOverride = Object.prototype.hasOwnProperty.call(
                          override,
                          "targetTeamId"
                        );

                        return (
                          <Tr key={employee._id}>
                            <Td minW="220px">
                              <Text fontWeight="700">{employee.name}</Text>
                              <Text color={muted} fontSize="xs">
                                {employee.username}
                              </Text>
                            </Td>
                            <Td>{employee.team || "--"}</Td>
                            <Td minW="240px">
                              <Select
                                size="sm"
                                value={override.targetDepartmentId || ""}
                                onChange={(event) => {
                                  const nextDepartmentId = event.target.value;
                                  setEmployeeOverrides((current) => {
                                    const nextOverride: EmployeeOverride = {
                                      ...(current[employee._id] || {}),
                                    };
                                    if (nextDepartmentId) {
                                      nextOverride.targetDepartmentId =
                                        nextDepartmentId;
                                    } else {
                                      delete nextOverride.targetDepartmentId;
                                    }
                                    delete nextOverride.targetTeamId;

                                    const next = {
                                      ...current,
                                      [employee._id]: nextOverride,
                                    };
                                    if (
                                      !nextOverride.targetDepartmentId &&
                                      !Object.prototype.hasOwnProperty.call(
                                        nextOverride,
                                        "targetTeamId"
                                      )
                                    ) {
                                      delete next[employee._id];
                                    }
                                    return next;
                                  });
                                }}
                              >
                                <option value="">Use default</option>
                                {preview.destinations.map((department) => (
                                  <option
                                    key={department._id}
                                    value={department._id}
                                  >
                                    {department.departmentName}
                                  </option>
                                ))}
                              </Select>
                            </Td>
                            <Td minW="220px">
                              <Select
                                size="sm"
                                value={
                                  hasTeamOverride
                                    ? override.targetTeamId || "__none__"
                                    : "__mapping__"
                                }
                                onChange={(event) => {
                                  if (event.target.value === "__mapping__") {
                                    setEmployeeOverrides((current) => {
                                      const nextOverride = {
                                        ...(current[employee._id] || {}),
                                      };
                                      delete nextOverride.targetTeamId;
                                      const next = {
                                        ...current,
                                        [employee._id]: nextOverride,
                                      };
                                      if (!nextOverride.targetDepartmentId) {
                                        delete next[employee._id];
                                      }
                                      return next;
                                    });
                                    return;
                                  }

                                  updateEmployeeOverride(employee._id, {
                                    targetTeamId:
                                      event.target.value === "__none__"
                                        ? ""
                                        : event.target.value,
                                  });
                                }}
                                isDisabled={!destination}
                              >
                                <option value="__mapping__">
                                  Use default mapping
                                </option>
                                <option value="__none__">No team</option>
                                {(destination?.teams || []).map((team) => (
                                  <option key={team._id} value={team._id}>
                                    {team.name}
                                  </option>
                                ))}
                              </Select>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </Box>

              <FormControl isRequired>
                <FormLabel>Transfer Reason</FormLabel>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why are these employees being transferred?"
                  minH="96px"
                />
                <Text color={muted} fontSize="xs" mt={1}>
                  Stored against every employee assignment-history record.
                </Text>
              </FormControl>
            </VStack>
          ) : null}
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderColor={borderColor} gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            isLoading={departmentStore.isSubmitting}
            isDisabled={
              !preview ||
              preview.employees.length === 0 ||
              !targetDepartmentId ||
              reason.trim().length < 3
            }
            onClick={submitTransfer}
          >
            Transfer {preview?.employees.length || 0} Employees
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DepartmentClosureDrawer;
