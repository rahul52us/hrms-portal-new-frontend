import { Box, Input, InputGroup, InputLeftElement, Icon } from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxW?: string | object;
  isLearner?: boolean;
};

export default function GlassSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  maxW = "480px",
  isLearner = true,
}: Props) {
  return (
   <Box
  bg={isLearner ? "rgba(255,255,255,0.07)" : "white"}
  backdropFilter={isLearner ? "blur(16px)" : "none"}
  border={isLearner ? "1px solid rgba(255,255,255,0.12)" : "1.5px solid"}
  borderColor={isLearner ? "transparent" : "blue.200"}   // ← visible border
  borderRadius="16px"
  p={1.5}
  maxW={maxW}
  boxShadow={isLearner ? "none" : "0 2px 12px rgba(0,0,0,0.08)"}  // ← subtle shadow
  _focusWithin={{
    border: isLearner ? "1px solid rgba(255,255,255,0.3)" : "1.5px solid",
    borderColor: isLearner ? "transparent" : "blue.400",
    bg: isLearner ? "rgba(255,255,255,0.1)" : "white",
    boxShadow: isLearner ? "none" : "0 2px 16px rgba(66,153,225,0.2)",
  }}
  transition="all 0.2s"
>
  <InputGroup>
    <InputLeftElement pointerEvents="none" pl={2}>
      <Icon
        as={FiSearch}
        color={isLearner ? "rgba(255,255,255,0.5)" : "blue.400"}  // ← blue icon
        boxSize={4}
      />
    </InputLeftElement>

    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      color={isLearner ? "white" : "gray.700"}               // ← dark text
      border="none"
      _placeholder={{ color: isLearner ? "rgba(255,255,255,0.4)" : "gray.400" }}
      _focus={{ boxShadow: "none" }}
      fontSize="sm"
    />
  </InputGroup>
</Box>
  );
}