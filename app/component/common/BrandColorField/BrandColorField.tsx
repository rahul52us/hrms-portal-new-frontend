"use client";

import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { DEFAULT_LEARNER_PRIMARY_COLOR, normalizeHexColor } from "../../../theme/theme";

const DEFAULT_COLOR_PRESETS = [
  "#2563EB",
  "#0F766E",
  "#7C3AED",
  "#DC2626",
  "#EA580C",
  "#059669",
  "#DB2777",
  "#1D4ED8",
];

type BrandColorFieldProps = {
  defaultColor?: string;
  error?: string;
  helperText?: string;
  label?: string;
  onChange: (value: string) => void;
  presets?: string[];
  showError?: boolean;
  value?: string;
};

const BrandColorField = ({
  defaultColor = DEFAULT_LEARNER_PRIMARY_COLOR,
  error,
  helperText = "Used for learner-side buttons, badges, highlights, borders, and active states.",
  label = "Primary Theme Color",
  onChange,
  presets = DEFAULT_COLOR_PRESETS,
  showError = false,
  value,
}: BrandColorFieldProps) => {
  const resolvedColor = normalizeHexColor(value, defaultColor);
  const [draftValue, setDraftValue] = useState(resolvedColor);
  const surfaceBg = useColorModeValue("white", "gray.800");
  const subtleBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    setDraftValue(resolvedColor);
  }, [resolvedColor]);

  const commitColor = (nextColor: string) => {
    const normalizedColor = normalizeHexColor(nextColor, defaultColor);
    setDraftValue(normalizedColor);
    onChange(normalizedColor);
  };

  return (
    <FormControl isInvalid={Boolean(error && showError)}>
      <FormLabel mb={2} fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={mutedText}>
        {label}
      </FormLabel>
      <HStack align="stretch" spacing={3} flexWrap="wrap">
        <Box
          minW="120px"
          px={3}
          py={3}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          bg={surfaceBg}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Input
            aria-label={`${label} picker`}
            type="color"
            value={resolvedColor}
            onChange={(event) => commitColor(event.target.value)}
            p={0}
            h="44px"
            w="72px"
            border="none"
            bg="transparent"
            cursor="pointer"
            sx={{
              "::-webkit-color-swatch-wrapper": {
                padding: 0,
              },
              "::-webkit-color-swatch": {
                border: "none",
                borderRadius: "14px",
              },
              "::-moz-color-swatch": {
                border: "none",
                borderRadius: "14px",
              },
            }}
          />
        </Box>

        <Box flex="1" minW={{ base: "100%", md: "220px" }}>
          <Input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value.toUpperCase())}
            onBlur={() => commitColor(draftValue)}
            placeholder={defaultColor}
            h="50px"
            borderRadius="xl"
            bg={surfaceBg}
            borderColor={borderColor}
            fontWeight="600"
            textTransform="uppercase"
            _focusVisible={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
            }}
          />
        </Box>

        <Button
          h="50px"
          borderRadius="xl"
          variant="outline"
          borderColor={borderColor}
          bg={subtleBg}
          onClick={() => commitColor(defaultColor)}
        >
          Use Default Blue
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 4, md: 8 }} spacing={3} mt={4}>
        {presets.map((preset) => {
          const normalizedPreset = normalizeHexColor(preset, defaultColor);
          const isActive = normalizedPreset === resolvedColor;

          return (
            <Button
              key={preset}
              aria-label={`Use ${normalizedPreset} as the theme color`}
              onClick={() => commitColor(normalizedPreset)}
              p={0}
              minW="unset"
              h="44px"
              borderRadius="xl"
              border="2px solid"
              borderColor={isActive ? "blue.500" : borderColor}
              bg={surfaceBg}
              _hover={{ transform: "translateY(-1px)" }}
            >
              <Box h="100%" w="100%" borderRadius="lg" bg={normalizedPreset} />
            </Button>
          );
        })}
      </SimpleGrid>

      <FormHelperText mt={3}>{helperText}</FormHelperText>
      <Text mt={2} fontSize="sm" color={mutedText}>
        Current color: {resolvedColor}
      </Text>
      {showError && error ? (
        <FormErrorMessage mt={2} fontSize="xs" fontWeight="600">
          {error}
        </FormErrorMessage>
      ) : null}
    </FormControl>
  );
};

export default BrandColorField;
