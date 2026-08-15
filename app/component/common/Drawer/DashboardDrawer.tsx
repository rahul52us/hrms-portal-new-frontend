import React from "react";
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

export interface DashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  titlePrefix?: string;
  titleSuffix?: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  children: React.ReactNode;
  maxW?: any;
}

const DashboardDrawer: React.FC<DashboardDrawerProps> = ({
  isOpen,
  onClose,
  titlePrefix = "",
  titleSuffix = "",
  subtitle = "",
  badgeLabel = "",
  badgeContent,
  footerContent,
  children,
  maxW = { base: "100%", md: "85%" },
}) => {
  return (
    <Drawer size="full" isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg={useColorModeValue("gray.50", "gray.900")} maxW={maxW}>
        <DrawerHeader
          p={0}
          borderBottomWidth="1px"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          bg={useColorModeValue("white", "gray.800")}
        >
          <Flex align="center" justify="space-between" px={8} py={4}>
            <Flex gap={4} align="center">
              <Button
                onClick={onClose}
                variant="ghost"
                borderRadius="full"
                w={10}
                h={10}
                p={0}
                bg={useColorModeValue("gray.50", "gray.700")}
                color={useColorModeValue("gray.600", "gray.300")}
                _hover={{ bg: useColorModeValue("gray.200", "gray.600") }}
              >
                <Icon as={FiArrowRight} boxSize={5} style={{ transform: "rotate(180deg)" }} />
              </Button>
              <Box>
                <Flex align="center" gap={2}>
                  <Text
                    fontSize="2xl"
                    fontWeight="900"
                    color={useColorModeValue("gray.900", "white")}
                    lineHeight="1.2"
                  >
                    {titlePrefix} <Box as="span" color="blue.500">{titleSuffix}</Box>
                  </Text>
                </Flex>
                {subtitle && (
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color={useColorModeValue("gray.500", "gray.400")}
                    letterSpacing="wider"
                    textTransform="uppercase"
                    mt={0.5}
                  >
                    {subtitle}
                  </Text>
                )}
              </Box>
            </Flex>

            {badgeContent ? (
              badgeContent
            ) : badgeLabel ? (
              <Badge
                bg={useColorModeValue("blue.100", "rgba(66,153,225,0.15)")}
                color={useColorModeValue("blue.700", "blue.300")}
                px={4}
                py={1.5}
                borderRadius="full"
                textTransform="uppercase"
                fontSize="xs"
                fontWeight="800"
              >
                {badgeLabel}
              </Badge>
            ) : null}
          </Flex>
        </DrawerHeader>

        <DrawerBody
          bg={useColorModeValue("white", "gray.800")}
          px={8}
          py={8}
          overflowX="hidden"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": { width: "0px", background: "transparent" },
            scrollbarWidth: "none",
          }}
        >
          {children}
        </DrawerBody>

        {footerContent && (
          <DrawerFooter
            py={6}
            px={8}
            borderTop="1px solid"
            borderColor={useColorModeValue("gray.100", "gray.700")}
            bg={useColorModeValue("white", "gray.800")}
          >
            {footerContent}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default DashboardDrawer;
