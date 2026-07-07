'use client'
import React, { useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Flex,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  VStack,
  Text,
  useColorModeValue,
  SimpleGrid,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { SketchPicker } from "react-color";
import { FaPalette } from "react-icons/fa";
import { EditIcon, CheckIcon } from "@chakra-ui/icons";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  useDisclosure,
} from "@chakra-ui/react";

interface ColorPickerProps {
  label: string;
  color: any;
  onChangeComplete: any;
}

const COLOR_SUGGESTIONS = [
  { light: "#3182CE", dark: "#2C5282", label: "Dental Blue" }, // Vibrant blue
  { light: "#38B2AC", dark: "#2C7A7B", label: "Hygienic Teal" }, // Vibrant teal
  { light: "#48BB78", dark: "#2F855A", label: "Fresh Green" }, // Vibrant green
  { light: "#667EEA", dark: "#5A67D8", label: "Indigo Trust" }, // Indigo
  { light: "#ED64A6", dark: "#B83280", label: "Care Pink" },    // Pinkish/Purple
  { light: "#F6AD55", dark: "#DD6B20", label: "Warm Gold" },    // Warmth
  { light: "#FC8181", dark: "#E53E3E", label: "Vital Red" },    // Health
  { light: "#9F7AEA", dark: "#805AD5", label: "Royal Plum" },   // Deep purple
  { light: "#A0AEC0", dark: "#4A5568", label: "Modern Slate" }, // Gray/Steel
  { light: "#4FD1C5", dark: "#319795", label: "Aqua Clean" },   // Cyan-Teal
  { light: "#718096", dark: "#2D3748", label: "Deep Sea" },     // Dark grayish-blue
  { light: "#4299E1", dark: "#3182CE", label: "Trust Blue" },   // Solid blue
];

const ColorBox: React.FC<{ color: string; onClick: () => void; isSelected: boolean }> = ({
  color,
  onClick,
  isSelected,
}) => (
  <Tooltip label={color} placement="top" hasArrow>
    <Box
      width="50px"
      height="50px"
      bg={color}
      borderRadius="md"
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: "scale(1.1)", transition: "0.2s", boxShadow: "lg" }}
      border={isSelected ? "3px solid teal" : "none"}
      boxShadow="md"
      transition="all 0.2s" // Added smooth transition
    />
  </Tooltip>
);

const ColorPickerComponent: React.FC<ColorPickerProps> = ({
  color,
  onChangeComplete,
}) => {
  const handleSuggestionClick = (sug: { light: string; dark: string }) => {
    onChangeComplete(sug);
  };

  const selectedBg = useColorModeValue("blue.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <SimpleGrid columns={3} spacing={3} w="100%">
      {COLOR_SUGGESTIONS.map((sug, index) => {
        const isSelected = color.light === sug.light && color.dark === sug.dark;
        return (
          <VStack
            key={index}
            as="button"
            p={3}
            borderRadius="xl"
            border="2px solid"
            borderColor={isSelected ? "blue.500" : "transparent"}
            bg={isSelected ? selectedBg : useColorModeValue("white", "gray.800")}
            onClick={() => handleSuggestionClick(sug)}
            spacing={2}
            _hover={{
              transform: "translateY(-2px)",
              shadow: "md",
              bg: isSelected ? selectedBg : useColorModeValue("gray.50", "gray.700")
            }}
            transition="all 0.2s"
            align="center"
            position="relative"
            boxShadow="sm"
          >
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg={sug.light}
              border="2px solid"
              borderColor="white"
              boxShadow="0 0 0 1px #CBD5E0"
              position="relative"
              overflow="hidden"
            >
              {/* Dark mode wedge indicator */}
              <Box
                position="absolute"
                bottom={0}
                right={0}
                w="100%"
                h="100%"
                bg={sug.dark}
                clipPath="polygon(100% 0, 100% 100%, 0 100%)"
              />
              {isSelected && (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg="blackAlpha.300"
                  borderRadius="full"
                  zIndex={2}
                >
                  <CheckIcon color="white" boxSize={3} />
                </Flex>
              )}
            </Box>
            <Text
              fontSize="10px"
              fontWeight="bold"
              color={isSelected ? "blue.600" : useColorModeValue("gray.600", "gray.300")}
              textAlign="center"
              lineHeight="1.2"
              noOfLines={1}
            >
              {sug.label}
            </Text>
          </VStack>
        );
      })}
    </SimpleGrid>
  );
};

export default ColorPickerComponent;
