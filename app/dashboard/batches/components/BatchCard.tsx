"use client";

import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiBookOpen,
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiUsers,
} from "react-icons/fi";

type BatchCardProps = {
  batch: any;
  onClick: () => void;
  isLearner?: boolean;
};

const getStatusColor = (status?: string) => {
  const normalizedStatus = String(status || "active").toLowerCase();

  if (normalizedStatus === "completed") return "green";
  if (normalizedStatus === "inactive") return "gray";
  if (normalizedStatus === "draft") return "yellow";
  if (normalizedStatus === "expired") return "red";
  if (normalizedStatus === "upcoming") return "purple";

  return "blue";
};

const formatDate = (date?: string) => {
  if (!date) return "Not set";

  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "Not set";
  }
};

const MiniMetric = ({
  label,
  value,
  icon,
  colorScheme,
}: {
  label: string;
  value: string | number;
  icon: any;
  colorScheme: string;
}) => {
  const bg = useColorModeValue(`${colorScheme}.50`, "whiteAlpha.100");
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);
  const textColor = useColorModeValue("gray.900", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      bg={bg}
      rounded={{ base: "xl", md: "2xl" }}
      px={{ base: 2, md: 3 }}
      py={{ base: 2, md: 3 }}
      minW={0}
    >
      <HStack spacing={1.5} mb={1}>
        <Icon as={icon} boxSize={3} color={iconColor} flexShrink={0} />

        <Text
          fontSize="2xs"
          color={mutedText}
          fontWeight="800"
          noOfLines={1}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {label}
        </Text>
      </HStack>

      <Text
        fontSize={{ base: "xs", md: "sm" }}
        fontWeight="900"
        color={textColor}
        noOfLines={1}
        textTransform={label === "Status" ? "capitalize" : "none"}
      >
        {value}
      </Text>
    </Box>
  );
};

const BatchCard = ({ batch, onClick, isLearner }: BatchCardProps) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const footerBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const status = batch.status || "active";
  const startDate = formatDate(batch.startDate);
  const endDate = formatDate(batch.endDate);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      rounded={{ base: "2xl", md: "3xl" }}
      p={{ base: 3, md: 5 }}
      shadow="sm"
      cursor="pointer"
      transition="all 0.2s ease"
      position="relative"
      overflow="hidden"
      _hover={{
        transform: { base: "none", md: "translateY(-3px)" },
        shadow: { base: "sm", md: "lg" },
        borderColor: "blue.300",
      }}
      onClick={onClick}
    >
      {/* <Box
        position="absolute"
        insetX={0}
        top={0}
        h="1"
        bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
      /> */}

      <Stack spacing={{ base: 3, md: 4 }}>
        <Flex align="flex-start" justify="space-between" gap={3}>
          <HStack spacing={3} minW={0} flex="1">
            <Box
              w={{ base: 9, md: 12 }}
              h={{ base: 9, md: 12 }}
              rounded={{ base: "xl", md: "2xl" }}
              bgGradient="linear(to-br, blue.300, purple.400)"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              shadow="sm"
            >
              <Icon as={FiGrid} boxSize={{ base: 4, md: 5 }} />
            </Box>

            <Box minW={0}>
              <Text
                fontSize={{ base: "sm", md: "lg" }}
                fontWeight="900"
                color={textColor}
                noOfLines={1}
                lineHeight="1.25"
              >
                {batch.name}
              </Text>

              <HStack
                mt={1}
                spacing={1.5}
                color={mutedText}
                fontSize={{ base: "xs", md: "sm" }}
                minW={0}
              >
                <Icon as={FiCalendar} boxSize={3} flexShrink={0} />
                <Text noOfLines={1}>
                  {startDate} - {endDate}
                </Text>
              </HStack>
            </Box>
          </HStack>

          <Badge
            colorScheme={getStatusColor(status)}
            rounded="full"
            px={{ base: 2, md: 3 }}
            py={1}
            fontSize="xs"
            flexShrink={0}
            textTransform="capitalize"
          >
            {status}
          </Badge>
        </Flex>

        <SimpleGrid columns={3} spacing={{ base: 2, md: 3 }}>
          <MiniMetric
            label="Courses"
            value={batch.courseCount || 0}
            icon={FiBookOpen}
            colorScheme="purple"
          />

          <MiniMetric
            label="Users"
            value={batch.userCount || 0}
            icon={FiUsers}
            colorScheme="green"
          />

          <MiniMetric
            label="Status"
            value={status}
            icon={FiClock}
            colorScheme="blue"
          />
        </SimpleGrid>

        <Flex
          display={{ base: "flex", md: "none" }}
          align="center"
          justify="space-between"
          bg={footerBg}
          rounded="xl"
          px={3}
          py={2}
        >
          <Text fontSize="xs" fontWeight="800" color="blue.500">
            {isLearner ? "Open batch" : "View details"}
          </Text>

          <Icon as={FiChevronRight} color="blue.500" boxSize={4} />
        </Flex>

        <Flex
          display={{ base: "none", md: "flex" }}
          align="center"
          justify="space-between"
          color={mutedText}
          fontSize="sm"
        >
          <Text fontWeight="600">
            {batch.createdBy?.name || batch.createdBy?.email
              ? `Created by ${batch.createdBy?.name || batch.createdBy?.email}`
              : "Created by System"}
          </Text>

          <HStack spacing={1} color="blue.500">
            <Text fontWeight="800">{isLearner ? "Open batch" : "View details"}</Text>
            <Icon as={FiChevronRight} boxSize={4} />
          </HStack>
        </Flex>
      </Stack>
    </Box>
  );
};

export default BatchCard;