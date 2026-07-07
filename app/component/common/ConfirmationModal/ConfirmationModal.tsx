"use client";

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useMemo, useRef } from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiShield } from "react-icons/fi";

type ConfirmationTone = "danger" | "primary" | "success" | "warning";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  tone?: ConfirmationTone;
  note?: string;
};

const toneMap: Record<
  ConfirmationTone,
  {
    colorScheme: string;
    icon: any;
    iconBgLight: string;
    iconBgDark: string;
    iconColor: string;
    gradient: string;
  }
> = {
  danger: {
    colorScheme: "red",
    icon: FiAlertTriangle,
    iconBgLight: "red.50",
    iconBgDark: "red.900",
    iconColor: "red.500",
    gradient: "linear(to-r, red.500, orange.400)",
  },
  primary: {
    colorScheme: "blue",
    icon: FiShield,
    iconBgLight: "blue.50",
    iconBgDark: "blue.900",
    iconColor: "blue.500",
    gradient: "linear(to-r, blue.500, cyan.400)",
  },
  success: {
    colorScheme: "green",
    icon: FiCheckCircle,
    iconBgLight: "green.50",
    iconBgDark: "green.900",
    iconColor: "green.500",
    gradient: "linear(to-r, green.500, teal.400)",
  },
  warning: {
    colorScheme: "orange",
    icon: FiInfo,
    iconBgLight: "orange.50",
    iconBgDark: "orange.900",
    iconColor: "orange.500",
    gradient: "linear(to-r, orange.500, yellow.400)",
  },
};

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  tone = "primary",
  note = "",
}: ConfirmationModalProps) => {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const surfaceBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const noteBg = useColorModeValue("gray.50", "gray.900");
  const resolvedTone = useMemo(() => toneMap[tone], [tone]);
  const iconBg = useColorModeValue(resolvedTone.iconBgLight, resolvedTone.iconBgDark);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay backdropFilter="blur(8px)" bg="blackAlpha.400" />
      <AlertDialogContent
        bg={surfaceBg}
        borderRadius="3xl"
        overflow="hidden"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="2xl"
      >
        <Box h="4px" bgGradient={resolvedTone.gradient} />

        <AlertDialogHeader px={4} pt={5} pb={0}>
          <HStack align="start" spacing={4}>
            <Flex
              w="52px"
              h="52px"
              borderRadius="2xl"
              align="center"
              justify="center"
              bg={iconBg}
              color={resolvedTone.iconColor}
              flexShrink={0}
            >
              <Icon as={resolvedTone.icon} boxSize={5} />
            </Flex>

            <Box>
              <Text fontSize="xl" fontWeight="800" letterSpacing="tight">
                {title}
              </Text>
              <Text mt={2} color={mutedText} fontSize="sm" lineHeight="1.7">
                {description}
              </Text>
            </Box>
          </HStack>
        </AlertDialogHeader>

        <AlertDialogBody px={4} pt={4} pb={0}>
          {note ? (
            <Box
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              bg={noteBg}
              px={4}
              py={3}
            >
              <Text fontSize="sm" color={mutedText} lineHeight="1.7">
                {note}
              </Text>
            </Box>
          ) : null}
        </AlertDialogBody>

        <AlertDialogFooter px={6} py={6}>
          <Button ref={cancelRef} variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            ml={3}
            colorScheme={resolvedTone.colorScheme}
            onClick={onConfirm}
            isLoading={isLoading}
            borderRadius="full"
            px={6}
          >
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
