"use client";

import {
  Avatar,
  Box,
  Divider,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useColorModeValue,
  useTheme,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBriefcase,
  FiCheck,
  FiChevronDown,
  FiSearch,
  FiStar,
  FiX,
} from "react-icons/fi";
import stores from "../../../../../store/stores";

/* ─── Scrollbar global styles (injected once) ─── */
if (typeof document !== "undefined") {
  const styleId = "__company-selector-scrollbar__";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.innerHTML = `
      .company-list-scroll::-webkit-scrollbar { width: 4px; }
      .company-list-scroll::-webkit-scrollbar-track { background: transparent; }
      .company-list-scroll::-webkit-scrollbar-thumb {
        border-radius: 99px;
        background: var(--chakra-colors-gray-600, #4A5568);
      }
      .company-list-scroll::-webkit-scrollbar-thumb:hover {
        background: var(--chakra-colors-purple-500, #805AD5);
      }
    `;
    document.head.appendChild(s);
  }
}

/* ─── Company avatar with optional online dot ─── */
const CompanyAvatar = ({
  company,
  size = 34,
  showOnlineDot = false,
}: {
  company: any;
  size?: number;
  showOnlineDot?: boolean;
}) => {
  const dotBorder = useColorModeValue("white", "gray.800");
  const theme = useTheme();
  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;
  const accentScale = (theme.colors?.purple || {}) as Record<number, string>;
  return (
    <Box position="relative" flexShrink={0}>
      {company?.logo?.url ? (
        <Image
          src={company.logo.url}
          alt={company.company_name}
          boxSize={`${size}px`}
          borderRadius="9px"
          objectFit="cover"
          fallbackSrc="https://via.placeholder.com/40?text=Co"
        />
      ) : (
        <Avatar
          name={company?.company_name}
          bgGradient={`linear(135deg, ${accentScale[500] || brandScale[600] || "#805AD5"}, ${brandScale[300] || brandScale[500] || "#9F7AEA"})`}
          color="white"
          fontWeight="700"
          borderRadius="9px"
          icon={<FiBriefcase size={14} />}
          sx={{ width: `${size}px`, height: `${size}px`, fontSize: "12px" }}
        />
      )}
      {showOnlineDot && (
        <Box
          position="absolute"
          bottom="1px"
          right="1px"
          w="8px"
          h="8px"
          bg="green.400"
          borderRadius="full"
          border="1.5px solid"
          borderColor={dotBorder}
        />
      )}
    </Box>
  );
};

/* ─── Tiny colored chip/badge ─── */
const Chip = ({
  icon,
  label,
  colorScheme,
}: {
  icon?: React.ReactNode;
  label: string;
  colorScheme: "green" | "yellow" | "purple";
}) => {
  const styles = {
    green: { bg: "green.900", color: "green.300" },
    yellow: { bg: "yellow.900", color: "yellow.300" },
    purple: { bg: "purple.900", color: "purple.300" },
  };
  const { bg, color } = styles[colorScheme];
  return (
    <HStack spacing="4px" px={2} py="2px" borderRadius="5px" bg={bg} display="inline-flex">
      {icon}
      <Text fontSize="10px" fontWeight="700" color={color} letterSpacing="0.3px">
        {label}
      </Text>
    </HStack>
  );
};

