"use client";

import { Box, Flex, HStack, Text, IconButton, Icon, useColorModeValue, Heading } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";

export interface PageBannerProps {
  titlePrefix?: string;
  titleHighlight?: string;
  title?: string; // Fallback if no prefix/highlight
  subtitle?: string;
  icon?: any;
  statLabel?: string;
  statIcon?: any;
  showBackButton?: boolean;
  onBack?: () => void;
  colorScheme?: string; // default is "purple"
  children?: React.ReactNode;
}

export const PageBanner = ({
  titlePrefix,
  titleHighlight,
  title,
  subtitle,
  icon,
  statLabel,
  statIcon,
  showBackButton = true,
  onBack,
  colorScheme = "purple",
  children,
}: PageBannerProps) => {
  const router = useRouter();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const highlightColor = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.400`);
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  
  // Icon styling
  const iconBg = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.500`);
  const iconShadow = useColorModeValue(`0 4px 14px 0 rgba(128, 90, 213, 0.39)`, `0 4px 14px 0 rgba(128, 90, 213, 0.2)`); // Base it on purple since that's default, but can adapt.
  
  // Stat styling
  const statBg = useColorModeValue("blue.50", "blue.900");
  const statColor = useColorModeValue("blue.600", "blue.300");

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      rounded={{ base: "xl", md: "2xl" }}
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      shadow="sm"
      w="full"
      mb={6}
    >
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4}>
        <HStack spacing={{ base: 3, md: 4 }} align="flex-start">
          {showBackButton && (
            <IconButton
              aria-label="Go back"
              icon={<FiArrowLeft />}
              variant="ghost"
              colorScheme="gray"
              isRound
              onClick={handleBack}
              size="md"
              bg={useColorModeValue("gray.50", "gray.700")}
              _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
              alignSelf="center"
            />
          )}
          
          {icon && (
            <Box
              display="flex"
              p={{ base: 2.5, md: 3 }}
              bgGradient="linear(to-br, #6269FF, #8A2BE2)"
              rounded="full"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 4px 15px rgba(98,105,255,0.4)"
              border="1px solid"
              borderColor="rgba(255,255,255,0.2)"
            >
              <Icon as={icon} boxSize={{ base: 4, md: 5 }} color="white" />
            </Box>
          )}

          <Box>
            <Heading size={{ base: "sm", md: "lg" }} fontWeight="900" letterSpacing="tight" lineHeight="1.2" textTransform="uppercase">
              {titlePrefix && (
                <Box as="span" color={useColorModeValue("gray.900", "white")}>
                  {titlePrefix}{" "}
                </Box>
              )}
              {titleHighlight && (
                <Box as="span" bgGradient={useColorModeValue(`linear(to-r, ${colorScheme}.500, ${colorScheme}.700)`, `linear(to-r, ${colorScheme}.300, ${colorScheme}.500)`)} bgClip="text">
                  {titleHighlight}
                </Box>
              )}
              {!titlePrefix && !titleHighlight && title && (
                <Box as="span" color={useColorModeValue("gray.900", "white")}>
                  {title}
                </Box>
              )}
            </Heading>
            
            {subtitle && (
              <Text mt={1} fontSize={{ base: "2xs", md: "xs" }} fontWeight="700" color={useColorModeValue("gray.500", "gray.400")} letterSpacing="0.1em" textTransform="uppercase" noOfLines={1}>
                {subtitle}
              </Text>
            )}
          </Box>
        </HStack>

        {(statLabel || children) && (
          <Flex
            gap={4}
            w={{ base: "100%", md: "auto" }}
            justify={{ base: "flex-start", md: "flex-end" }}
            align={{ base: "stretch", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
          >
            {statLabel && (
              <Box
                bg={useColorModeValue(`${colorScheme}.50`, `rgba(98,105,255,0.15)`)}
                color={useColorModeValue(`${colorScheme}.600`, `#6269FF`)}
                borderRadius="full"
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="800"
                textAlign="center"
              >
                <Flex align="center" justify="center" gap={1.5}>
                  {statIcon && <Icon as={statIcon} boxSize={3.5} />}
                  {statLabel}
                </Flex>
              </Box>
            )}
            
            {children && (
              <Box w={{ base: "100%", sm: "auto" }}>
                {children}
              </Box>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};
