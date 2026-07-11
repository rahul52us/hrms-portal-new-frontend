"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiGlobe,
  FiLayers,
  FiMail,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { readFileAsBase64 } from "../../config/utils/utils";
import PermissionGate from "@/app/component/common/PermissionGate";
import { getApiErrorMessage } from "../../config/utils/apiError";
import stores from "../../store/stores";
import CompanyAdminWorkspace from "./component/CompanyAdminWorkspace";
import CompanyForm from "./component/CompanyForm";

const getMonogram = (name?: string) => {
  if (!name?.trim()) return "CO";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const DirectoryPage = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const selectedCompanyId = searchParams.get("company") || "";

  // Modern Color Palette Definitions
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const surfaceBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const headingText = useColorModeValue("gray.800", "white");
  const showToast = useCallback(
    (options: any) =>
      toast({
        position: "top-right",
        isClosable: true,
        ...options,
      }),
    [toast]
  );

  const {
    companyStore: { createCompany, getManagedCompanies, companies },
  } = stores;

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);

  const refreshCompanies = async () => {
    return getManagedCompanies();
  };

  useEffect(() => {
    refreshCompanies().catch((err: any) => {
      showToast({
        title: "Unable to load companies",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    });
  }, [showToast]);

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return companies.data || [];
    }

    return (companies.data || []).filter((company: any) =>
      [
        company.company_name,
        company.companyCode,
        company.companyType,
        company.tenantSlug,
        company.companyEmail,
        company.addressInfo?.[0]?.city,
      ]
        .filter(Boolean)
        .some((value: string) => String(value).toLowerCase().includes(query))
    );
  }, [companies.data, searchQuery]);

  const totals = useMemo(() => {
    const items = companies.data || [];
    return {
      companies: items.length,
      admins: items.reduce((sum: number, item: any) => sum + (item.adminCount || 0), 0),
      activeAdmins: items.reduce((sum: number, item: any) => sum + (item.activeAdminCount || 0), 0),
    };
  }, [companies.data]);

  const selectedCompany = useMemo(
    () => (companies.data || []).find((company: any) => company._id === selectedCompanyId) || null,
    [companies.data, selectedCompanyId]
  );

  const openCompanyWorkspace = (companyId: string) => {
    router.push(`/dashboard/companies?company=${companyId}`);
  };

  const closeCompanyWorkspace = () => {
    router.push("/dashboard/companies");
  };

  const handleCreateCompany = async (values: any) => {
    try {
      setLoading(true);
      const payload: any = {
        ...values,
        tenantSlug: values.tenantSlug || values.company_name,
      };

      const logoFile = values?.logo?.file;
      if (logoFile && !Array.isArray(logoFile)) {
        const buffer = await readFileAsBase64(logoFile);
        payload.logo = {
          buffer,
          filename: logoFile.name,
          type: logoFile.type,
        };
      } else {
        delete payload.logo;
      }

      const response: any = await createCompany(payload);
      const createdCompany = response?.data?.data;

      await refreshCompanies();
      setIsCompanyDrawerOpen(false);
      showToast({
        title: "Company created",
        description: response?.data?.message || `${values.company_name} is ready.`,
        status: "success",
        duration: 4000,
      });

      if (createdCompany?._id) {
        openCompanyWorkspace(createdCompany._id);
      }
    } catch (err: any) {
      showToast({
        title: "Failed to create company",
        description: getApiErrorMessage(err, "Please review the form and try again."),
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedCompanyId && companies.loading && !selectedCompany) {
    return (
      <Flex minH="60vh" justify="center" align="center" bg={pageBg}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  if (selectedCompanyId && selectedCompany) {
    return (
      <CompanyAdminWorkspace
        company={selectedCompany}
        onBack={closeCompanyWorkspace}
        onCompanyRefresh={refreshCompanies}
      />
    );
  }

  return (
    <PermissionGate
      allowed={role === "superadmin"}
      title="Companies module is restricted"
      description="Only Super Admins can access company management."
      fallbackHref="/dashboard"
    >
      <Box minH="100vh" bg={pageBg} p={{ base: 4, md: 8 }} transition="all 0.3s ease">
      <Stack spacing={10} maxW="1400px" mx="auto">
        
        {/* Elegant Header Section */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Text 
              fontSize={{ base: "3xl", md: "4xl" }} 
              fontWeight="800" 
              letterSpacing="tight"
              bgGradient="linear(to-r, blue.500, teal.500)"
              bgClip="text"
              color={headingText}
            >
              Companies
            </Text>
            <Text color={mutedText} fontSize="sm" mt={1}>
              Create tenant companies, manage company admins, and control company access
            </Text>
          </Box>
          <Button
            size="lg"
            colorScheme="blue"
            bgGradient="linear(to-r, blue.500, teal.500)"
            _hover={{ 
              bgGradient: "linear(to-r, blue.600, teal.600)",
              transform: "translateY(-2px)",
              shadow: "xl"
            }}
            _active={{ transform: "translateY(0)" }}
            borderRadius="full"
            leftIcon={<FiPlus />}
            onClick={() => setIsCompanyDrawerOpen(true)}
            transition="all 0.2s"
            shadow="md"
          >
            New Company
          </Button>
        </Flex>

        {/* Modern Glassmorphic Stat Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box
            bg={surfaceBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={useColorModeValue("whiteAlpha.500", "whiteAlpha.100")}
            borderRadius="3xl"
            p={6}
            shadow="lg"
            position="relative"
            overflow="hidden"
            _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <Box position="absolute" top="-20px" right="-20px" w="80px" h="80px" bg="blue.400" opacity="0.1" borderRadius="full" />
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="600" color={mutedText} textTransform="uppercase" letterSpacing="wider">
                  Companies
                </Text>
                <Text mt={2} fontSize="4xl" fontWeight="900" bgGradient="linear(to-r, blue.400, teal.400)" bgClip="text">
                  {totals.companies}
                </Text>
              </Box>
              <Flex bg="blue.50" color="blue.500" p={3} borderRadius="2xl" shadow="sm">
                <Icon as={FiBriefcase} boxSize={6} />
              </Flex>
            </HStack>
          </Box>

          <Box
            bg={surfaceBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={useColorModeValue("whiteAlpha.500", "whiteAlpha.100")}
            borderRadius="3xl"
            p={6}
            shadow="lg"
            position="relative"
            overflow="hidden"
            _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <Box position="absolute" top="-20px" right="-20px" w="80px" h="80px" bg="purple.400" opacity="0.1" borderRadius="full" />
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="600" color={mutedText} textTransform="uppercase" letterSpacing="wider">
                  Company Admins
                </Text>
                <Text mt={2} fontSize="4xl" fontWeight="900" bgGradient="linear(to-r, purple.400, pink.400)" bgClip="text">
                  {totals.admins}
                </Text>
              </Box>
              <Flex bg="purple.50" color="purple.500" p={3} borderRadius="2xl" shadow="sm">
                <Icon as={FiUsers} boxSize={6} />
              </Flex>
            </HStack>
          </Box>

          <Box
            bg={surfaceBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={useColorModeValue("whiteAlpha.500", "whiteAlpha.100")}
            borderRadius="3xl"
            p={6}
            shadow="lg"
            position="relative"
            overflow="hidden"
            _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <Box position="absolute" top="-20px" right="-20px" w="80px" h="80px" bg="teal.400" opacity="0.1" borderRadius="full" />
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="600" color={mutedText} textTransform="uppercase" letterSpacing="wider">
                  Active Admins
                </Text>
                <Text mt={2} fontSize="4xl" fontWeight="900" bgGradient="linear(to-r, teal.400, emerald.400)" bgClip="text">
                  {totals.activeAdmins}
                </Text>
              </Box>
              <Flex bg="teal.50" color="teal.500" p={3} borderRadius="2xl" shadow="sm">
                <Icon as={FiShield} boxSize={6} />
              </Flex>
            </HStack>
          </Box>
        </SimpleGrid>

        {/* Directory Section */}
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={4} wrap="wrap">
            <InputGroup maxW={{ base: "100%", md: "400px" }} size="lg">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, location..."
                borderRadius="full"
                bg={surfaceBg}
                border="1px solid"
                borderColor={borderColor}
                _hover={{ borderColor: "blue.400", shadow: "sm" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59,130,246,0.2)" }}
                transition="all 0.2s"
              />
            </InputGroup>
            <Text fontSize="sm" color={mutedText} fontWeight="500">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"} found
            </Text>
          </Flex>

          {companies.loading ? (
            <Flex py={20} justify="center" align="center" direction="column" gap={4}>
              <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
              <Text color={mutedText} fontWeight="500">Loading directory...</Text>
            </Flex>
          ) : filteredCompanies.length ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={8}>
              {filteredCompanies.map((company: any) => {
                const locationStr = company.addressInfo?.[0]
                  ? [company.addressInfo[0].city, company.addressInfo[0].country]
                      .filter(Boolean)
                      .join(", ")
                  : "Location not set";

                return (
                  <Box
                    key={company._id}
                    role="group"
                    bg={surfaceBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="2xl"
                    overflow="hidden"
                    shadow="md"
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      borderColor: "blue.300",
                      boxShadow: "2xl",
                      transform: "translateY(-6px)",
                    }}
                    cursor="pointer"
                    onClick={() => openCompanyWorkspace(company._id)}
                    position="relative"
                  >
                    {/* Subtle gradient overlay on hover */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="4px"
                      bgGradient="linear(to-r, blue.400, teal.400)"
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      transition="opacity 0.2s"
                    />
                    
                    <Box p={6}>
                      <HStack align="start" justify="space-between" mb={4}>
                        <HStack align="center" spacing={4}>
                          <Avatar
                            size="md"
                            name={company.company_name}
                            src={company?.logo?.url}
                            bgGradient="linear(to-br, blue.500, teal.500)"
                            color="white"
                            fontWeight="bold"
                            borderRadius="xl"
                            shadow="sm"
                          />
                          <Box>
                            <Tooltip label={company.company_name} placement="top" hasArrow>
                              <Text fontSize="lg" fontWeight="800" color={headingText} noOfLines={1}>
                                {company.company_name}
                              </Text>
                            </Tooltip>
                            <HStack spacing={2} mt={1}>
                              <Badge
                                colorScheme={company.companyType === "school" ? "purple" : "blue"}
                                variant="solid"
                                borderRadius="full"
                                px={2}
                                textTransform="capitalize"
                                fontSize="xs"
                              >
                                {company.companyType || "Standard"}
                              </Badge>
                              <Text fontSize="xs" color={mutedText} fontWeight="600">
                                #{company.companyCode || "--"}
                              </Text>
                            </HStack>
                          </Box>
                        </HStack>

                        <Tooltip label={company.is_active ? "Active" : "Inactive"} placement="top" hasArrow>
                          <Box
                            w={2.5}
                            h={2.5}
                            borderRadius="full"
                            bg={company.is_active ? "green.400" : "red.400"}
                            boxShadow={company.is_active ? "0 0 8px rgba(72, 187, 120, 0.6)" : "none"}
                            animation={company.is_active ? "pulse 2s infinite" : "none"}
                          />
                        </Tooltip>
                      </HStack>

                      <Divider my={4} borderColor={borderColor} />

                      <VStack spacing={3} align="start" mb={6} flex="1">
                        <HStack spacing={3} color={mutedText} w="full">
                          <Icon as={FiMapPin} color="gray.400" boxSize="14px" />
                          <Text fontSize="sm" fontWeight="500" noOfLines={1} textTransform="capitalize">
                            {locationStr}
                          </Text>
                        </HStack>

                        <HStack spacing={3} color={mutedText} w="full">
                          <Icon as={FiGlobe} color="gray.400" boxSize="14px" />
                          <Text fontSize="sm" fontWeight="500" noOfLines={1}>
                            {company.tenantUrl || company.customDomain || company.tenantSlug || "No domain set"}
                          </Text>
                        </HStack>

                        <HStack spacing={3} color={mutedText} w="full">
                          <Icon as={FiMail} color="gray.400" boxSize="14px" />
                          <Text fontSize="sm" fontWeight="500" noOfLines={1}>
                            {company.companyEmail || company.mobileNo || "No contact info"}
                          </Text>
                        </HStack>
                        
                        {company.departments && company.departments.length > 0 && (
                          <HStack spacing={3} color={mutedText} w="full">
                            <Icon as={FiLayers} color="gray.400" boxSize="14px" />
                            <Text fontSize="sm" fontWeight="500" noOfLines={1}>
                              {company.departments.length} Department{company.departments.length > 1 ? 's' : ''}
                            </Text>
                          </HStack>
                        )}
                      </VStack>

                      <Button
                        variant="ghost"
                        rightIcon={<FiArrowRight />}
                        size="sm"
                        colorScheme="blue"
                        borderRadius="full"
                        w="full"
                        justifyContent="space-between"
                        px={4}
                        _groupHover={{ bg: "blue.50", color: "blue.600" }}
                      >
                        Manage Company
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              bg={surfaceBg}
              border="2px dashed"
              borderColor={borderColor}
              borderRadius="3xl"
              p={12}
              textAlign="center"
              minH="400px"
            >
              <Flex
                w="80px"
                h="80px"
                bg="blue.50"
                color="blue.500"
                borderRadius="full"
                align="center"
                justify="center"
                mb={6}
              >
                <Icon as={FiSearch} boxSize={10} />
              </Flex>
              <Text fontWeight="800" fontSize="2xl" color={headingText}>
                No companies found
              </Text>
              <Text mt={3} color={mutedText} maxW="md">
                No companies match the current search. Adjust the search or create a new company.
              </Text>
              <Button
                mt={8}
                colorScheme="blue"
                variant="outline"
                borderRadius="full"
                onClick={() => setSearchQuery("")}
                leftIcon={<FiSearch />}
              >
                Clear Search
              </Button>
            </Flex>
          )}
        </VStack>
      </Stack>

      <Drawer
        size="xl"
        isOpen={isCompanyDrawerOpen}
        placement="right"
        onClose={() => setIsCompanyDrawerOpen(false)}
      >
        <DrawerOverlay backdropFilter="blur(8px)" bg="blackAlpha.300" />
        <DrawerContent borderLeftRadius={{ base: "none", md: "3xl" }} shadow="2xl">
          <DrawerCloseButton top={4} right={4} size="lg" />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} py={6} px={8}>
            <Text fontSize="2xl" fontWeight="800" bgGradient="linear(to-r, blue.500, teal.500)" bgClip="text">
              Create Company
            </Text>
            <Text fontSize="sm" color={mutedText} mt={1}>
              Add the company profile, tenant slug, and primary contact details.
            </Text>
          </DrawerHeader>
          <DrawerBody pb={8} pt={6} px={8}>
            <CompanyForm
              onSubmit={handleCreateCompany}
              onClose={() => setIsCompanyDrawerOpen(false)}
              isLoading={loading}
              simpleCreate
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Add subtle animation keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
    </PermissionGate>
  );
});

export default DirectoryPage;
