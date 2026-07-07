"use client";

import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import AuthenticationLayout from "../../layouts/authenticationLayout/AuthenticationLayout";

export default function SetPasswordPage() {
  const router = useRouter();

  return (
    <AuthenticationLayout>
      <Box maxW="420px" w="100%">
        <VStack align="stretch" spacing={5}>
          <Heading size="lg">Password Setup Retired</Heading>
          <Text color="gray.500">
            New accounts are activated with phone number and OTP. Password setup links are no longer used in this authentication flow.
          </Text>
          <Button colorScheme="blue" size="lg" onClick={() => router.push("/login")}>
            Continue To Login
          </Button>
        </VStack>
      </Box>
    </AuthenticationLayout>
  );
}
