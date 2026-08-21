import {
  Box,
  Button,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useToast,
  useBreakpointValue,
  VStack,
  Spinner,
  Center,
  Skeleton,
  HStack,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { FiUser, FiUsers, FiStar, FiShield, FiFolder } from "react-icons/fi";
import { readFileAsBase64 } from "../../../config/utils/utils";
import DashboardDrawer from "../../../component/common/Drawer/DashboardDrawer";
import PersonalDetailsForm from "./ProfileTabs/PersonalDetailsForm";
import FamilyContactsForm from "./ProfileTabs/FamilyContactsForm";
import SkillsMappingForm from "./ProfileTabs/SkillsMappingForm";
import StatutoryDetailsForm from "./ProfileTabs/StatutoryDetailsForm";
import DocumentsForm from "./ProfileTabs/DocumentsForm";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import stores from "../../../store/stores";
import { getApiErrorMessage } from "../../../config/utils/apiError";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: any;
};

const ProfileDetailsDrawer = observer(({ isOpen, onClose, user }: Props) => {
  const { userStore } = stores;
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  
  const bg = useColorModeValue("white", "gray.900");
  const muted = useColorModeValue("gray.600", "gray.400");
  const tabActiveBg = useColorModeValue("blue.500", "purple.600");

  useEffect(() => {
    if (isOpen && user?._id) {
      loadProfileDetails();
    } else {
      setProfileData({});
    }
  }, [isOpen, user]);

  const loadProfileDetails = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await userStore.getManagedUserProfileDetails(user._id);
      setProfileData(res?.data || {});
    } catch (error: any) {
      toast({
        title: "Failed to load profile",
        description: getApiErrorMessage(error),
        status: "error",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSavePersonalDetails = async (payload: any) => {
    if (!user?._id) return;
    setSaving(true);
    try {
      const finalPayload = { ...payload };
      if (payload.pic?.isDeleted) {
        finalPayload.pic = { isDeleted: 1, isAdd: 0 };
      }
      if (payload.pic?.file instanceof File) {
        const buffer = await readFileAsBase64(payload.pic.file);
        finalPayload.pic = {
          buffer,
          filename: payload.pic.file.name,
          type: payload.pic.file.type,
          isAdd: 1,
          isDeleted: payload.pic?.isDeleted || 0,
        };
      } else if (!payload.pic?.isDeleted) {
        delete finalPayload.pic; // Don't send empty pic object if nothing changed
      }

      await userStore.updatePersonalDetails(user._id, finalPayload);
      
      // Update the local user object so the UI reflects the core field changes immediately
      Object.assign(user, {
        address: finalPayload.address ?? user.address,
        city: finalPayload.city ?? user.city,
        state: finalPayload.state ?? user.state,
        country: finalPayload.country ?? user.country,
        postalCode: finalPayload.postalCode ?? user.postalCode,
        employeeNumber: finalPayload.employeeNumber ?? user.employeeNumber,
        designation: finalPayload.designation ?? user.designation,
      });

      toast({ title: "Personal details updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFamilyContacts = async (payload: any) => {
    if (!user?._id) return;
    setSaving(true);
    try {
      await userStore.updateFamilyContacts(user._id, payload);
      toast({ title: "Family contacts updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async (payload: any) => {
    if (!user?._id) return;
    setSaving(true);
    try {
      await userStore.updateSkills(user._id, payload);
      toast({ title: "Skills updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatutory = async (payload: any) => {
    if (!user?._id) return;
    setSaving(true);
    try {
      await userStore.updateStatutoryDetails(user._id, payload);
      toast({ title: "Statutory details updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocuments = async () => {
    // Documents upload directly in the form component using user._id
    // This function can just trigger a reload if needed
    loadProfileDetails(false);
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxW={{ base: "100%", md: "80%" }}
      titlePrefix="Extended Profile"
      titleSuffix={isMobile ? "" : (user?.name ? `- ${user.name}` : "")}
      badgeLabel={user?.role?.toUpperCase() || "EMPLOYEE"}
    >
      <Box h="100%" display="flex" flexDirection="column">
        {loading ? (
          <VStack spacing={6} align="stretch" p={2} pt={4}>
            {/* Tabs Skeleton */}
            <HStack spacing={8} borderBottom="1px solid" borderColor={useColorModeValue("gray.200", "gray.700")} pb={2}>
              <Skeleton height="20px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
              <Skeleton height="20px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
              <Skeleton height="20px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
              <Skeleton height="20px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
            </HStack>

            {/* Header Skeleton */}
            <HStack spacing={4} mt={6}>
              <Skeleton boxSize="40px" borderRadius="lg" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
              <VStack align="start" spacing={2}>
                <Skeleton height="20px" width="200px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                <Skeleton height="12px" width="300px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
              </VStack>
            </HStack>

            {/* Form Card Skeleton */}
            <Box 
              p={{ base: 5, md: 8 }} 
              borderWidth="1px" 
              borderColor={useColorModeValue("gray.200", "whiteAlpha.100")} 
              borderRadius="3xl" 
              bg={useColorModeValue("white", "whiteAlpha.50")} 
              mt={4}
            >
              <VStack spacing={8} align="stretch">
                <Skeleton height="16px" width="120px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <VStack align="start" spacing={2}>
                    <Skeleton height="12px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                    <Skeleton height="45px" width="100%" borderRadius="xl" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Skeleton height="12px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                    <Skeleton height="45px" width="100%" borderRadius="xl" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Skeleton height="12px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                    <Skeleton height="45px" width="100%" borderRadius="xl" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                  </VStack>
                </SimpleGrid>

                <Divider borderColor={useColorModeValue("gray.200", "whiteAlpha.100")} />

                <Skeleton height="16px" width="120px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="start" spacing={2}>
                    <Skeleton height="12px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                    <Skeleton height="45px" width="100%" borderRadius="xl" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Skeleton height="12px" width="80px" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                    <Skeleton height="45px" width="100%" borderRadius="xl" startColor={useColorModeValue("gray.100", "whiteAlpha.100")} endColor={useColorModeValue("gray.300", "whiteAlpha.300")} />
                  </VStack>
                </SimpleGrid>
              </VStack>
            </Box>
          </VStack>
        ) : (
          <Tabs variant="unstyled" isLazy>
            <Box mb={8} overflowX="auto" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
              <TabList
                display="flex"
                w="full"
                borderBottom="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                gap={2}
              >
                {[
                  { name: "Personal", icon: <FiUser size={18} /> },
                  { name: "Family", icon: <FiUsers size={18} /> },
                  { name: "Skills", icon: <FiStar size={18} /> },
                  { name: "Statutory", icon: <FiShield size={18} /> },
                  { name: "Documents", icon: <FiFolder size={18} /> }
                ].map((tab) => (
                  <Tab
                    key={tab.name}
                    _selected={{
                      color: useColorModeValue("blue.600", "blue.300"),
                      borderColor: useColorModeValue("blue.600", "blue.300"),
                      bg: useColorModeValue("blue.50", "rgba(66, 153, 225, 0.15)"),
                      fontWeight: "600",
                    }}
                    _hover={{
                      color: useColorModeValue("blue.500", "blue.400"),
                      bg: useColorModeValue("gray.50", "whiteAlpha.50"),
                    }}
                    color={useColorModeValue("gray.500", "gray.400")}
                    fontSize="sm"
                    fontWeight="500"
                    px={5}
                    py={3}
                    borderBottom="3px solid transparent"
                    borderTopRadius="md"
                    transition="all 0.2s"
                    mb="-1px"
                  >
                    <HStack spacing={2}>
                      {tab.icon}
                      <Text>{tab.name}</Text>
                    </HStack>
                  </Tab>
                ))}
              </TabList>
            </Box>

            <TabPanels pt={0}>
              <TabPanel px={0} pt={0}>
                <PersonalDetailsForm
                  user={user}
                  data={profileData}
                  onSave={handleSavePersonalDetails}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0} pt={0}>
                <FamilyContactsForm
                  data={profileData}
                  onSave={handleSaveFamilyContacts}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0} pt={0}>
                <SkillsMappingForm
                  data={profileData}
                  onSave={handleSaveSkills}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0} pt={0}>
                <StatutoryDetailsForm
                  data={profileData}
                  onSave={handleSaveStatutory}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0} pt={0}>
                {user?._id ? <DocumentsForm userId={user._id} /> : <Text>Loading...</Text>}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>
    </DashboardDrawer>
  );
});

export default ProfileDetailsDrawer;
