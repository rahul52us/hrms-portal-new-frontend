"use client";

import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import AuthenticationLayout from "../../layouts/authenticationLayout/AuthenticationLayout";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <AuthenticationLayout>
      <Box maxW="420px" w="100%">
        <VStack align="stretch" spacing={5}>
          <Heading size="lg">Password Reset Retired</Heading>
          <Text color="gray.500">
            Password-based sign-in has been removed. Please return to login and continue with your phone number and OTP.
          </Text>
          <Button colorScheme="blue" size="lg" onClick={() => router.push("/login")}>
            Back To Login
          </Button>
        </VStack>
      </Box>
    </AuthenticationLayout>
  );
}
