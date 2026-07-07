"use client";

import {
  Badge,
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FiBookOpen, FiCheckCircle, FiSearch } from "react-icons/fi";

type CourseOption = {
  _id: string;
  title: string;
  description?: {
    text?: string;
    html?: string;
  };
  access?: {
    matchedScopes?: Array<{
      _id: string;
      label: string;
    }>;
  };
};

type CourseMultiSelectInputProps = {
  courses: CourseOption[];
  selectedCourseIds: string[];
  onSelectionChange: (courseIds: string[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  emptyStateText?: string;
};

function buildCourseMatchText(course: CourseOption) {
  return `${course.title} ${course.description?.text || ""}`.toLowerCase();
}

export default function CourseMultiSelectInput({
  courses,
  selectedCourseIds,
  onSelectionChange,
  searchValue,
  onSearchChange,
  label = "Select courses",
  helperText,
  placeholder = "Search by title or description",
  emptyStateText = "No courses match your search yet.",
}: CourseMultiSelectInputProps) {
  const filteredCourses = courses.filter((course) => buildCourseMatchText(course).includes(searchValue.trim().toLowerCase()));
  const selectedCourses = courses.filter((course) => selectedCourseIds.includes(course._id));

  const toggleCourse = (courseId: string) => {
    onSelectionChange(
      selectedCourseIds.includes(courseId)
        ? selectedCourseIds.filter((item) => item !== courseId)
        : [...selectedCourseIds, courseId]
    );
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Stack spacing={4}>
        <Box
          borderWidth="1px"
          borderRadius="2xl"
          borderColor={selectedCourses.length ? "blue.200" : "gray.200"}
          bg={selectedCourses.length ? "blue.50" : "gray.50"}
          p={4}
        >
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={placeholder}
              bg="white"
              borderRadius="xl"
            />
          </InputGroup>

          <Wrap spacing={2} mt={4}>
            {selectedCourses.length ? (
              selectedCourses.map((course) => (
                <WrapItem key={course._id}>
                  <Tag size="lg" borderRadius="full" bg="blue.600" color="white">
                    <TagLabel>{course.title}</TagLabel>
                    <TagCloseButton onClick={() => toggleCourse(course._id)} />
                  </Tag>
                </WrapItem>
              ))
            ) : (
              <Text color="gray.500" fontSize="sm">
                Selected courses will appear here as chips.
              </Text>
            )}
          </Wrap>
        </Box>

        <Stack spacing={3} maxH="420px" overflowY="auto" pr={1}>
          {filteredCourses.length ? (
            filteredCourses.map((course) => {
              const isSelected = selectedCourseIds.includes(course._id);
              return (
                <Box
                  key={course._id}
                  borderWidth="1px"
                  borderRadius="2xl"
                  borderColor={isSelected ? "blue.300" : "gray.200"}
                  bg={isSelected ? "blue.50" : "white"}
                  p={4}
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{ borderColor: isSelected ? "blue.400" : "gray.300", transform: "translateY(-1px)" }}
                  onClick={() => toggleCourse(course._id)}
                >
                  <HStack justify="space-between" align="start" spacing={4}>
                    <HStack align="start" spacing={3}>
                      <Box
                        borderRadius="xl"
                        bg={isSelected ? "blue.600" : "gray.100"}
                        color={isSelected ? "white" : "gray.600"}
                        p={2.5}
                      >
                        <Icon as={FiBookOpen} boxSize={4} />
                      </Box>
                      <Box>
                        <Text fontWeight="semibold">{course.title}</Text>
                        <Text mt={1} color="gray.600" fontSize="sm" noOfLines={2}>
                          {course.description?.text || "No description available."}
                        </Text>
                        {course.access?.matchedScopes?.length ? (
                          <Wrap spacing={2} mt={3}>
                            {course.access.matchedScopes.map((scope) => (
                              <WrapItem key={scope._id}>
                                <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={3} py={1}>
                                  {scope.label}
                                </Badge>
                              </WrapItem>
                            ))}
                          </Wrap>
                        ) : null}
                      </Box>
                    </HStack>

                    <Badge
                      colorScheme={isSelected ? "blue" : "gray"}
                      borderRadius="full"
                      px={3}
                      py={1}
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Icon as={FiCheckCircle} />
                      {isSelected ? "Selected" : "Select"}
                    </Badge>
                  </HStack>
                </Box>
              );
            })
          ) : (
            <Box borderWidth="1px" borderRadius="2xl" borderStyle="dashed" p={6} textAlign="center" bg="gray.50">
              <Text fontWeight="medium">{emptyStateText}</Text>
              <Text mt={1} color="gray.600" fontSize="sm">
                Try a different keyword or clear the search to see the full course list.
              </Text>
            </Box>
          )}
        </Stack>
      </Stack>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
