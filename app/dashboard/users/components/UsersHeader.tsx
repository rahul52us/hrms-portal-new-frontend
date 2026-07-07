"use client";

import { Box, Button, Flex, HStack, Text, Icon, Badge, useColorModeValue } from "@chakra-ui/react";
import { FiUpload, FiUserPlus, FiUsers, FiShield } from "react-icons/fi";

type Props = {
  onOpenBulk: () => void;
  onOpenCreate: () => void;
  borderColor: string;
  muted: string;
  canOpenBulk?: boolean;
  canOpenCreate?: boolean;
  totalUsers?: number;
  activeUsers?: number;
};

const UsersHeader = ({
  onOpenBulk,
  onOpenCreate,
  borderColor,
  muted,
  canOpenBulk = true,
  canOpenCreate = true,
  totalUsers = 0,
  activeUsers = 0,
}: Props) => {
  // Dark mode compatible color values
  const bgColor = useColorModeValue("white", "gray.800");
  const iconBg = useColorModeValue("blue.50", "gray.700");
  const iconColor = useColorModeValue("blue.600", "blue.300");
  const gradientFrom = useColorModeValue("blue.600", "blue.400");
  const gradientTo = useColorModeValue("purple.600", "purple.400");
  const statLabelColor = useColorModeValue("gray.500", "gray.400");
  const statValueColor = useColorModeValue("gray.700", "gray.100");
  const badgeBg = useColorModeValue("purple.50", "gray.700");
  const badgeColor = useColorModeValue("purple.600", "purple.300");
  const outlineButtonColor = useColorModeValue("purple.600", "purple.300");
  const outlineButtonBorder = useColorModeValue("purple.400", "purple.500");
  const outlineButtonHoverBg = useColorModeValue("purple.50", "gray.700");

  return (
    <Box
      bg={bgColor}
      borderRadius={{ base: "xl", md: "2xl" }}
      borderWidth="1px"
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
      boxShadow="md"
      transition="all 0.2s"
      _hover={{ boxShadow: "xl" }}
    >
      {/* Decorative gradient bar at the top */}
      <Box
        h="1"
        bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
        position="absolute"
        top="0"
        left="0"
        right="0"
      />

      <Box p={{ base: 4, md: 6 }}>
        <Flex
          justify="space-between"
          align={{ base: "start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={{ base: 4, md: 6 }}
        >
          {/* Left Section - Title & Stats */}
          <Box flex="1">
            <Flex align="center" gap={3} mb={2} flexWrap="wrap">
              <Flex
                align="center"
                justify="center"
                bg={iconBg}
                p={2}
                borderRadius="xl"
              >
                <Icon as={FiUsers} boxSize={6} color={iconColor} />
              </Flex>
              <Box>
                <Text
                  fontSize={{ base: "xl", md: "3xl" }}
                  fontWeight="extrabold"
                  bgGradient={`linear(to-r, ${gradientFrom}, ${gradientTo})`}
                  bgClip="text"
                >
                  Users Management
                </Text>
                <Text color={muted} fontSize="sm" mt={1} display={{ base: "none", sm: "block" }}>
                  Manage users, managers, hierarchy and onboarding
                </Text>
              </Box>
            </Flex>

            {/* Stats Section - Only show if there is data */}
            {(totalUsers > 0 || activeUsers > 0) && (
              <HStack spacing={4} mt={3} ml={{ base: 0, md: 12 }} flexWrap="wrap" display={{ base: "none", md: "flex" }}>
                {totalUsers > 0 && (
                  <Flex align="center" gap={2}>
                    <Icon as={FiUsers} boxSize={4} color={statLabelColor} />
                    <Text fontSize="sm" color={statLabelColor}>
                      Total:{" "}
                      <Text as="span" fontWeight="bold" color={statValueColor}>
                        {totalUsers}
                      </Text>
                    </Text>
                  </Flex>
                )}
                {activeUsers > 0 && (
                  <Flex align="center" gap={2}>
                    <Box
                      w="2"
                      h="2"
                      bg="green.500"
                      borderRadius="full"
                      boxShadow="0 0 0 2px rgba(72, 187, 120, 0.2)"
                    />
                    <Text fontSize="sm" color={statLabelColor}>
                      Active:{" "}
                      <Text as="span" fontWeight="bold" color={statValueColor}>
                        {activeUsers}
                      </Text>
                    </Text>
                  </Flex>
                )}
                <Badge
                  bg={badgeBg}
                  color={badgeColor}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                >
                  <Icon as={FiShield} mr={1} boxSize={3} />
                  Admin Access
                </Badge>
              </HStack>
            )}
          </Box>

          {/* Right Section - Action Buttons */}
          <HStack
            spacing={3}
            alignSelf={{ base: "stretch", md: "auto" }}
            flexWrap="wrap"
            justify={{ base: "stretch", md: "flex-end" }}
            w={{ base: "full", md: "auto" }}
          >
            {canOpenBulk && (
              <Button
                leftIcon={<Icon as={FiUpload} />}
                variant="outline"
                onClick={onOpenBulk}
                size={{ base: "sm", md: "lg" }}
                px={{ base: 3.5, md: 6 }}
                borderWidth="2px"
                borderColor={outlineButtonBorder}
                color={outlineButtonColor}
                _hover={{
                  bg: outlineButtonHoverBg,
                  borderColor: useColorModeValue("purple.500", "purple.400"),
                  transform: "translateY(-2px)",
                  boxShadow: "md",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
                w={{ base: "full", md: "auto" }}
              >
                Excel Upload
              </Button>
            )}

            {canOpenCreate && (
              <Button
                leftIcon={<Icon as={FiUserPlus} />}
                onClick={onOpenCreate}
                size={{ base: "sm", md: "lg" }}
                px={{ base: 3.5, md: 6 }}
                bgGradient={`linear(to-r, ${gradientFrom}, ${gradientTo})`}
                color="white"
                _hover={{
                  bgGradient: `linear(to-r, ${useColorModeValue("blue.600", "blue.500")}, ${useColorModeValue("purple.700", "purple.600")})`,
                  transform: "translateY(-2px)",
                  boxShadow: "lg",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
                boxShadow="md"
                w={{ base: "full", md: "auto" }}
              >
                Add User
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};

export default UsersHeader;
