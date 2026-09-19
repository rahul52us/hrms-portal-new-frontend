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
  const contentBg = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");
  const headerBorder = useColorModeValue("gray.100", "gray.700");
  const backBg = useColorModeValue("gray.50", "gray.700");
  const backColor = useColorModeValue("gray.600", "gray.300");
  const backHoverBg = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.900", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const badgeBg = useColorModeValue("blue.100", "rgba(66,153,225,0.15)");
  const badgeColor = useColorModeValue("blue.700", "blue.300");
  const bodyBg = useColorModeValue("white", "gray.800");
  const footerBorder = useColorModeValue("gray.100", "gray.700");
  const footerBg = useColorModeValue("white", "gray.800");

  return (
    <Drawer size="full" isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg={contentBg} maxW={maxW}>
        <DrawerHeader
          p={0}
          borderBottomWidth="1px"
          borderColor={headerBorder}
          bg={headerBg}
        >
          <Flex align="center" justify="space-between" px={6} py={3}>
            <Flex gap={3} align="center">
              <Button
                onClick={onClose}
                variant="ghost"
                borderRadius="full"
                w={8}
                h={8}
                p={0}
                bg={backBg}
                color={backColor}
                _hover={{ bg: backHoverBg }}
              >
                <Icon as={FiArrowRight} boxSize={4} style={{ transform: "rotate(180deg)" }} />
              </Button>
              <Box>
                <Flex align="center" gap={2}>
                  <Text
                    fontSize="lg"
                    fontWeight="800"
                    color={headingColor}
                    lineHeight="1.2"
                  >
                    {titlePrefix} <Box as="span" color={useColorModeValue("blue.600", "blue.300")}>{titleSuffix}</Box>
                  </Text>
                </Flex>
                {subtitle && (
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color={subtitleColor}
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
                bg={badgeBg}
                color={badgeColor}
                px={3}
                py={1}
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
          bg={bodyBg}
          px={{ base: 4, md: 8 }}
          py={{ base: 4, md: 5 }}
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
            borderColor={footerBorder}
            bg={footerBg}
          >
            {footerContent}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default DashboardDrawer;
