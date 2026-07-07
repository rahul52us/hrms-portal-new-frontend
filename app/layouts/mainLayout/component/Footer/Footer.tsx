'use client'

import React from "react";
import {
  Box,
  Container,
  Flex,
  HStack,
  Icon,
  Image,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FaInstagram, FaLinkedin, FaTwitter, FaYoutube } from "react-icons/fa";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: "Home", href: "/" },
      { name: "Courses", href: "/course" },
      { name: "Batches", href: "/batches" },
    ],
    company: [
      { name: "About Us", href: "/about-us" },
      { name: "Contact Us", href: "/contact-us" },
      { name: "Careers", href: "/careers" },
      { name: "Instructor Portal", href: "/instructor" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  const footerBg = useColorModeValue("white", "gray.900");
  const panelBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const footerBorder = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const headingColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      as="footer"
      bg={footerBg}
      borderTop="1px solid"
      borderColor={footerBorder}
      pt={{ base: 7, md: 10 }}
      pb={{ base: "96px", md: 7 }}
    >
      <Container maxW="1400px" px={{ base: 4, md: 6 }}>
        <Box
          borderWidth="1px"
          borderColor={footerBorder}
          borderRadius={{ base: "2xl", md: "3xl" }}
          bg={panelBg}
          p={{ base: 4, md: 6 }}
        >
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 6, md: 8 }}>
            <Stack spacing={{ base: 4, md: 5 }}>
              <NextLink href="/" passHref legacyBehavior>
                <ChakraLink _hover={{ textDecoration: "none" }} display="flex" alignItems="center" gap={3}>
                  <Image
                    src="https://www.lmscert.com/Logo%20LMS%20-1-.svg"
                    alt="CRAFT LMS Logo"
                    h={{ base: "34px", md: "40px" }}
                    objectFit="contain"
                  />
                  <Text
                    fontWeight="900"
                    fontSize={{ base: "lg", md: "xl" }}
                    bgGradient="linear(to-tr, brand.600, brand.400)"
                    bgClip="text"
                  >
                    CRAFT
                  </Text>
                </ChakraLink>
              </NextLink>
              <Text color={textColor} fontSize="sm" lineHeight="1.7">
                Empowering learners worldwide with industry-standard certifications and expert-led courses.
              </Text>
              <HStack spacing={2.5}>
                {[FaTwitter, FaLinkedin, FaInstagram, FaYoutube].map((socialIcon, index) => (
                  <ChakraLink
                    key={index}
                    href="#"
                    color={subtleText}
                    w="36px"
                    h="36px"
                    display="grid"
                    placeItems="center"
                    borderRadius="full"
                    bg={footerBg}
                    borderWidth="1px"
                    borderColor={footerBorder}
                    transition="all 0.25s ease"
                    _hover={{ color: "brand.500", transform: "translateY(-2px)", textDecoration: "none" }}
                  >
                    <Icon as={socialIcon} boxSize={5} />
                  </ChakraLink>
                ))}
              </HStack>
            </Stack>

            {[
              { title: "Platform", links: footerLinks.platform },
              { title: "Company", links: footerLinks.company },
            ].map((section) => (
              <Stack key={section.title} spacing={3}>
                <Text fontWeight="bold" fontSize="md" color={headingColor}>
                  {section.title}
                </Text>
                {section.links.map((link) => (
                  <NextLink key={link.name} href={link.href} passHref legacyBehavior>
                    <ChakraLink fontSize="sm" color={textColor} _hover={{ color: "brand.500", textDecoration: "none" }}>
                      {link.name}
                    </ChakraLink>
                  </NextLink>
                ))}
              </Stack>
            ))}

            <Stack spacing={3}>
              <Text fontWeight="bold" fontSize="md" color={headingColor}>
                Support
              </Text>
              <Text fontSize="sm" color={textColor}>
                Have questions? Reach out to our learning advisors.
              </Text>
              <NextLink href="/contact-us" passHref legacyBehavior>
                <ChakraLink
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  alignSelf="flex-start"
                  bg={footerBg}
                  color="brand.600"
                  fontWeight="bold"
                  px={3.5}
                  py={2}
                  rounded="lg"
                  fontSize="sm"
                  borderWidth="1px"
                  borderColor={footerBorder}
                  transition="all 0.2s"
                  _hover={{ bg: "brand.600", color: "white", textDecoration: "none" }}
                >
                  Contact Support
                </ChakraLink>
              </NextLink>
            </Stack>
          </SimpleGrid>
        </Box>

        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          pt={{ base: 5, md: 6 }}
          gap={{ base: 3, md: 4 }}
        >
          <Text fontSize="xs" color={textColor}>
            (c) {currentYear} <Box as="span" fontWeight="bold">CRAFT LMS</Box>. All rights reserved.
          </Text>

          <HStack spacing={{ base: 3, md: 6 }} flexWrap="wrap" justify="center">
            {footerLinks.legal.map((link) => (
              <NextLink key={link.name} href={link.href} passHref legacyBehavior>
                <ChakraLink fontSize="xs" color={subtleText} _hover={{ color: "brand.600" }}>
                  {link.name}
                </ChakraLink>
              </NextLink>
            ))}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
