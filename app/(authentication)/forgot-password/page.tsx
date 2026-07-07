"use client";

import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import AuthenticationLayout from "../../layouts/authenticationLayout/AuthenticationLayout";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <AuthenticationLayout>
      <Box maxW="420px" w="100%">
        <VStack align="stretch" spacing={5}>
          <Heading size="lg">Password Reset Retired</Heading>
          <Text color="gray.500">
            This LMS now uses phone number and OTP authentication for every role. Password reset is no longer part of the sign-in flow.
          </Text>
          <Button colorScheme="blue" size="lg" onClick={() => router.push("/login")}>
            Go To Login
          </Button>
        </VStack>
      </Box>
    </AuthenticationLayout>
  );
}