/* ─── Company row inside the dropdown list ─── */
const CompanyRow = ({
  company,
  isSelected,
  onSelect,
}: {
  company: any;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const hoverBg       = useColorModeValue("gray.100", "whiteAlpha.50");
  const selectedBg    = useColorModeValue("purple.50", "rgba(124,111,255,0.1)");
  const nameColor     = useColorModeValue("gray.800", "white");
  const selectedName  = useColorModeValue("purple.600", "purple.300");
  const emailColor    = useColorModeValue("gray.500", "gray.400");
  const checkBg       = useColorModeValue("purple.100", "rgba(124,111,255,0.2)");
  const checkColor    = useColorModeValue("purple.600", "purple.300");

  return (
    <HStack
      as="button"
      w="full"
      spacing={3}
      px={3}
      py="9px"
      borderRadius="10px"
      bg={isSelected ? selectedBg : "transparent"}
      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
      onClick={onSelect}
      transition="background 0.12s"
      align="flex-start"
      cursor="pointer"
    >
      <CompanyAvatar company={company} size={36} />

      <VStack spacing={0} align="start" flex={1} minW={0}>
        <Text
          fontSize="13px"
          fontWeight="600"
          color={isSelected ? selectedName : nameColor}
          noOfLines={1}
        >
          {company.company_name}
        </Text>
        {company.companyEmail && (
          <Text fontSize="11px" color={emailColor} noOfLines={1} mt="1px">
            {company.companyEmail}
          </Text>
        )}
        {(isSelected || company.isPremium) && (
          <HStack spacing={1} mt="3px">
            {isSelected && (
              <Chip
                icon={<Box w="5px" h="5px" bg="green.400" borderRadius="full" />}
                label="Active"
                colorScheme="green"
              />
            )}
            {company.isPremium && (
              <Chip icon={<FiStar size={9} />} label="Premium" colorScheme="yellow" />
            )}
          </HStack>
        )}
      </VStack>

      {isSelected && (
        <Box
          w="20px"
          h="20px"
          bg={checkBg}
          borderRadius="6px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon as={FiCheck} boxSize="11px" color={checkColor} />
        </Box>
      )}
    </HStack>
  );
};

/* ─── Main component ─── */
const HeaderCompanySelector = observer(() => {
  const { auth, companyStore } = stores;
  const theme = useTheme();
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;

  const companies        = companyStore.companies.data || [];
  const selectedCompanyId = companyStore.getActiveCompanyId();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen]           = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── colour tokens ── */
  const triggerBg           = useColorModeValue("gray.100", "whiteAlpha.50");
  const triggerHoverBg      = useColorModeValue("gray.200", "whiteAlpha.100");
  const triggerActiveBorder = useColorModeValue(brandScale[400] || "blue.400", brandScale[500] || "blue.500");
  const triggerActiveShadow = useColorModeValue(
    `0 0 0 3px ${(brandScale[500] || "#2563EB")}26`,
    `0 0 0 3px ${(brandScale[500] || "#2563EB")}33`
  );
  const popoverBg      = useColorModeValue("white", "#1a1a1f");
  const popoverBorder  = useColorModeValue("gray.200", "whiteAlpha.100");
  const labelColor     = useColorModeValue("gray.500", "gray.400");
  const nameColor      = useColorModeValue("gray.800", "white");
  const searchBg       = useColorModeValue("gray.50", "whiteAlpha.50");
  const footerBg       = useColorModeValue("gray.50", "whiteAlpha.30");
  const sectionLabel   = useColorModeValue("gray.400", "gray.500");
  const mutedColor     = useColorModeValue("gray.500", "gray.500");
  const countBg        = useColorModeValue("gray.200", "whiteAlpha.100");
  const closeBg        = useColorModeValue("gray.100", "whiteAlpha.100");
  const closeHoverBg   = useColorModeValue("gray.200", "whiteAlpha.200");
  const emptyIconBg    = useColorModeValue("gray.100", "whiteAlpha.50");
  const staticBorder   = useColorModeValue("gray.200", "whiteAlpha.100");

  /* selected company */
  const selectedCompany = useMemo(
    () => companies.find((c: any) => c._id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  /* filtered + active-first sorted list */
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = q
      ? companies.filter(
          (c: any) =>
            c.company_name.toLowerCase().includes(q) ||
            c.companyEmail?.toLowerCase().includes(q)
        )
      : companies;
    return [...base].sort((a: any, b: any) =>
      a._id === selectedCompanyId ? -1 : b._id === selectedCompanyId ? 1 : 0
    );
  }, [companies, searchQuery, selectedCompanyId]);

  /* initialize */
  useEffect(() => {
    if (isSuperadmin) {
      if (!companyStore.companies.data?.length) {
        companyStore.getManagedCompanies().catch(() => undefined);
      } else {
        companyStore.initializeCompanyContext();
      }
      return;
    }
    companyStore.initializeCompanyContext();
  }, [companyStore, isSuperadmin]);

  const handleSelect = (id: string) => {
    companyStore.setSelectedCompanyId(id);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => searchRef.current?.focus(), 80);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  if (!isSuperadmin && !selectedCompany) return null;

  /* ── Shared trigger button markup ── */
  const TriggerButton = (
    <HStack
      as="button"
      spacing={3}
      px={2}
      py="7px"
      pr={3}
      borderRadius="12px"
      bg={triggerBg}
      border="0.5px solid"
      borderColor={isOpen ? triggerActiveBorder : staticBorder}
      _hover={{ bg: triggerHoverBg }}
      boxShadow={isOpen ? triggerActiveShadow : "none"}
      transition="all 0.15s"
      cursor="pointer"
      minW="220px"
      w="220px"
      aria-label="Select company"
    >
      <CompanyAvatar company={selectedCompany} size={34} showOnlineDot />
      <VStack spacing={0} align="start" flex={1} minW={0}>
        <Text
          fontSize="10px"
          fontWeight="600"
          color={labelColor}
          textTransform="uppercase"
          letterSpacing="0.7px"
        >
          Active Company
        </Text>
        <Text fontSize="13px" fontWeight="600" color={nameColor} noOfLines={1}>
          {selectedCompany?.company_name || "Select Company"}
        </Text>
      </VStack>
      <Icon
        as={FiChevronDown}
        boxSize="15px"
        color={labelColor}
        transform={isOpen ? "rotate(180deg)" : "none"}
        transition="transform 0.2s"
        flexShrink={0}
      />
    </HStack>
  );

  return (
    <HStack spacing={0} mx={{ xl: 2, "2xl": 4 }} display={{ base: "none", xl: "flex" }}>
      {isSuperadmin ? (
        <Popover
          placement="bottom-start"
          isLazy
          closeOnBlur
          isOpen={isOpen}
          onOpen={handleOpen}
          onClose={handleClose}
        >
          <PopoverTrigger>{TriggerButton}</PopoverTrigger>

          <PopoverContent
            w="320px"
            bg={popoverBg}
            borderColor={popoverBorder}
            borderWidth="0.5px"
            borderRadius="16px"
            boxShadow="0 24px 60px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.06)"
            overflow="hidden"
            _focusVisible={{ outline: "none" }}
          >
            <PopoverBody p={0}>
              <VStack spacing={0} align="stretch">

                {/* ── Popover header: title + search ── */}
                <Box
                  px={4}
                  pt="14px"
                  pb="12px"
                  borderBottomWidth="0.5px"
                  borderColor={popoverBorder}
                >
                  <HStack justify="space-between" mb={3}>
                    <Text
                      fontSize="11px"
                      fontWeight="700"
                      color={sectionLabel}
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      Switch Company
                    </Text>
                    <Box
                      as="button"
                      w="22px"
                      h="22px"
                      bg={closeBg}
                      border="0.5px solid"
                      borderColor={popoverBorder}
                      borderRadius="6px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={handleClose}
                      _hover={{ bg: closeHoverBg, color: nameColor }}
                      color={mutedColor}
                    >
                      <Icon as={FiX} boxSize="12px" />
                    </Box>
                  </HStack>

                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none" pl={3}>
                      <Icon as={FiSearch} color={mutedColor} boxSize="14px" />
                    </InputLeftElement>
                    <Input
                      ref={searchRef}
                      pl="36px"
                      pr="50px"
                      placeholder="Search by name or email…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderRadius="10px"
                      bg={searchBg}
                      borderColor={popoverBorder}
                      fontSize="13px"
                      color={nameColor}
                      _placeholder={{ color: mutedColor }}
                      _focus={{
                        borderColor: triggerActiveBorder,
                        boxShadow: triggerActiveShadow,
                        bg: popoverBg,
                      }}
                    />
                    {/* result count pill */}
                    <Box
                      position="absolute"
                      right={3}
                      top="50%"
                      transform="translateY(-50%)"
                      zIndex={1}
                    >
                      <Text
                        fontSize="11px"
                        fontWeight="700"
                        color={mutedColor}
                        bg={countBg}
                        px="6px"
                        py="2px"
                        borderRadius="5px"
                      >
                        {filteredCompanies.length}
                      </Text>
                    </Box>
                  </InputGroup>
                </Box>

                {/* ── Scrollable company list ── */}
                <Box
                  maxH="280px"
                  overflowY="auto"
                  className="company-list-scroll"
                  px={2}
                  py={2}
                >
                  {filteredCompanies.length > 0 ? (
                    <VStack spacing={0} align="stretch">
                      {filteredCompanies.map((company: any, idx: number) => {
                        const showAllHeader =
                          idx > 0 &&
                          filteredCompanies[idx - 1]._id === selectedCompanyId &&
                          filteredCompanies.length > 1;

                        return (
                          <Box key={company._id}>
                            {idx === 0 && company._id === selectedCompanyId && (
                              <Text
                                fontSize="10px"
                                fontWeight="700"
                                textTransform="uppercase"
                                letterSpacing="0.7px"
                                color={sectionLabel}
                                px={3}
                                pb="4px"
                              >
                                Active
                              </Text>
                            )}
                            {showAllHeader && (
                              <Text
                                fontSize="10px"
                                fontWeight="700"
                                textTransform="uppercase"
                                letterSpacing="0.7px"
                                color={sectionLabel}
                                px={3}
                                pt={2}
                                pb="4px"
                              >
                                All Companies
                              </Text>
                            )}
                            <CompanyRow
                              company={company}
                              isSelected={company._id === selectedCompanyId}
                              onSelect={() => handleSelect(company._id)}
                            />
                          </Box>
                        );
                      })}
                    </VStack>
                  ) : (
                    <VStack py={8} spacing={2}>
                      <Box
                        w="40px"
                        h="40px"
                        bg={emptyIconBg}
                        borderRadius="12px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiBriefcase} boxSize={5} color={mutedColor} />
                      </Box>
                      <Text fontSize="13px" color={mutedColor}>
                        No companies found
                      </Text>
                    </VStack>
                  )}
                </Box>

                {/* ── Footer ── */}
                <Divider borderColor={popoverBorder} />
                <HStack px={4} py="10px" bg={footerBg} justify="space-between">
                  <HStack spacing={2}>
                    <Box w="6px" h="6px" bg="green.400" borderRadius="full" />
                    <Text fontSize="11px" color={mutedColor} fontWeight="500">
                      Total:{" "}
                      <Text as="span" fontWeight="700" color={nameColor}>
                        {companies.length}
                      </Text>{" "}
                      {companies.length === 1 ? "company" : "companies"}
                    </Text>
                  </HStack>
                  <Text fontSize="10px" color={mutedColor}>
                    Synced just now
                  </Text>
                </HStack>

              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      ) : (
        /* ── Non-superadmin: static display ── */
        <HStack
          spacing={3}
          px={2}
          py="7px"
          pr={3}
          borderRadius="12px"
          bg={triggerBg}
          border="0.5px solid"
          borderColor={staticBorder}
          minW="220px"
        >
          <CompanyAvatar company={selectedCompany} size={34} />
          <VStack spacing={0} align="start" flex={1} minW={0}>
            <Text
              fontSize="10px"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="0.7px"
            >
              Current Company
            </Text>
            <Text fontSize="13px" fontWeight="600" color={nameColor} noOfLines={1}>
              {selectedCompany?.company_name || "Current Company"}
            </Text>
          </VStack>
        </HStack>
      )}
    </HStack>
  );
});

export default HeaderCompanySelector;
