import {
  AspectRatio,
  Box,
  Button,
  Circle,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  HStack,
  Icon,
  Image,
  Progress,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import React from "react";
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiClock,
  FiDownload,
  FiLayers,
  FiPlayCircle,
  FiStar,
} from "react-icons/fi";

const MotionBox = motion(Box);

interface CourseCardProps {
  course: any;
  index: number;
  handleOpenCourse: (id: string) => void;
  handleDownloadCertificate?: (id: string) => void;
  isCertificateDownloading?: boolean;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
}

function truncateText(value?: string, limit = 70) {
  const text = String(value || "").trim();
  if (!text) return "No description available yet.";
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

const MYCourseBoardCard: React.FC<CourseCardProps> = ({
  course,
  index,
  handleOpenCourse,
  handleDownloadCertificate,
  isCertificateDownloading = false,
  getStatusColor,
  formatDate,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const subduedText = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const dividerColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const metricsBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const metricsValueColor = useColorModeValue("gray.800", "white");
  const metricsLabelColor = useColorModeValue("gray.500", "gray.500");
  const iconBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const progressTrack = useColorModeValue("gray.100", "whiteAlpha.100");
  const shadowColor = useColorModeValue(
    "0 12px 30px rgba(15, 23, 42, 0.07)",
    "0 12px 34px rgba(0, 0, 0, 0.35)",
  );
  const hoverShadow = useColorModeValue(
    "0 18px 44px rgba(37, 99, 235, 0.16)",
    "0 18px 44px rgba(0, 0, 0, 0.55)",
  );

  const statusLabel = course.isExpired
    ? "Expired"
    : course.visibilityStatus === "expiring_soon"
      ? "Expiring Soon"
      : "Active";
  const statusColorKey = getStatusColor(course.visibilityStatus);
  const dotColor =
    statusColorKey === "green"
      ? "#22c55e"
      : statusColorKey === "yellow" || statusColorKey === "orange"
        ? "#f59e0b"
        : "#ef4444";
  const progress = Math.round(Number(course.progress || 0));
  const assessmentOutcome = String(course.assessmentSummary?.outcome || "").trim().toLowerCase();
  const assessmentLabel =
    assessmentOutcome === "passed"
      ? "Passed"
      : assessmentOutcome === "failed"
        ? "Failed"
        : assessmentOutcome === "pending"
          ? "Assessment Pending"
          : "";
  const assessmentBg =
    assessmentOutcome === "passed"
      ? "green.50"
      : assessmentOutcome === "failed"
        ? "red.50"
        : "orange.50";
  const assessmentText =
    assessmentOutcome === "passed"
      ? "green.600"
      : assessmentOutcome === "failed"
        ? "red.600"
        : "orange.600";
  const certificateStatus = String(course.certificate?.status || "").trim().toLowerCase();
  const shouldShowCertificateButton =
    course.progression?.certificateEnabled !== false && course.certificate?.enabled !== false;
  const canDownloadCertificate = Boolean(
    shouldShowCertificateButton &&
    course.certificate &&
    (certificateStatus === "issued" || course.certificate.canIssue)
  );
  const certificateButtonLabel = canDownloadCertificate ? "Download Certificate" : "Certificate Locked";
  const certificateReason =
    course.certificate?.reason || "Complete the course and meet the passing marks requirement to unlock the certificate.";

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenCourse(course.courseId);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.045, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      role="button"
      tabIndex={0}
      data-group
      aria-label={`Open ${course.title}`}
      bg={cardBg}
      borderRadius={{ base: "xl", md: "2xl" }}
      overflow="hidden"
      boxShadow={shadowColor}
      borderWidth="1px"
      borderColor={dividerColor}
      _hover={{ boxShadow: hoverShadow, borderColor: "blue.200", cursor: "pointer" }}
      onClick={() => handleOpenCourse(course.courseId)}
      onKeyDown={handleCardKeyDown}
      w="full"
    >
      <Flex display={{ base: "flex", md: "none" }} p={2.5} gap={2.5} align="stretch">
        <Box
          position="relative"
          w="84px"
          h="96px"
          flexShrink={0}
          borderRadius="lg"
          overflow="hidden"
          bgGradient="linear(to-br, blue.700, teal.400)"
        >
          {course.thumbnailUrl ? (
            <Image src={course.thumbnailUrl} alt={course.title} w="full" h="full" objectFit="cover" />
          ) : null}
          <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.600, transparent)" />
          <HStack
            position="absolute"
            left={2}
            bottom={2}
            spacing={1}
            bg="blackAlpha.500"
            color="white"
            px={2}
            py={1}
            borderRadius="full"
          >
            <Circle size="6px" bg={dotColor} />
            <Text fontSize="10px" fontWeight="800" noOfLines={1}>
              {statusLabel}
            </Text>
          </HStack>
        </Box>

        <Flex direction="column" minW={0} flex="1" justify="space-between" gap={2}>
          <Box minW={0}>
            <HStack justify="space-between" align="start" gap={2}>
              <Text fontSize="sm" fontWeight="800" lineHeight="1.25" color={titleColor} noOfLines={2}>
                {course.title}
              </Text>
              <Text fontSize="xs" fontWeight="900" color="blue.500" flexShrink={0}>
                {progress}%
              </Text>
            </HStack>

            {assessmentLabel ? (
              <Box
                mt={2}
                px={2}
                py={1}
                borderRadius="full"
                bg={assessmentBg}
                color={assessmentText}
                fontSize="10px"
                fontWeight="800"
                display="inline-flex"
                alignItems="center"
                gap={1}
                maxW="100%"
              >
                <Icon as={FiStar} boxSize={3} />
                <Text noOfLines={1}>{assessmentLabel}</Text>
              </Box>
            ) : null}
          </Box>

          <Box>
            <Progress
              value={progress}
              size="xs"
              borderRadius="full"
              bg={progressTrack}
              sx={{
                "& > div": {
                  background:
                    "linear-gradient(90deg, var(--chakra-colors-blue-600) 0%, var(--chakra-colors-teal-300) 100%)",
                  borderRadius: "full",
                },
              }}
            />
            <HStack mt={2} spacing={2} color={subduedText} fontSize="11px" fontWeight="700">
              <HStack spacing={1} minW={0}>
                <Icon as={FiLayers} boxSize={3} color="blue.400" />
                <Text noOfLines={1}>{course.curriculum?.totalModules ?? 0} modules</Text>
              </HStack>
              <Text color={dividerColor}>|</Text>
              <HStack spacing={1} minW={0}>
                <Icon as={FiClock} boxSize={3} color="orange.400" />
                <Text noOfLines={1}>{formatDate(course.validTill)}</Text>
              </HStack>
            </HStack>
          </Box>

          <HStack spacing={2} flexWrap="wrap">
            <Button
              size="sm"
              h="32px"
              px={3}
              fontSize="xs"
              colorScheme="blue"
              borderRadius="lg"
              rightIcon={<FiArrowRight />}
              onClick={(event) => {
                event.stopPropagation();
                handleOpenCourse(course.courseId);
              }}
            >
              {progress > 0 ? "Continue" : "Start"}
            </Button>
            {shouldShowCertificateButton ? (
              <Button
                size="sm"
                h="32px"
                px={2.5}
                fontSize="xs"
                variant="outline"
                colorScheme={canDownloadCertificate ? "green" : "gray"}
                borderRadius="lg"
                leftIcon={<FiDownload />}
                isDisabled={!canDownloadCertificate}
                isLoading={canDownloadCertificate && isCertificateDownloading}
                title={canDownloadCertificate ? "Download certificate" : certificateReason}
                onClick={(event) => {
                  event.stopPropagation();
                  if (canDownloadCertificate) {
                    handleDownloadCertificate?.(course.courseId);
                  }
                }}
              >
                Certificate
              </Button>
            ) : null}
          </HStack>
        </Flex>
      </Flex>

      <Box display={{ base: "none", md: "block" }}>
      <Box position="relative" overflow="hidden">
        <AspectRatio ratio={16 / 9}>
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              objectFit="cover"
              transition="transform 0.5s ease"
              _groupHover={{ transform: "scale(1.05)" }}
            />
          ) : (
            <Box bgGradient="linear(to-br, blue.700, teal.400)" w="full" h="full" />
          )}
        </AspectRatio>

        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-t, blackAlpha.700, transparent 58%)"
          pointerEvents="none"
        />

        <HStack
          position="absolute"
          top="10px"
          right="12px"
          bg="rgba(0, 0, 0, 0.42)"
          backdropFilter="blur(12px)"
          border="1px solid rgba(255, 255, 255, 0.18)"
          px={3}
          py={1}
          borderRadius="full"
          spacing={2}
        >
          <Circle size="7px" bg={dotColor} />
          <Text fontSize="11px" fontWeight="800" color="white" whiteSpace="nowrap">
            {statusLabel}
          </Text>
        </HStack>

        <CircularProgress
          position="absolute"
          bottom="10px"
          left="12px"
          value={progress}
          size="54px"
          thickness="9px"
          color="blue.300"
          trackColor="whiteAlpha.500"
        >
          <CircularProgressLabel color="white" fontSize="xs" fontWeight="800">
            {progress}%
          </CircularProgressLabel>
        </CircularProgress>
      </Box>

      <Box px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
        <Flex gap={3} align="start" mb={3}>
          <Circle size={{ base: "40px", md: "46px" }} bg={iconBg} color="blue.500" flexShrink={0}>
            <Icon as={FiBookOpen} boxSize={5} />
          </Circle>

          <Box minW={0} flex="1">
            <Text
              fontWeight="800"
              fontSize={{ base: "md", md: "lg" }}
              lineHeight="1.25"
              color={titleColor}
              noOfLines={2}
            >
              {course.title}
            </Text>
            <Text color={subduedText} fontSize="sm" noOfLines={1} display={{ base: "none", md: "block" }} mt={1}>
              {truncateText(course.description?.text)}
            </Text>
          </Box>
        </Flex>

        {assessmentLabel ? (
          <Box
            mb={3}
            px={3}
            py={2}
            borderRadius="full"
            bg={assessmentBg}
            color={assessmentText}
            fontSize="12px"
            fontWeight="800"
            display="inline-flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={FiStar} boxSize={4} />
            {assessmentLabel}
          </Box>
        ) : null}

        <Box mb={4}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="10px" color={subduedText} fontWeight="800" textTransform="uppercase">
              Progress
            </Text>
            <Text fontSize="10px" fontWeight="800" color="blue.500">
              {progress}%
            </Text>
          </HStack>
          <Progress
            value={progress}
            size="xs"
            borderRadius="full"
            bg={progressTrack}
            sx={{
              "& > div": {
                background:
                  "linear-gradient(90deg, var(--chakra-colors-blue-600) 0%, var(--chakra-colors-teal-300) 100%)",
                borderRadius: "full",
              },
            }}
          />
        </Box>

        <Box
          bg={metricsBg}
          borderRadius="xl"
          py={{ base: 2, md: 3 }}
          display="grid"
          gridTemplateColumns="1fr 1px 1fr 1px 1fr"
          alignItems="center"
        >
          <MetricItem
            icon={FiLayers}
            iconColor="blue.400"
            label="Modules"
            value={course.curriculum?.totalModules ?? 0}
            valueColor={metricsValueColor}
            labelColor={metricsLabelColor}
          />
          <Box h="28px" bg={dividerColor} />
          <MetricItem
            icon={FiPlayCircle}
            iconColor="teal.400"
            label="Status"
            value={course.status?.replace(/_/g, " ") ?? "-"}
            valueColor={metricsValueColor}
            labelColor={metricsLabelColor}
          />
          <Box h="28px" bg={dividerColor} />
          <MetricItem
            icon={FiClock}
            iconColor="orange.400"
            label="Valid till"
            value={formatDate(course.validTill)}
            valueColor={metricsValueColor}
            labelColor={metricsLabelColor}
          />
        </Box>

        <Button
          mt={4}
          w="full"
          h={{ base: "42px", md: "44px" }}
          colorScheme="blue"
          borderRadius="xl"
          rightIcon={<FiArrowRight />}
          onClick={(event) => {
            event.stopPropagation();
            handleOpenCourse(course.courseId);
          }}
        >
          {progress > 0 ? "Continue" : "Start"}
        </Button>
        {shouldShowCertificateButton ? (
          <Button
            mt={2}
            w="full"
            h={{ base: "42px", md: "44px" }}
            variant="outline"
            colorScheme={canDownloadCertificate ? "green" : "gray"}
            borderRadius="xl"
            leftIcon={<FiAward />}
            rightIcon={<FiDownload />}
            isDisabled={!canDownloadCertificate}
            isLoading={canDownloadCertificate && isCertificateDownloading}
            title={canDownloadCertificate ? "Download certificate" : certificateReason}
            onClick={(event) => {
              event.stopPropagation();
              if (canDownloadCertificate) {
                handleDownloadCertificate?.(course.courseId);
              }
            }}
          >
            {certificateButtonLabel}
          </Button>
        ) : null}
      </Box>
      </Box>
    </MotionBox>
  );
};

export default MYCourseBoardCard;

const MetricItem = ({
  icon,
  label,
  value,
  iconColor,
  valueColor,
  labelColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  iconColor: string;
  valueColor: string;
  labelColor: string;
}) => (
  <VStack spacing={1} align="center" justify="center" w="100%" minW={0} px={1}>
    <HStack spacing={1} justify="center" w="100%" px={1}>
      <Icon as={icon} color={iconColor} boxSize={4} flexShrink={0} />
      <Text fontSize="xs" fontWeight="800" color={valueColor} textTransform="capitalize" noOfLines={1}>
        {value}
      </Text>
    </HStack>
    <Text fontSize="10px" color={labelColor} fontWeight="600" textAlign="center" noOfLines={1}>
      {label}
    </Text>
  </VStack>
);
