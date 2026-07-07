'use client';

import {
  Badge,
  Box,
  Button, Circle,
  Container,
  Divider,
  Flex, FormControl, FormLabel,
  Heading,
  HStack, Icon,
  Image,
  Input,
  SimpleGrid, Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import {
  FaChalkboardTeacher,
  FaGlobe,
  FaHeadset,
  FaMapMarkerAlt, FaPaperPlane,
  FaPhoneAlt,
  FaQuestionCircle,
  FaUser
} from 'react-icons/fa';

const MotionBox = motion(Box);

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  // ✅ Dark mode variables (same pattern as your footer)
  const bgMain = useColorModeValue("white", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textPrimary = useColorModeValue("gray.800", "whiteAlpha.900");
  const textSecondary = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({
      title: "Message Sent.",
      description: "We'll get back to you within 24 hours.",
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top-right",
    });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Box bg={bgMain} minH="100vh">
      {/* --- TOP HEADER DECORATION --- */}
      <Box bg="blue.600" h="350px" w="full" position="absolute" top="0" zIndex="0" />

      <Container maxW="1200px" pt={{ base: 20, md: 32 }} pb={20} position="relative" zIndex="1">
        <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={{ base: 10, lg: 0 }} shadow="2xl" borderRadius="3xl" overflow="hidden">
          
          {/* --- LEFT SIDE --- */}
          <Box 
            gridColumn={{ lg: "span 5" }} 
            bg="blue.700" 
            p={{ base: 8, md: 16 }} 
            color="white"
            position="relative"
            display="flex"
            flexDirection="column"
          >
            <Stack spacing={10} flex="1">
              <Box>
                <Badge bg="blue.500" color="white" px={4} py={1} rounded="full" mb={6}>
                  LMS Support
                </Badge>
                <Heading size="2xl" fontWeight="900" letterSpacing="-1px" mb={6}>
                  How can we <br />
                  <Text as="span" color="blue.200">help you?</Text>
                </Heading>
                <Text fontSize="lg" color="blue.50" opacity="0.9">
                  Whether you're looking for corporate training solutions or need help accessing your course portal, our team is ready to assist.
                </Text>
              </Box>

              <VStack align="start" spacing={8}>
                <ContactMethod 
                  icon={FaHeadset} 
                  title="Priority Support" 
                  detail="support@craftlms.com" 
                  subDetail="Available 24/7 for Enterprise"
                />
                <ContactMethod 
                  icon={FaPhoneAlt} 
                  title="Learning Advisor" 
                  detail="+91 22 4567 8900" 
                  subDetail="Mon - Sat, 10 AM - 7 PM"
                />
                <ContactMethod 
                  icon={FaGlobe} 
                  title="Global Office" 
                  detail="BKC Financial Hub" 
                  subDetail="Mumbai, MH 400051"
                />
              </VStack>

              <Divider borderColor="whiteAlpha.300" />
            </Stack>
            
            <Box mt={10} position="relative">
              <Image 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop" 
                alt="Corporate Training Room" 
                borderRadius="2xl"
                shadow="xl"
                filter="brightness(0.9)"
              />
              <Flex 
                position="absolute" 
                top="10px" 
                right="10px" 
                bg="whiteAlpha.200" 
                backdropFilter="blur(5px)" 
                p={3} 
                borderRadius="full" 
                color="white"
              >
                <Icon as={FaChalkboardTeacher} boxSize={5} />
                <Text fontSize="xs" fontWeight="bold" ml={2}>Training Center</Text>
              </Flex>
            </Box>
          </Box>

          {/* --- RIGHT SIDE --- */}
          <Box 
            gridColumn={{ lg: "span 7" }} 
            bg={cardBg} 
            p={{ base: 8, md: 16 }}
          >
            <VStack align="start" spacing={8} mb={10}>
              <Heading size="lg" color={textPrimary}>Send us a Message</Heading>
              <Text color={textSecondary}>Fields marked with an asterisk (*) are required.</Text>
            </VStack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold" fontSize="xs" color={textSecondary} textTransform="uppercase">Full Name</FormLabel>
                    <Input 
                      placeholder="Jane Smith" 
                      h="55px" 
                      bg={inputBg}
                      border="none" 
                      _focus={{ bg: cardBg, ring: 2, ringColor: "blue.500" }} 
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold" fontSize="xs" color={textSecondary} textTransform="uppercase">Work Email</FormLabel>
                    <Input 
                      type="email" 
                      placeholder="jane@company.com" 
                      h="55px" 
                      bg={inputBg}
                      border="none" 
                      _focus={{ bg: cardBg, ring: 2, ringColor: "blue.500" }} 
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontWeight="bold" fontSize="xs" color={textSecondary} textTransform="uppercase">Inquiry Type</FormLabel>
                  <Input 
                    placeholder="e.g. Corporate Enrollment, Login Issue" 
                    h="55px" 
                    bg={inputBg}
                    border="none" 
                    _focus={{ bg: cardBg, ring: 2, ringColor: "blue.500" }} 
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="bold" fontSize="xs" color={textSecondary} textTransform="uppercase">Your Message</FormLabel>
                  <Textarea 
                    placeholder="Describe your request in detail..." 
                    bg={inputBg}
                    border="none" 
                    rows={6} 
                    _focus={{ bg: cardBg, ring: 2, ringColor: "blue.500" }} 
                  />
                </FormControl>

                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  size="lg" 
                  h="65px" 
                  w="full"
                  fontSize="md"
                  fontWeight="bold"
                  rounded="xl"
                  shadow="lg"
                  isLoading={submitted}
                  rightIcon={<Icon as={FaPaperPlane} />}
                  _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                >
                  Submit Request
                </Button>
              </Stack>
            </form>
          </Box>
        </SimpleGrid>

        {/* --- BOTTOM --- */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mt={20}>
          <QuickLinkCard 
            icon={FaQuestionCircle} 
            title="General FAQ" 
            desc="Find quick answers about certifications and course access." 
          />
          <QuickLinkCard 
            icon={FaMapMarkerAlt} 
            title="Office Locations" 
            desc="Visit our regional learning centers across India." 
          />
          <QuickLinkCard 
            icon={FaUser} 
            title="Corporate Training" 
            desc="Looking to train your team? Get a custom quote." 
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function ContactMethod({ icon, title, detail, subDetail }: any) {
  return (
    <HStack spacing={6} align="start">
      <Circle size="48px" bg="whiteAlpha.200" color="blue.200">
        <Icon as={icon} boxSize={5} />
      </Circle>
      <VStack align="start" spacing={0}>
        <Text fontSize="xs" fontWeight="bold" color="blue.300" textTransform="uppercase" letterSpacing="widest">
          {title}
        </Text>
        <Text fontSize="lg" fontWeight="bold">{detail}</Text>
        <Text fontSize="xs" color="blue.100" opacity="0.7">{subDetail}</Text>
      </VStack>
    </HStack>
  );
}

function QuickLinkCard({ icon, title, desc }: any) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const titleColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const descColor = useColorModeValue("gray.500", "gray.400");

  return (
    <HStack 
      p={6} 
      bg={bg}
      borderRadius="2xl" 
      borderWidth="1px" 
      borderColor={border}
      shadow="sm"
      _hover={{ transform: "translateY(-5px)", shadow: "md", borderColor: "blue.200" }}
      transition="all 0.3s"
      cursor="pointer"
    >
      <Circle size="50px" bg="blue.50" color="blue.600">
        <Icon as={icon} boxSize={5} />
      </Circle>
      <Box>
        <Text fontWeight="bold" fontSize="md" color={titleColor}>{title}</Text>
        <Text fontSize="sm" color={descColor}>{desc}</Text>
      </Box>
    </HStack>
  );
}