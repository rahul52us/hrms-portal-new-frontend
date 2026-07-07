'use client';

import { Box, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const DashboardCard = ({ label, value, icon, color, href }: any) => {
  const router = useRouter();

  // Theme-based colors
  const baseBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const accentColor = useColorModeValue(`${color}.600`, `${color}.400`);
  const overlayColor = useColorModeValue(`${color}.100`, `${color}.900`);

  // Card animation
  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    hover: {
      y: -8,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      borderColor: accentColor,
      transition: { duration: 0.2, ease: 'easeInOut' }
    },
  };


  return (
    <MotionBox
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      bg={baseBg}
      borderRadius="xl"
      position="relative"
      overflow="hidden"
      boxShadow="lg"
      borderTopWidth="4px"
      borderTopColor={accentColor}
      cursor="pointer"
      onClick={() => router.push(href)}
      transition={{ duration: 0.2 }}
    >
      {/* Background Gradient Blob for visual interest */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="150px"
        h="150px"
        bg={overlayColor}
        borderRadius="full"
        opacity={0.4}
        filter="blur(30px)"
        zIndex={0}
      />

      {/* Content */}
      <Flex
        direction="row"
        align="center"
        justify="space-between"
        h="100%"
        p={6}
        position="relative"
        zIndex={2}
      >
        {/* Left: Icon and Value */}
        <Flex direction="column" justify="center">
          <Flex
            align="center"
            justify="center"
            w={14}
            h={14}
            borderRadius="lg"
            bg={overlayColor}
            color={accentColor}
            mb={3}
            boxShadow="md"
          >
             <Icon as={icon} w={7} h={7} />
          </Flex>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color={textColor}
            lineHeight="1.2"
            letterSpacing="tight"
          >
            {value.toLocaleString()}
          </Text>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="gray.500"
            mt={1}
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {label}
          </Text>
        </Flex>

        {/* Right: Decorative Icon Watermark */}
        <Icon
          as={icon}
          w={24}
          h={24}
          position="absolute"
          right={-4}
          bottom={-6}
          color={accentColor}
          opacity={0.05}
          transform="rotate(-10deg)"
        />
      </Flex>
    </MotionBox>
  );
};

export default DashboardCard;