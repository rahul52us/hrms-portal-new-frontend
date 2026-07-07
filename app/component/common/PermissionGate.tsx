"use client";

import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type PermissionGateProps = {
  allowed: boolean;
  title?: string;
  description?: string;
  fallbackHref?: string;
  children: ReactNode;
};

const PermissionGate = ({
  allowed,
  title = "Permission required",
  description = "You do not have access to this section.",
  fallbackHref = "/dashboard/profile",
  children,
}: PermissionGateProps) => {
  const router = useRouter();

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <Box
      minH="60vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <Stack
        spacing={4}
        maxW="lg"
        w="full"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="2xl"
        p={8}
        textAlign="center"
        boxShadow="sm"
      >
        <Text fontSize="2xl" fontWeight="bold">
          {title}
        </Text>
        <Text color="gray.600">{description}</Text>
        <Button colorScheme="blue" onClick={() => router.push(fallbackHref)}>
          Go Back
        </Button>
      </Stack>
    </Box>
  );
};

export default PermissionGate;
