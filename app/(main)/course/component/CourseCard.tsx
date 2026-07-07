'use client';

import {
  Box,
  Badge,
  Heading,
  Text,
  Image,
  HStack,
  VStack,
  Icon,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiStar, FiClock } from 'react-icons/fi';

const MotionBox = motion(Box);

function formatCurrency(value?: number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

interface CourseCardProps {
  course: any;
  enrolled?: boolean;
  onClick: () => void;
}

export const CourseCard = ({ course, enrolled, onClick }: CourseCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const softText = useColorModeValue('gray.600', 'gray.400');
  const textPrimary = useColorModeValue('gray.800', 'whiteAlpha.900');

  const accentGradients = [
    'linear-gradient(135deg, #3182ce 0%, #63b3ed 100%)',
    'linear-gradient(135deg, #48bb78 0%, #81e6d9 100%)',
    'linear-gradient(135deg, #805ad5 0%, #b794f4 100%)',
    'linear-gradient(135deg, #dd6b20 0%, #fbd38d 100%)',
  ];

  const placeholderBg = accentGradients[Math.abs(course.title.charCodeAt(0) || 0) % accentGradients.length];

  return (
    <MotionBox
      whileHover={{ y: -8 }}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="0 18px 45px rgba(15, 23, 42, 0.06)"
      display="flex"
      flexDirection="column"
      height="100%"
      cursor="pointer"
      onClick={onClick}
      position="relative"
    >
      {/* THUMBNAIL */}
      <Box position="relative" overflow="hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            h={{ base: '128px', md: '180px' }}
            w="full"
            objectFit="cover"
            transition="transform 0.5s ease"
            _hover={{ transform: 'scale(1.05)' }}
          />
        ) : (
          <Flex h={{ base: '128px', md: '180px' }} bgImage={placeholderBg} align="center" justify="center" color="white">
            <Icon as={FiClock} boxSize={8} opacity={0.8} />
          </Flex>
        )}

        {/* OVERLAY BADGES */}
        <HStack position="absolute" top={3} left={3} spacing={2} flexWrap="wrap">
          <Badge colorScheme="green" borderRadius="full" px={3} py={0.5}>
            Public
          </Badge>
          <Badge colorScheme="blue" borderRadius="full" px={3} py={0.5}>
            {course.courseType === 'scorm' ? 'SCORM' : 'Standard'}
          </Badge>
          {enrolled && (
            <Badge colorScheme="purple" borderRadius="full" px={3} py={0.5}>
              Enrolled
            </Badge>
          )}
        </HStack>
      </Box>

      {/* CONTENT */}
      <VStack p={5} align="stretch" spacing={3} flex="1" justify="space-between">
        <Box>
          <HStack spacing={2} flexWrap="wrap" mb={2}>
            {(course.taxonomy?.categories || []).slice(0, 1).map((category: string) => (
              <Badge key={category} borderRadius="full" px={2.5} py={0.5} variant="subtle" colorScheme="gray">
                {category}
              </Badge>
            ))}
            <Badge colorScheme="purple" borderRadius="full" px={2.5} py={0.5} variant="subtle">
              {course.taxonomy?.level || 'Beginner'}
            </Badge>
          </HStack>

          <Heading size="sm" mb={2} color={textPrimary} noOfLines={2} fontWeight="bold" lineHeight="1.4">
            {course.title}
          </Heading>

          <Text fontSize="sm" color={mutedText} noOfLines={2}>
            {course.description?.text || 'Explore this course to review the curriculum, pricing, and assessments.'}
          </Text>
        </Box>

        <Box>
          <SimpleGrid columns={2} spacing={3} mt={2} pt={3} borderTopWidth="1px" borderColor={borderColor}>
            <Box>
              <Text fontSize="10px" color={softText} textTransform="uppercase" letterSpacing="0.08em">
                Price
              </Text>
              <HStack spacing={1} mt={0.5}>
                <Text fontWeight="850" fontSize="sm" color="green.500">
                  {formatCurrency(course.commerce?.amountInRupees)}
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="10px" color={softText} textTransform="uppercase" letterSpacing="0.08em">
                Rating
              </Text>
              <HStack spacing={1} mt={0.5}>
                <Icon as={FiStar} color="orange.400" boxSize={3.5} />
                <Text fontWeight="bold" fontSize="sm" color={textPrimary}>
                  {course.metrics?.averageRating ? course.metrics.averageRating.toFixed(1) : 'New'}
                </Text>
              </HStack>
            </Box>
          </SimpleGrid>

        </Box>
      </VStack>
    </MotionBox>
  );
};

// Help Chakra compile correctly as a Flexbox fallback element
const Flex = ({ children, ...props }: any) => (
  <Box display="flex" {...props}>
    {children}
  </Box>
);