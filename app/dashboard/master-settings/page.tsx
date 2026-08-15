"use client";

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  Select,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Skeleton
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState, useRef } from "react";
import { FiDatabase, FiPlus, FiCheckCircle, FiTrash2, FiSettings, FiAlertCircle, FiEdit3, FiInbox, FiX, FiChevronDown } from "react-icons/fi";
import { getApiErrorMessage } from "../../config/utils/apiError";
import stores from "../../store/stores";
import { PageBanner } from "../../component/common/PageBanner/PageBanner";
import ConfirmationModal from "../../component/common/ConfirmationModal/ConfirmationModal";

const SectionCard = ({ title, icon, children, color }: any) => {
  const bg = useColorModeValue("white", "gray.800");

  const colorMap: any = {
    blue: { icon: "blue.500", text: "blue.600", bg: "blue.50" },
    green: { icon: "green.500", text: "green.600", bg: "green.50" },
    purple: { icon: "purple.500", text: "purple.600", bg: "purple.50" },
    orange: { icon: "orange.500", text: "orange.600", bg: "orange.50" },
    pink: { icon: "pink.500", text: "pink.600", bg: "pink.50" },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <Box
      p={5}
      borderRadius="2xl"
      bg={bg}
      boxShadow="sm"
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      w="100%"
    >
      <HStack align="center" mb={4} spacing={3}>
        <Box p={2} borderRadius="md" bg={theme.bg}>
          <Icon as={icon} color={theme.icon} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color={theme.text}>
          {title}
        </Text>
      </HStack>
      {children}
    </Box>
  );
};

