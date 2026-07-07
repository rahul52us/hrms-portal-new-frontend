"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import stores from "@/app/store/stores";
import { courseStore } from "@/app/store/courseStore/courseStore";

const STEPS = [
  { title: "Course", description: "Choose a published course" },
  { title: "Scope", description: "Set the audience scope" },
  { title: "Options", description: "Configure assignment controls" },
  { title: "Summary", description: "Review before submitting" },
];

type ScopeType = "company" | "department" | "user";

function formatCourseMeta(course: any) {
  const categories = course?.taxonomy?.categories || [];
  return [course?.taxonomy?.level, categories[0]].filter(Boolean).join(" • ");
}

const CourseAccessGrantFlow = observer(() => {
  const toast = useToast();
  const { companyStore, auth } = stores;
  const [step, setStep] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [scopeType, setScopeType] = useState<ScopeType>("company");
  const [companyId, setCompanyId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [allowFurtherAssignment, setAllowFurtherAssignment] = useState(true);
  const [assignToAllUsers, setAssignToAllUsers] = useState(false);
  const [passingMarks, setPassingMarks] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const companies = companyStore.companies.data || [];
  const courses = courseStore.accessibleCourses || [];
  const selectedCompany = companies.find((company: any) => company._id === companyId);
  const availableDepartments = selectedCompany?.departments || [];
  const selectedCourse = courses.find((course) => course._id === selectedCourseId);
  const normalizedRole = String(auth.userType || auth.user?.role || "").toLowerCase();

  useEffect(() => {
    if (normalizedRole !== "superadmin") {
      return;
    }

    companyStore.getManagedCompanies().catch(() => undefined);
    courseStore.fetchAccessibleCourses().catch(() => undefined);
  }, [companyStore, normalizedRole]);

  useEffect(() => {
    if (scopeType !== "user" || !companyId) {
      setUserResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!userSearch.trim()) {
        setUserResults([]);
        return;
      }

      try {
        const response = await auth.getCompanyUsers({
          searchValue: userSearch.trim(),
          companyId,
        });
        setUserResults(response || []);
      } catch (error) {
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [auth, companyId, scopeType, userSearch]);

  useEffect(() => {
    setDepartmentName("");
    setSelectedUsers([]);
    setUserSearch("");
    setUserResults([]);
  }, [companyId, scopeType]);

  useEffect(() => {
    setPassingMarks("");
  }, [selectedCourseId]);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(selectedCourseId);
    }

    if (step === 1) {
      if (!companyId) {
        return false;
      }

      if (scopeType === "department") {
        return Boolean(departmentName);
      }

      if (scopeType === "user") {
        return selectedUsers.length > 0;
      }

      return true;
    }

    if (step === 2 && selectedCourse?.assessment?.totalMarks !== null && selectedCourse?.assessment?.totalMarks !== undefined) {
      return Boolean(String(passingMarks).trim());
    }

    return true;
  }, [companyId, departmentName, passingMarks, scopeType, selectedCourse?.assessment?.totalMarks, selectedCourseId, selectedUsers.length, step]);

  const handleToggleUser = (user: any) => {
    setSelectedUsers((current) => {
      const exists = current.some((item) => item._id === user._id);
      if (exists) {
        return current.filter((item) => item._id !== user._id);
      }

      return [...current, user];
    });
  };

  const handleSubmit = async () => {
    if (!selectedCourseId || !companyId) {
      return;
    }

    try {
      const response = await courseStore.createCourseAccess({
        courseId: selectedCourseId,
        accessLevel: scopeType,
        companyId,
        departmentName: scopeType === "department" ? departmentName : undefined,
        userIds: scopeType === "user" ? selectedUsers.map((user) => user._id) : undefined,
        passingMarks:
          selectedCourse?.assessment?.totalMarks !== null && selectedCourse?.assessment?.totalMarks !== undefined
            ? Number(passingMarks)
            : null,
        allowFurtherAssignment,
        assignToAllUsers,
      });

      toast({
        title: "Course access saved",
        description: response?.message || "The access rules were updated successfully.",
        status: "success",
        duration: 4000,
      });

      setStep(0);
      setSelectedCourseId("");
      setScopeType("company");
      setCompanyId("");
      setDepartmentName("");
      setAllowFurtherAssignment(true);
      setAssignToAllUsers(false);
      setPassingMarks("");
      setSelectedUsers([]);
      setUserSearch("");
    } catch (err: any) {
      toast({
        title: "Unable to grant access",
        description: err?.message || err?.error || "Please try again.",
        status: "error",
        duration: 4500,
      });
    }
  };

  if (normalizedRole !== "superadmin") {
    return (
      <Alert status="warning" borderRadius="xl">
        <AlertIcon />
        <Box>
          <AlertTitle>Superadmin only</AlertTitle>
          <AlertDescription>
            Course availability is controlled only at the superadmin level.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <Stack spacing={6}>
      <Box bg="white" borderRadius="2xl" borderWidth="1px" p={{ base: 5, md: 6 }} boxShadow="sm">
        <Heading size="md">Grant Course Access</Heading>
        <Text mt={2} color="gray.600">
          Separate availability from enrollment so admins only work with courses you have explicitly opened up.
        </Text>
      </Box>

      <Box bg="white" borderRadius="2xl" borderWidth="1px" p={{ base: 5, md: 6 }} boxShadow="sm">
        <Stepper index={step} orientation="horizontal" gap="0" size="sm" mb={8}>
          {STEPS.map((item) => (
            <Step key={item.title}>
              <StepIndicator>
                <StepStatus complete={<StepNumber />} incomplete={<StepNumber />} active={<StepNumber />} />
              </StepIndicator>
              <Box flexShrink="0">
                <StepTitle>{item.title}</StepTitle>
                <StepDescription>{item.description}</StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>

        {step === 0 ? (
          <VStack align="stretch" spacing={4}>
            {courseStore.isAccessLoading ? (
              <HStack py={10} justify="center">
                <Spinner />
                <Text color="gray.600">Loading published courses...</Text>
              </HStack>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {courses.map((course) => {
                  const isActive = course._id === selectedCourseId;
                  return (
                    <Box
                      key={course._id}
                      borderWidth="1px"
                      borderColor={isActive ? "blue.400" : "gray.200"}
                      bg={isActive ? "blue.50" : "white"}
                      borderRadius="xl"
                      p={4}
                      cursor="pointer"
                      onClick={() => setSelectedCourseId(course._id)}
                    >
                      <HStack justify="space-between" align="start" spacing={4}>
                        <Box>
                          <Text fontWeight="semibold" color="gray.800">
                            {course.title}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            {course.description?.text || "No description provided."}
                          </Text>
                        </Box>
                        <Badge colorScheme={isActive ? "blue" : "gray"}>{course.status}</Badge>
                      </HStack>
                      <HStack spacing={2} mt={3} flexWrap="wrap">
                        <Badge colorScheme="purple" variant="subtle">
                          {course.curriculum?.totalModules || 0} modules
                        </Badge>
                        {formatCourseMeta(course) ? (
                          <Badge colorScheme="orange" variant="subtle">
                            {formatCourseMeta(course)}
                          </Badge>
                        ) : null}
                      </HStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}
          </VStack>
        ) : null}

        {step === 1 ? (
          <Grid templateColumns={{ base: "1fr", lg: "1.1fr 0.9fr" }} gap={6}>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Access scope</FormLabel>
                <RadioGroup value={scopeType} onChange={(value) => setScopeType(value as ScopeType)}>
                  <Stack spacing={4}>
                    <Box borderWidth="1px" borderRadius="xl" p={4}>
                      <Radio value="company">
                        <Text fontWeight="semibold">Company</Text>
                        <Text color="gray.600" fontSize="sm">
                          Make the course visible across one company.
                        </Text>
                      </Radio>
                    </Box>
                    <Box borderWidth="1px" borderRadius="xl" p={4}>
                      <Radio value="department">
                        <Text fontWeight="semibold">Department</Text>
                        <Text color="gray.600" fontSize="sm">
                          Limit visibility to one department.
                        </Text>
                      </Radio>
                    </Box>
                    <Box borderWidth="1px" borderRadius="xl" p={4}>
                      <Radio value="user">
                        <Text fontWeight="semibold">Users</Text>
                        <Text color="gray.600" fontSize="sm">
                          Target a curated set of individual learners.
                        </Text>
                      </Radio>
                    </Box>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </GridItem>

            <GridItem>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Company</FormLabel>
                  <Select value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
                    <option value="">Select company</option>
                    {companies.map((company: any) => (
                      <option key={company._id} value={company._id}>
                        {company.company_name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {scopeType === "department" ? (
                  <FormControl isRequired>
                    <FormLabel>Department</FormLabel>
                    <Select value={departmentName} onChange={(event) => setDepartmentName(event.target.value)}>
                      <option value="">Select department</option>
                      {availableDepartments.map((department: string) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}

                {scopeType === "user" ? (
                  <Stack spacing={3}>
                    <FormControl>
                      <FormLabel>Search users</FormLabel>
                      <Input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="Search by name, email, code, or department"
                      />
                    </FormControl>

                    <Box borderWidth="1px" borderRadius="xl" p={3} minH="240px">
                      {userResults.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">
                          Start typing to find users in the selected company.
                        </Text>
                      ) : (
                        <VStack align="stretch" spacing={3}>
                          {userResults.map((row: any) => {
                            const user = row.user || row;
                            const isSelected = selectedUsers.some((item) => item._id === user._id);

                            return (
                              <Box
                                key={user._id}
                                borderWidth="1px"
                                borderRadius="lg"
                                borderColor={isSelected ? "blue.300" : "gray.200"}
                                bg={isSelected ? "blue.50" : "white"}
                                p={3}
                                cursor="pointer"
                                onClick={() => handleToggleUser(user)}
                              >
                                <HStack justify="space-between" align="start">
                                  <Box>
                                    <Text fontWeight="semibold">{user.name || user.email}</Text>
                                    <Text color="gray.600" fontSize="sm">
                                      {user.email || user.username}
                                    </Text>
                                  </Box>
                                  <Badge colorScheme={isSelected ? "blue" : "gray"}>
                                    {user.department || "No department"}
                                  </Badge>
                                </HStack>
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>

                    <HStack spacing={2} flexWrap="wrap">
                      {selectedUsers.map((user) => (
                        <Badge key={user._id} colorScheme="blue" px={3} py={1} borderRadius="full">
                          {user.name || user.email}
                        </Badge>
                      ))}
                    </HStack>
                  </Stack>
                ) : null}
              </Stack>
            </GridItem>
          </Grid>
        ) : null}

        {step === 2 ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <Box borderWidth="1px" borderRadius="xl" p={5}>
              <FormControl isRequired={selectedCourse?.assessment?.totalMarks !== null && selectedCourse?.assessment?.totalMarks !== undefined}>
                <FormLabel>Passing marks / criteria</FormLabel>
                <Input
                  type="number"
                  min={0}
                  max={selectedCourse?.assessment?.totalMarks ?? undefined}
                  value={passingMarks}
                  onChange={(event) => setPassingMarks(event.target.value)}
                  placeholder={
                    selectedCourse?.assessment?.totalMarks !== null && selectedCourse?.assessment?.totalMarks !== undefined
                      ? `Enter passing marks out of ${selectedCourse.assessment.totalMarks}`
                      : "No total marks configured for this course"
                  }
                  isDisabled={selectedCourse?.assessment?.totalMarks === null || selectedCourse?.assessment?.totalMarks === undefined}
                />
                <Text color="gray.600" fontSize="sm" mt={2}>
                  {selectedCourse?.assessment?.totalMarks !== null && selectedCourse?.assessment?.totalMarks !== undefined
                    ? `This course has ${selectedCourse.assessment.totalMarks} total marks. Configure the passing requirement for this company scope here.`
                    : "Passing criteria stays unconfigured until total marks exist on the course."}
                </Text>
              </FormControl>
            </Box>

            <Box borderWidth="1px" borderRadius="xl" p={5}>
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="semibold">Assign to all users</Text>
                  <Text color="gray.600" fontSize="sm">
                    Seed enrollments immediately for everyone inside the chosen scope.
                  </Text>
                </Box>
                <Switch isChecked={assignToAllUsers} onChange={(event) => setAssignToAllUsers(event.target.checked)} />
              </HStack>
            </Box>

            <Box borderWidth="1px" borderRadius="xl" p={5}>
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="semibold">Allow admins to assign further</Text>
                  <Text color="gray.600" fontSize="sm">
                    Unlock downstream assignment for admins and department heads within their permitted scope.
                  </Text>
                </Box>
                <Switch
                  isChecked={allowFurtherAssignment}
                  onChange={(event) => setAllowFurtherAssignment(event.target.checked)}
                />
              </HStack>
            </Box>
          </SimpleGrid>
        ) : null}

        {step === 3 ? (
          <Stack spacing={4}>
            <Box borderWidth="1px" borderRadius="2xl" p={5}>
              <Text fontWeight="semibold" fontSize="lg">
                Access summary
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <Box>
                  <Text color="gray.500" fontSize="sm">
                    Course
                  </Text>
                  <Text fontWeight="medium">{selectedCourse?.title || "Not selected"}</Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">
                    Scope
                  </Text>
                  <Text fontWeight="medium" textTransform="capitalize">
                    {scopeType}
                  </Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">
                    Company
                  </Text>
                  <Text fontWeight="medium">{selectedCompany?.company_name || "Not selected"}</Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">
                    Department / Users
                  </Text>
                  <Text fontWeight="medium">
                    {scopeType === "department"
                      ? departmentName || "Not selected"
                      : scopeType === "user"
                        ? `${selectedUsers.length} selected user${selectedUsers.length === 1 ? "" : "s"}`
                        : "Entire company"}
                  </Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">
                    Passing criteria
                  </Text>
                  <Text fontWeight="medium">
                    {selectedCourse?.assessment?.totalMarks !== null && selectedCourse?.assessment?.totalMarks !== undefined
                      ? `${passingMarks || "--"}/${selectedCourse.assessment.totalMarks}`
                      : "Not configured"}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            <HStack spacing={3} flexWrap="wrap">
              <Badge colorScheme={assignToAllUsers ? "green" : "gray"} px={3} py={1} borderRadius="full">
                {assignToAllUsers ? "Will assign to all users" : "Access only"}
              </Badge>
              <Badge colorScheme={allowFurtherAssignment ? "blue" : "gray"} px={3} py={1} borderRadius="full">
                {allowFurtherAssignment ? "Further assignment enabled" : "Further assignment disabled"}
              </Badge>
            </HStack>
          </Stack>
        ) : null}

        <HStack justify="space-between" mt={8}>
          <Button variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} isDisabled={step === 0}>
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button colorScheme="blue" onClick={() => setStep((current) => current + 1)} isDisabled={!canContinue}>
              Continue
            </Button>
          ) : (
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={courseStore.isAccessSubmitting}>
              Confirm access
            </Button>
          )}
        </HStack>
      </Box>
    </Stack>
  );
});

export default CourseAccessGrantFlow;
