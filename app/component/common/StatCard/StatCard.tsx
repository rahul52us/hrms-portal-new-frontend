import { Box, HStack, Icon, Text } from "@chakra-ui/react";

import { IconType } from "react-icons";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: IconType;
  colorScheme: "blue" | "green" | "orange" | "purple";
};

export default function StatCard({
  label,
  value,
  icon,
  colorScheme,
}: StatCardProps) {
  const colorMap = {
    blue: {
      lightBg: "blue.50",
      hoverBg: "blue.100",
      iconBg: "blue.100",
      iconHoverBg: "blue.200",
      iconColor: "blue.600",
    },
    green: {
      lightBg: "green.50",
      hoverBg: "green.100",
      iconBg: "green.100",
      iconHoverBg: "green.200",
      iconColor: "green.600",
    },
    orange: {
      lightBg: "orange.50",
      hoverBg: "orange.100",
      iconBg: "orange.100",
      iconHoverBg: "orange.200",
      iconColor: "orange.600",
    },
    purple: {
      lightBg: "purple.50",
      hoverBg: "purple.100",
      iconBg: "purple.100",
      iconHoverBg: "purple.200",
      iconColor: "purple.600",
    },
  };

  const styles = colorMap[colorScheme];

  return (
    <Box p={4} borderRadius="xl" bg={styles.lightBg}>
      <HStack spacing={3}>
        <Box
          w={{ base: "20px", md: "28px" }}
          h={{ base: "20px", md: "28px" }}
          bg={styles.iconBg}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon
            as={icon}
            color={styles.iconColor}
            boxSize={{ base: 3, md: 4 }}
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="gray.500">
            {label}
          </Text>

          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
            {value}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}
