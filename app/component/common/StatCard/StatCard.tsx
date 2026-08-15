import { Box, Flex, Text, Center, Icon, useColorModeValue } from "@chakra-ui/react";

export const StatCard = ({ label, value, helper, icon, color }: any) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const shadow = useColorModeValue("0 4px 20px -5px rgba(0,0,0,0.05)", "0 4px 20px -5px rgba(0,0,0,0.5)");
  const hoverShadow = useColorModeValue("0 10px 25px -5px rgba(0,0,0,0.1)", "0 10px 25px -5px rgba(0,0,0,0.7)");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue(`${color}.50`, `color-mix(in srgb, var(--chakra-colors-${color}-400) 15%, transparent)`);
  const iconColor = useColorModeValue(`${color}.600`, `${color}.300`);

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={5}
      boxShadow={shadow}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{ transform: "translateY(-3px)", boxShadow: hoverShadow }}
      position="relative"
      borderWidth="1px"
      borderColor={useColorModeValue("gray.100", "gray.700")}
      borderLeftWidth="4px"
      borderLeftColor={useColorModeValue(`${color}.400`, `${color}.500`)}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="800" color={useColorModeValue(`${color}.600`, `${color}.300`)} textTransform="uppercase" letterSpacing="wider">
            {label}
          </Text>
          <Text mt={1.5} fontSize="3xl" fontWeight="900" lineHeight="1" letterSpacing="-1px">
            {value}
          </Text>
          {helper ? (
            <Text mt={1.5} fontSize="xs" color={muted} noOfLines={1} fontWeight="500">
              {helper}
            </Text>
          ) : null}
        </Box>
        <Center boxSize={10} borderRadius="lg" bg={iconBg} color={iconColor} flexShrink={0} borderWidth="1px" borderColor={useColorModeValue(`${color}.100`, "transparent")}>
          <Icon as={icon} boxSize={4} strokeWidth={2.5} />
        </Center>
      </Flex>
    </Box>
  );
};