const MasterSettingsPage = observer(() => {
  const toast = useToast();
  const { auth, companyStore } = stores;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [masterData, setMasterData] = useState<any>({
    documentTypes: [],
    employmentTypes: [],
    coreDomains: [],
    skills: [],
    tdsSections: [],
    domainSkills: []
  });

  const [selectedDomain, setSelectedDomain] = useState<string>("");

  const [newItems, setNewItems] = useState({
    documentTypes: "",
    employmentTypes: "",
    coreDomains: "",
    skills: "",
    tdsSections: ""
  });

  const [itemToDelete, setItemToDelete] = useState<{ category: string, item: string } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const canAccess = ["superadmin", "admin", "hradmin"].includes(auth.user?.role?.toLowerCase());

  useEffect(() => {
    if (canAccess) {
      loadMasterData();
    }
  }, [canAccess]);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const companyId = companyStore.getActiveCompanyId();
      if (!companyId) return;

      const response = await companyStore.getMasterData({ company: companyId });
      if (response?.data?.data) {
        const masterData = response.data.data;
        setMasterData({
          documentTypes: masterData.documentTypes || [],
          employmentTypes: masterData.employmentTypes || [],
          coreDomains: masterData.coreDomains || [],
          skills: masterData.skills || [],
          tdsSections: masterData.tdsSections || [],
          domainSkills: masterData.domainSkills || [],
        });
      }
    } catch (err: any) {
      toast({
        title: "Error loading master data",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryAPI = async (category: string, newItemsArray: string[]) => {
    try {
      const companyId = companyStore.getActiveCompanyId();
      await companyStore.updateMasterCategory({
        company: companyId,
        category,
        items: newItemsArray
      });
      toast({
        title: "Saved",
        description: `${category} updated successfully.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: "Failed to save",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // Rollback could be implemented here by re-fetching
    }
  };

  const handleAddItem = async (category: string) => {
    const val = (newItems as any)[category].trim();
    if (!val) return;

    if (masterData[category].includes(val)) {
      toast({ title: "Item already exists", status: "warning", duration: 2000 });
      return;
    }

    const updatedArray = [...masterData[category], val];

    setMasterData((prev: any) => ({
      ...prev,
      [category]: updatedArray
    }));

    setNewItems((prev: any) => ({ ...prev, [category]: "" }));
    await updateCategoryAPI(category, updatedArray);
  };

  const handleRemoveItem = async (category: string, itemToRemove: string) => {
    const updatedArray = masterData[category].filter((item: string) => item !== itemToRemove);
    setMasterData((prev: any) => ({
      ...prev,
      [category]: updatedArray
    }));
    await updateCategoryAPI(category, updatedArray);

    if (category === "coreDomains") {
      let updatedDomainSkills = [...(masterData.domainSkills || [])];
      const domainIndex = updatedDomainSkills.findIndex(ds => ds.domain === itemToRemove);
      if (domainIndex >= 0) {
        updatedDomainSkills = updatedDomainSkills.filter(ds => ds.domain !== itemToRemove);
        setMasterData((prev: any) => ({ ...prev, domainSkills: updatedDomainSkills }));
        await updateCategoryAPI("domainSkills", updatedDomainSkills);
        
        if (selectedDomain === itemToRemove) {
          setSelectedDomain("");
        }
      }
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      setSaving(true);
      try {
        if (itemToDelete.category === "domainSkills") {
           await handleRemoveDomainSkill(itemToDelete.item);
        } else {
           await handleRemoveItem(itemToDelete.category, itemToDelete.item);
        }
      } finally {
        setSaving(false);
        setItemToDelete(null);
      }
    }
  };

  if (!canAccess) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon />
          You do not have access to master settings.
        </Alert>
      </Box>
    );
  }

  const muted = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (loading) {
    return (
      <Box minH="100vh">
        <VStack align="stretch" spacing={3}>
          <Skeleton height="100px" borderRadius="2xl" />
          <Box>
            <HStack mb={6} spacing={2}>
              <Skeleton height="40px" width="120px" borderRadius="full" />
              <Skeleton height="40px" width="120px" borderRadius="full" />
              <Skeleton height="40px" width="120px" borderRadius="full" />
            </HStack>
            <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
              <VStack align="stretch" spacing={8} mt={4}>
                <HStack w={{ base: "100%", lg: "60%" }} spacing={4}>
                  <Skeleton height="40px" width="full" borderRadius="full" />
                  <Skeleton height="40px" width="120px" borderRadius="full" />
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} height="50px" borderRadius="xl" />
                  ))}
                </SimpleGrid>
              </VStack>
            </Box>
          </Box>
        </VStack>
      </Box>
    );
  }

  const renderTabContent = (category: string, title: string, placeholder: string) => (
    <VStack align="stretch" spacing={8} mt={4}>
      <Flex gap={4} w={{ base: "100%", lg: "60%" }} align="center">
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiEdit3} color="gray.400" />
          </InputLeftElement>
          <Input
            borderRadius="full"
            bg={useColorModeValue("white", "gray.900")}
            boxShadow="sm"
            borderWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            placeholder={placeholder}
            value={(newItems as any)[category]}
            onChange={(e) => setNewItems(prev => ({ ...prev, [category]: e.target.value }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddItem(category);
              }
            }}
          />
        </InputGroup>
        <Button
          size="md"
          borderRadius="full"
          color="white"
          bgGradient="linear(to-r, blue.500, purple.500)"
          leftIcon={<FiPlus />}
          onClick={() => handleAddItem(category)}
          minW="120px"
          px={6}
          _hover={{
            bgGradient: "linear(to-r, blue.600, purple.600)",
            transform: "translateY(-1px)",
            boxShadow: "md",
          }}
          _active={{ transform: "translateY(0)" }}
          transition="all 0.2s"
        >
          Add
        </Button>
      </Flex>

      <Box minH="250px">
        {masterData[category]?.length === 0 ? (
          <Flex direction="column" justify="center" align="center" h="200px" bg={useColorModeValue("gray.50", "gray.900")} borderRadius="2xl" border="2px dashed" borderColor={useColorModeValue("gray.200", "gray.700")}>
            <Icon as={FiInbox} boxSize={10} color="gray.400" mb={3} />
            <Text color="gray.500" fontWeight="medium">No {title.toLowerCase()} configured yet.</Text>
            <Text color="gray.400" fontSize="sm">Type above and click Add to create your first item.</Text>
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {masterData[category].map((item: string, index: number) => (
              <Flex 
                key={index} 
                align="center" 
                justify="space-between"
                bg={useColorModeValue("blue.50", "blue.900")}
                p={3}
                px={5}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={useColorModeValue("blue.100", "blue.700")}
                boxShadow="sm"
                _hover={{ boxShadow: "md", borderColor: "blue.300", transform: "translateY(-1px)", bg: useColorModeValue("blue.100", "blue.800") }}
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold" fontSize="md" color={useColorModeValue("blue.900", "white")}>
                    {item}
                  </Text>
                </HStack>
                <IconButton
                  aria-label="Delete item"
                  icon={<FiTrash2 />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => setItemToDelete({ category, item })}
                  borderRadius="full"
                />
              </Flex>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </VStack>
  );

  const handleAddDomainSkill = async () => {
    const val = (newItems as any).skills?.trim();
    if (!val || !selectedDomain) return;

    let updatedDomainSkills = [...(masterData.domainSkills || [])];
    const domainIndex = updatedDomainSkills.findIndex(ds => ds.domain === selectedDomain);
    
    if (domainIndex >= 0) {
      if (updatedDomainSkills[domainIndex].skills.includes(val)) {
        toast({ title: "Skill already exists for this domain", status: "warning", duration: 2000 });
        return;
      }
      updatedDomainSkills[domainIndex].skills = [...updatedDomainSkills[domainIndex].skills, val];
    } else {
      updatedDomainSkills.push({ domain: selectedDomain, skills: [val] });
    }

    setMasterData((prev: any) => ({ ...prev, domainSkills: updatedDomainSkills }));
    setNewItems((prev: any) => ({ ...prev, skills: "" }));
    await updateCategoryAPI("domainSkills", updatedDomainSkills);
  };

  const handleRemoveDomainSkill = async (itemToRemove: string) => {
    let updatedDomainSkills = [...(masterData.domainSkills || [])];
    const domainIndex = updatedDomainSkills.findIndex(ds => ds.domain === selectedDomain);
    if (domainIndex >= 0) {
      updatedDomainSkills[domainIndex].skills = updatedDomainSkills[domainIndex].skills.filter((s: string) => s !== itemToRemove);
      setMasterData((prev: any) => ({ ...prev, domainSkills: updatedDomainSkills }));
      await updateCategoryAPI("domainSkills", updatedDomainSkills);
    }
  };



  const renderDomainSkillsTab = () => {
    const currentDomainSkills = (masterData.domainSkills || []).find((ds: any) => ds.domain === selectedDomain)?.skills || [];

    return (
      <VStack align="stretch" spacing={6} mt={2}>
        <Box mb={4}>
          <Text fontWeight="bold" fontSize="md" mb={3} color={useColorModeValue("gray.700", "white")}>
            Core Domain Linkage
          </Text>
          <Menu>
            <MenuButton 
              as={Button} 
              rightIcon={<FiChevronDown />} 
              w={{ base: "100%", lg: "40%" }} 
              textAlign="left" 
              bg={useColorModeValue("white", "gray.800")}
              borderWidth="1px"
              borderColor={useColorModeValue("gray.200", "gray.700")}
              borderRadius="xl"
              boxShadow="sm"
              _hover={{ borderColor: "blue.400", boxShadow: "md" }}
              _active={{ bg: useColorModeValue("gray.50", "gray.700") }}
              fontWeight="medium"
              color={selectedDomain ? useColorModeValue("gray.800", "white") : useColorModeValue("gray.400", "gray.500")}
            >
              {selectedDomain || "Select a Core Domain..."}
            </MenuButton>
            <MenuList 
              borderRadius="xl" 
              boxShadow="xl" 
              border="1px solid"
              borderColor={useColorModeValue("gray.100", "gray.700")}
              bg={useColorModeValue("white", "gray.800")}
              p={2}
            >
              {(masterData.coreDomains || []).map((domain: string) => (
                <MenuItem 
                  key={domain} 
                  onClick={() => setSelectedDomain(domain)}
                  borderRadius="md"
                  _hover={{ bgGradient: "linear(to-r, blue.50, purple.50)", color: "blue.700" }}
                  _focus={{ bgGradient: "linear(to-r, blue.50, purple.50)", color: "blue.700" }}
                  fontWeight={selectedDomain === domain ? "bold" : "medium"}
                  color={selectedDomain === domain ? "blue.600" : "inherit"}
                >
                  {domain}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>

        {selectedDomain && (
          <VStack align="stretch" spacing={8} mt={2}>
            <Flex gap={4} w={{ base: "100%", lg: "60%" }} align="center">
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiEdit3} color="gray.400" />
                </InputLeftElement>
                <Input
                  borderRadius="full"
                  bg={useColorModeValue("white", "gray.900")}
                  boxShadow="sm"
                  placeholder="e.g., React JS, Node.js"
                  value={(newItems as any).skills}
                  onChange={(e) => setNewItems(prev => ({ ...prev, skills: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddDomainSkill();
                  }}
                />
              </InputGroup>
              <Button
                size="md"
                borderRadius="full"
                color="white"
                bgGradient="linear(to-r, blue.500, purple.500)"
                leftIcon={<FiPlus />}
                onClick={handleAddDomainSkill}
                minW="120px"
              >
                Add Skill
              </Button>
            </Flex>

            <Box minH="250px">
              {currentDomainSkills.length === 0 ? (
                <Flex direction="column" justify="center" align="center" h="200px" bg={useColorModeValue("gray.50", "gray.900")} borderRadius="2xl" border="2px dashed" borderColor={useColorModeValue("gray.200", "gray.700")}>
                  <Text color="gray.500" fontWeight="medium">No skills added for {selectedDomain} yet.</Text>
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {currentDomainSkills.map((item: string, index: number) => (
                    <Flex 
                      key={index} 
                      align="center" 
                      justify="space-between"
                      bg={useColorModeValue("blue.50", "blue.900")}
                      p={3} px={5} borderRadius="xl" borderWidth="1px"
                    >
                      <HStack spacing={3}>
                        <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />
                        <Text fontWeight="bold" fontSize="md">{item}</Text>
                      </HStack>
                      <IconButton
                        aria-label="Delete item"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => setItemToDelete({ category: "domainSkills", item })}
                        borderRadius="full"
                      />
                    </Flex>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        )}
      </VStack>
    );
  };

  return (
    <Box>
      <VStack align="stretch" spacing={3}>
        <PageBanner
          titlePrefix="MASTER"
          titleHighlight="SETTINGS"
          subtitle="MANAGE DROPDOWN OPTIONS FOR EMPLOYEE PROFILES ACROSS THE COMPANY."
          icon={FiDatabase}
          showBackButton={false}
          colorScheme="blue"
        />

        <Box>
          <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
            <TabList
              gap={2}
              flexWrap="nowrap"
              overflowX="auto"
              w="max-content"
              bg={useColorModeValue("gray.100", "gray.800")}
              p={1}
              borderRadius="full"
              mb={6}
              css={{ "&::-webkit-scrollbar": { display: "none" } }}
            >
              {["Document Types", "Core Domains", "Skills", "Employment Types", "TDS Sections"].map((tabName) => (
                <Tab
                  key={tabName}
                  _selected={{
                    bgGradient: "linear(to-r, blue.500, purple.600)",
                    color: "white",
                    boxShadow: "md",
                  }}
                  borderRadius="full"
                  px={{ base: 4, md: 6 }}
                  fontSize="sm"
                  fontWeight="medium"
                  transition="all 0.2s"
                  color={muted}
                  whiteSpace="nowrap"
                >
                  {tabName}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                  {renderTabContent("documentTypes", "Document Types", "e.g., Aadhar Card, Driving License, 12th Marksheet")}
                </Box>
              </TabPanel>
              <TabPanel px={0}>
                <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                  {renderTabContent("coreDomains", "Core Domains", "e.g., MERN Stack, UI/UX, Sales")}
                </Box>
              </TabPanel>
              <TabPanel px={0}>
                <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                  {renderDomainSkillsTab()}
                </Box>
              </TabPanel>
              <TabPanel px={0}>
                <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                  {renderTabContent("employmentTypes", "Employment Types", "e.g., Full Time, Contractor, Intern")}
                </Box>
              </TabPanel>
              <TabPanel px={0}>
                <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                  {renderTabContent("tdsSections", "TDS Sections", "e.g., 80C, 80D, HRA")}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>

      <ConfirmationModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.item}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={saving}
        tone="danger"
        note={itemToDelete?.category === "coreDomains" 
          ? "Warning: This will also permanently delete all skills mapped to this Core Domain." 
          : "This action cannot be undone."}
      />
    </Box>
  );
});

export default MasterSettingsPage;
