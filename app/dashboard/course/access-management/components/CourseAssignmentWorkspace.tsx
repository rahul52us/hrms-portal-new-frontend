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
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Wrap,
  WrapItem,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import stores from "@/app/store/stores";
import { courseStore } from "@/app/store/courseStore/courseStore";
import CourseMultiSelectInput from "@/app/dashboard/course/components/CourseMultiSelectInput";

const STEPS = [
  { title: "Courses", description: "Select multiple courses" },
  { title: "Target", description: "Choose company, department, or users" },
  { title: "Duration", description: "Set the access window" },
  { title: "Review", description: "Confirm the assignment" },
];

type TargetMode = "users" | "department" | "company";

function formatDate(value?: string | null) {
  if (!value) {
    return "No expiry";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No expiry";
  }

  return date.toLocaleDateString();
}

const CourseAssignmentWorkspace = observer(() => {
  const toast = useToast();
  const { auth } = stores;
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isDepartmentHead = role === "departmenthead";
  const departments =
    isDepartmentHead
      ? [auth.user?.department].filter(Boolean)
      : auth.user?.companyDetails?.departments || [];

  const [step, setStep] = useState(0);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [targetMode, setTargetMode] = useState<TargetMode>(isDepartmentHead ? "department" : "users");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<{
    fileName: string;
    matchedUsers: any[];
    failedEntries: any[];
  } | null>(null);
  const [noExpiry, setNoExpiry] = useState(true);
  const [validTill, setValidTill] = useState("");
  const [assessmentCriteriaByCourse, setAssessmentCriteriaByCourse] = useState<Record<string, { passingMarks: string }>>({});
  const [lastResult, setLastResult] = useState<{
    successCount: number;
    failedEntries: any[];
    courseCount?: number;
  } | null>(null);

  const assignableCourses = useMemo(
    () => (courseStore.accessibleCourses || []).filter((course) => course.access?.canAssign),
    [courseStore.accessibleCourses]
  );

  const selectedCourses = useMemo(
    () => assignableCourses.filter((course) => selectedCourseIds.includes(course._id)),
    [assignableCourses, selectedCourseIds]
  );

  const combinedSelectedUsers = useMemo(
    () =>
      Array.from(
        new Map(
          [...selectedUsers, ...(uploadPreview?.matchedUsers || [])].map((user) => [user._id, user])
        ).values()
      ),
    [selectedUsers, uploadPreview]
  );

  useEffect(() => {
    courseStore.fetchAccessibleCourses().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isDepartmentHead && auth.user?.department) {
      setDepartmentName(auth.user.department);
    }
  }, [auth.user?.department, isDepartmentHead]);

  useEffect(() => {
    setAssessmentCriteriaByCourse((current) => {
      const next = { ...current };
      let changed = false;

      selectedCourses.forEach((course) => {
        if (!next[course._id]) {
          next[course._id] = { passingMarks: "" };
          changed = true;
        }
      });

      Object.keys(next).forEach((courseId) => {
        if (!selectedCourseIds.includes(courseId)) {
          delete next[courseId];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [selectedCourseIds, selectedCourses]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!userSearch.trim() || targetMode !== "users") {
        setUserResults([]);
        return;
      }

      try {
        const response = await auth.getCompanyUsers({
          searchValue: userSearch.trim(),
        });
        setUserResults(response || []);
      } catch (error) {
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [auth, targetMode, userSearch]);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return selectedCourseIds.length > 0;
    }

    if (step === 1) {
      if (targetMode === "users") {
        return combinedSelectedUsers.length > 0;
      }

      if (targetMode === "department") {
        return Boolean(departmentName);
      }

      return !isDepartmentHead;
    }

    if (step === 2) {
      const hasValidCriteria = selectedCourses.every((course) => {
        const totalMarks = Number(course?.assessment?.totalMarks);
        if (!Number.isFinite(totalMarks)) {
          return true;
        }

        const passingMarks = assessmentCriteriaByCourse[course._id]?.passingMarks?.trim();
        if (!passingMarks) {
          return false;
        }

        const numericPassingMarks = Number(passingMarks);
        return Number.isFinite(numericPassingMarks) && numericPassingMarks >= 0 && numericPassingMarks <= totalMarks;
      });

      return (noExpiry || Boolean(validTill)) && hasValidCriteria;
    }

    return true;
  }, [assessmentCriteriaByCourse, combinedSelectedUsers.length, departmentName, isDepartmentHead, noExpiry, selectedCourseIds.length, selectedCourses, step, targetMode, validTill]);

  const toggleSelectedUser = (user: any) => {
    setSelectedUsers((current) => {
      const exists = current.some((item) => item._id === user._id);
      if (exists) {
        return current.filter((item) => item._id !== user._id);
      }

      return [...current, user];
    });
  };

  const resetForm = () => {
    setStep(0);
    setCourseSearch("");
    setSelectedCourseIds([]);
    setTargetMode(isDepartmentHead ? "department" : "users");
    setUserSearch("");
    setUserResults([]);
    setSelectedUsers([]);
    setDepartmentName(isDepartmentHead ? auth.user?.department || "" : "");
    setUploadFile(null);
    setUploadPreview(null);
    setNoExpiry(true);
    setValidTill("");
    setAssessmentCriteriaByCourse({});
  };

  const handlePreviewUpload = async () => {
    if (!uploadFile) {
      return;
    }

    try {
      const response = await courseStore.previewAssignmentUsers({ file: uploadFile });
      setUploadPreview({
        fileName: response?.data?.fileName || uploadFile.name,
        matchedUsers: response?.data?.matchedUsers || [],
        failedEntries: response?.data?.failedEntries || [],
      });
      toast({
        title: "Upload validated",
        description: `${response?.data?.matchedCount || 0} user${response?.data?.matchedCount === 1 ? "" : "s"} matched successfully by phone number.`,
        status: "success",
        duration: 3500,
      });
    } catch (err: any) {
      setUploadPreview(null);
      toast({
        title: "Unable to validate upload",
        description: err?.message || err?.error || "Please check the file and try again.",
        status: "error",
        duration: 4500,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await courseStore.assignMultipleCourses({
        courseIds: selectedCourseIds,
        assignmentType: targetMode,
        userIds: targetMode === "users" ? combinedSelectedUsers.map((user) => user._id) : undefined,
        departmentName: targetMode === "department" ? departmentName : undefined,
        companyId: targetMode === "company" ? auth.company : undefined,
        validFrom: new Date().toISOString(),
        validTill: noExpiry ? null : new Date(validTill).toISOString(),
        dueDate: noExpiry ? null : new Date(validTill).toISOString(),
        assessmentCriteriaByCourse: Object.fromEntries(
          selectedCourseIds.map((courseId) => [
            courseId,
            {
              passingMarks: assessmentCriteriaByCourse[courseId]?.passingMarks
                ? Number(assessmentCriteriaByCourse[courseId].passingMarks)
                : null,
            },
          ])
        ),
      });

      setLastResult(response?.data || null);
      toast({
        title: "Assignments processed",
        description: `${response?.data?.successCount || 0} course enrollments were created or updated.`,
        status: "success",
        duration: 4000,
      });
      resetForm();
    } catch (err: any) {
      toast({
        title: "Unable to assign courses",
        description: err?.message || err?.error || "Please try again.",
        status: "error",
        duration: 4500,
      });
    }
  };

  if (!["admin", "departmenthead"].includes(role)) {
    return (
      <Alert status="warning" borderRadius="2xl">
        <AlertIcon />
        <Box>
          <AlertTitle>Assignment workspace unavailable</AlertTitle>
          <AlertDescription>
            Only admins and department heads can enroll learners into accessible courses.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <Stack spacing={6}>
      <Box
        borderRadius="3xl"
        px={{ base: 5, md: 7 }}
        py={{ base: 6, md: 7 }}
        bg="linear-gradient(135deg, #ffffff 0%, #eff6ff 45%, #f8fafc 100%)"
        borderWidth="1px"
        borderColor="blue.100"
        boxShadow="sm"
      >
        <Heading size="md">Multi-Course Assignment</Heading>
        <Text mt={2} color="gray.600" maxW="3xl">
          Assign courses deliberately by company, department, or individual learners. New users added later will not inherit past company assignments automatically.
        </Text>
      </Box>

      {courseStore.isAccessLoading ? (
        <HStack justify="center" py={20}>
          <Spinner />
          <Text color="gray.600">Loading assignable courses...</Text>
        </HStack>
      ) : assignableCourses.length === 0 ? (
        <Alert status="info" borderRadius="2xl">
          <AlertIcon />
          <Box>
            <AlertTitle>No assignable courses</AlertTitle>
            <AlertDescription>
              You can only assign courses that were granted by a superadmin and allow further assignment.
            </AlertDescription>
          </Box>
        </Alert>
      ) : (
        <Box bg="white" borderRadius="3xl" borderWidth="1px" p={{ base: 5, md: 6 }} boxShadow="sm">
          <Stepper index={step} size="sm" mb={8}>
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
            <CourseMultiSelectInput
              courses={assignableCourses}
              selectedCourseIds={selectedCourseIds}
              onSelectionChange={setSelectedCourseIds}
              searchValue={courseSearch}
              onSearchChange={setCourseSearch}
              label="Select courses"
              helperText="Search, multi-select, and review the chosen courses as chips before moving on."
              emptyStateText="No assignable courses match that search."
            />
          ) : null}

          {step === 1 ? (
            <Stack spacing={5}>
              <FormControl>
                <FormLabel>Assign to</FormLabel>
                <RadioGroup value={targetMode} onChange={(value) => setTargetMode(value as TargetMode)}>
                  <HStack spacing={5} flexWrap="wrap">
                    <Radio value="users">Users</Radio>
                    <Radio value="department">Department</Radio>
                    {!isDepartmentHead ? <Radio value="company">Company</Radio> : null}
                  </HStack>
                </RadioGroup>
              </FormControl>

              {targetMode === "users" ? (
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>Search users</FormLabel>
                    <Input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search by name, phone number, code, or department"
                    />
                  </FormControl>

                  <Wrap spacing={2}>
                    {combinedSelectedUsers.length ? (
                      combinedSelectedUsers.map((user) => (
                        <WrapItem key={user._id}>
                          <Tag size="lg" borderRadius="full" colorScheme="blue">
                            <TagLabel>{user.name || user.mobileNumber || user.email}</TagLabel>
                            {selectedUsers.some((selectedUser) => selectedUser._id === user._id) ? (
                              <TagCloseButton onClick={() => toggleSelectedUser(user)} />
                            ) : null}
                          </Tag>
                        </WrapItem>
                      ))
                    ) : (
                      <Text color="gray.500" fontSize="sm">
                        Matched and manually selected users will appear here for confirmation.
                      </Text>
                    )}
                  </Wrap>

                  <Box borderWidth="1px" borderRadius="2xl" p={3} minH="220px">
                    {userResults.length === 0 ? (
                      <Text color="gray.500" fontSize="sm">
                        Search for users and select one or more learners, or validate an Excel file below.
                      </Text>
                    ) : (
                      <Stack spacing={3}>
                        {userResults.map((row: any) => {
                          const user = row.user || row;
                          const isSelected = selectedUsers.some((item) => item._id === user._id);

                          return (
                            <Box
                              key={user._id}
                              borderWidth="1px"
                              borderRadius="2xl"
                              borderColor={isSelected ? "blue.300" : "gray.200"}
                              bg={isSelected ? "blue.50" : "white"}
                              p={4}
                              cursor="pointer"
                              onClick={() => toggleSelectedUser(user)}
                            >
                              <HStack justify="space-between" align="start">
                                <Box>
                                  <Text fontWeight="semibold">{user.name || user.mobileNumber || user.email}</Text>
                                  <Text color="gray.600" fontSize="sm">
                                    {user.mobileNumber || user.email || user.username}
                                  </Text>
                                </Box>
                                <Badge colorScheme={isSelected ? "blue" : "gray"} borderRadius="full" px={3} py={1}>
                                  {user.department || "No department"}
                                </Badge>
                              </HStack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>

                  <FormControl>
                    <FormLabel>Excel upload</FormLabel>
                    <HStack align="start" spacing={3}>
                      <Input
                        type="file"
                        accept=".xlsx,.csv,text/csv"
                        onChange={(event) => {
                          setUploadFile(event.target.files?.[0] || null);
                          setUploadPreview(null);
                        }}
                        p={1.5}
                      />
                      <Button
                        colorScheme="blue"
                        variant="outline"
                        onClick={handlePreviewUpload}
                        isDisabled={!uploadFile}
                        isLoading={courseStore.isAssignmentSubmitting}
                      >
                        Validate file
                      </Button>
                    </HStack>
                  </FormControl>

                  <Text color="gray.600" fontSize="sm">
                    Upload a spreadsheet with a <strong>phone number</strong> or <strong>employee ID / code</strong> column. We will validate existing users first, show the matched learners here, and only then submit the assignment.
                  </Text>

                  {uploadPreview ? (
                    <Box borderWidth="1px" borderRadius="2xl" p={4} bg="gray.50">
                      <Text fontWeight="semibold">{uploadPreview.fileName}</Text>
                      <Text color="gray.600" fontSize="sm" mt={1}>
                        {uploadPreview.matchedUsers.length} matched user{uploadPreview.matchedUsers.length === 1 ? "" : "s"} ready for confirmation.
                      </Text>
                      {uploadPreview.failedEntries.length ? (
                        <Stack spacing={2} mt={3}>
                          {uploadPreview.failedEntries.slice(0, 6).map((entry, index) => (
                            <Text key={`${entry.userId || entry.phone || entry.rowNumber}-${index}`} fontSize="sm" color="orange.700">
                              {entry.phone || entry.reference || `Row ${entry.rowNumber}`}: {entry.reason}
                            </Text>
                          ))}
                        </Stack>
                      ) : null}
                    </Box>
                  ) : null}
                </Stack>
              ) : null}

              {targetMode === "department" ? (
                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Select
                    value={departmentName}
                    onChange={(event) => setDepartmentName(event.target.value)}
                    isDisabled={isDepartmentHead}
                  >
                    <option value="">Select department</option>
                    {departments.map((department: string) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              {targetMode === "company" ? (
                <Alert status="info" borderRadius="2xl">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Company-wide assignment</AlertTitle>
                    <AlertDescription>
                      Current learners in your company will receive the selected courses. Learners added later will not be enrolled automatically.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : null}
            </Stack>
          ) : null}

          {step === 2 ? (
            <Stack spacing={4}>
              <Box borderWidth="1px" borderRadius="2xl" p={4}>
                <Text fontWeight="semibold">Passing criteria</Text>
                <Text color="gray.600" fontSize="sm" mt={1}>
                  Set the passing marks for each selected course. These criteria are stored with the assignment and can vary by company.
                </Text>
                <Stack spacing={4} mt={4}>
                  {selectedCourses.map((course) => {
                    const totalMarks = Number(course?.assessment?.totalMarks);
                    const hasTotalMarks = Number.isFinite(totalMarks);

                    return (
                      <Box key={course._id} borderWidth="1px" borderRadius="xl" p={4}>
                        <Text fontWeight="semibold">{course.title}</Text>
                        <Text color="gray.600" fontSize="sm" mt={1}>
                          {hasTotalMarks
                            ? `Total marks: ${totalMarks}`
                            : "This course does not have total marks configured yet."}
                        </Text>
                        <FormControl mt={3} isRequired={hasTotalMarks}>
                          <FormLabel mb={1}>Passing marks</FormLabel>
                          <Input
                            type="number"
                            min={0}
                            max={hasTotalMarks ? totalMarks : undefined}
                            value={assessmentCriteriaByCourse[course._id]?.passingMarks || ""}
                            onChange={(event) =>
                              setAssessmentCriteriaByCourse((current) => ({
                                ...current,
                                [course._id]: {
                                  passingMarks: event.target.value,
                                },
                              }))
                            }
                            placeholder={hasTotalMarks ? `Enter passing marks out of ${totalMarks}` : "Not available"}
                            isDisabled={!hasTotalMarks}
                          />
                        </FormControl>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <Box borderWidth="1px" borderRadius="2xl" p={4}>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="semibold">No expiry</Text>
                    <Text color="gray.600" fontSize="sm">
                      Keep these assignments active until they are removed or replaced.
                    </Text>
                  </Box>
                  <Switch isChecked={noExpiry} onChange={(event) => setNoExpiry(event.target.checked)} />
                </HStack>
              </Box>

              {!noExpiry ? (
                <FormControl isRequired>
                  <FormLabel>Valid till</FormLabel>
                  <Input type="date" value={validTill} onChange={(event) => setValidTill(event.target.value)} />
                </FormControl>
              ) : null}
            </Stack>
          ) : null}

          {step === 3 ? (
            <Stack spacing={4}>
              <Box borderWidth="1px" borderRadius="3xl" p={5}>
                <Text fontWeight="semibold" fontSize="lg">
                  Assignment summary
                </Text>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Courses
                    </Text>
                    <Text fontWeight="medium">{selectedCourses.length} selected</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Target
                    </Text>
                    <Text fontWeight="medium">
                      {targetMode === "company"
                        ? "Company-wide"
                        : targetMode === "department"
                          ? departmentName || "Not selected"
                          : uploadPreview
                            ? `${combinedSelectedUsers.length} confirmed user${combinedSelectedUsers.length === 1 ? "" : "s"}`
                            : `${combinedSelectedUsers.length} selected user${combinedSelectedUsers.length === 1 ? "" : "s"}`}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Duration
                    </Text>
                    <Text fontWeight="medium">{noExpiry ? "No expiry" : formatDate(validTill)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Assignment model
                    </Text>
                    <Text fontWeight="medium">
                      {targetMode === "company"
                        ? "Current company users only"
                        : targetMode === "department"
                          ? "Current department users only"
                          : "Only the confirmed learners above"}
                    </Text>
                  </Box>
                </SimpleGrid>

                <Wrap spacing={2} mt={5}>
                  {selectedCourses.map((course) => (
                    <WrapItem key={course._id}>
                      <Tag borderRadius="full" colorScheme="blue" variant="subtle">
                        <TagLabel>
                          {course.title}
                          {Number.isFinite(Number(course?.assessment?.totalMarks))
                            ? ` • ${assessmentCriteriaByCourse[course._id]?.passingMarks || "--"}/${course.assessment.totalMarks}`
                            : ""}
                        </TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            </Stack>
          ) : null}

          <HStack justify="space-between" mt={8}>
            <Button variant="outline" onClick={() => (step === 0 ? resetForm() : setStep((current) => current - 1))}>
              {step === 0 ? "Reset" : "Back"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button colorScheme="blue" onClick={() => setStep((current) => current + 1)} isDisabled={!canContinue}>
                Continue
              </Button>
            ) : (
              <Button colorScheme="blue" onClick={handleSubmit} isLoading={courseStore.isAssignmentSubmitting}>
                Confirm assignment
              </Button>
            )}
          </HStack>
        </Box>
      )}

      {lastResult ? (
        <Box bg="white" borderRadius="3xl" borderWidth="1px" p={{ base: 5, md: 6 }} boxShadow="sm">
          <Text fontWeight="semibold">Latest assignment result</Text>
          <Text mt={2} color="gray.700">
            {lastResult.successCount} course enrollments were created or updated across{" "}
            {lastResult.courseCount || 0} course{(lastResult.courseCount || 0) === 1 ? "" : "s"}.
          </Text>
          {lastResult.failedEntries?.length ? (
            <Stack spacing={2} mt={4}>
              {lastResult.failedEntries.slice(0, 8).map((entry, index) => (
                <Text key={`${entry.userId || entry.phone || entry.rowNumber}-${index}`} fontSize="sm" color="orange.700">
                  {entry.phone || entry.reference || entry.userId || `Row ${entry.rowNumber}`}: {entry.reason}
                </Text>
              ))}
            </Stack>
          ) : null}
        </Box>
      ) : null}
    </Stack>
  );
});

export default CourseAssignmentWorkspace;
