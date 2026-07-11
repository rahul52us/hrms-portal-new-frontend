"use client";

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import AuthenticationLayout from "../../layouts/authenticationLayout/AuthenticationLayout";
import stores from "../../store/stores";

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Setup token is missing or invalid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await stores.auth.setPassword({ token, password });
      setSuccess("Password set successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 900);
    } catch (err: any) {
      setError(err?.message || err?.error || "Unable to set password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthenticationLayout>
      <Box maxW="420px" w="100%">
        <form onSubmit={handleSubmit}>
          <VStack align="stretch" spacing={5}>
            <Box>
              <Heading size="lg">Set Password</Heading>
              <Text color="gray.500" mt={2}>
                Create your password to activate your HRMS account.
              </Text>
            </Box>

            {!token && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                Setup token is missing from this link.
              </Alert>
            )}

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {success && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                {success}
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password1"
                autoComplete="new-password"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Password1"
                autoComplete="new-password"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              size="lg"
              type="submit"
              isLoading={isSubmitting}
              isDisabled={!token}
            >
              Set Password
            </Button>
          </VStack>
        </form>
      </Box>
    </AuthenticationLayout>
  );
}
