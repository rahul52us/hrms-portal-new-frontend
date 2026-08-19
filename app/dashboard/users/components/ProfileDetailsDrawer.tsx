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
  VStack,
  Spinner,
  Center,
  Skeleton,
  HStack,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { FiUser, FiUsers, FiStar, FiShield, FiFolder } from "react-icons/fi";
import DashboardDrawer from "../../../component/common/Drawer/DashboardDrawer";
import PersonalDetailsForm from "./ProfileTabs/PersonalDetailsForm";
import FamilyContactsForm from "./ProfileTabs/FamilyContactsForm";
import SkillsMappingForm from "./ProfileTabs/SkillsMappingForm";
import StatutoryDetailsForm from "./ProfileTabs/StatutoryDetailsForm";
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

  const loadProfileDetails = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSavePersonalDetails = async (payload: any) => {
    if (!user?._id) return;
    setSaving(true);
    try {
      await userStore.updatePersonalDetails(user._id, payload);
      toast({ title: "Personal details updated", status: "success" });
      loadProfileDetails();
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
      loadProfileDetails();
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
      loadProfileDetails();
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
      loadProfileDetails();
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };


  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxW="80%"
      titlePrefix="Extended Profile"
      titleSuffix={user?.name ? `- ${user.name}` : ""}
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
          <Tabs variant="unstyled" colorScheme="blue">
            <Box mb={4} display="flex" justifyContent="flex-start">
              <TabList
                borderBottom="1px solid"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                display="flex"
                w="full"
                overflowX="auto"
                css={{ "&::-webkit-scrollbar": { display: "none" } }}
                gap={6}
              >
                {[
                  { name: "Personal", icon: <FiUser size={16} /> },
                  { name: "Family", icon: <FiUsers size={16} /> },
                  { name: "Skills", icon: <FiStar size={16} /> },
                  { name: "Statutory", icon: <FiShield size={16} /> },
                  { name: "Documents", icon: <FiFolder size={16} /> }
                ].map((tab) => (
                  <Tab
                    key={tab.name}
                    _selected={{
                      color: useColorModeValue("blue.600", "blue.300"),
                      borderColor: useColorModeValue("blue.600", "blue.300"),
                      fontWeight: "700",
                    }}
                    _hover={{
                      color: useColorModeValue("blue.500", "blue.300"),
                    }}
                    color={useColorModeValue("gray.500", "gray.400")}
                    fontSize="sm"
                    fontWeight="600"
                    px={1}
                    py={3}
                    borderBottom="2px solid transparent"
                    transition="all 0.2s"
                    display="flex"
                    alignItems="center"
                    gap={2.5}
                    whiteSpace="nowrap"
                  >
                    {tab.icon}
                    {tab.name}
                  </Tab>
                ))}
              </TabList>
            </Box>

            <TabPanels pt={0}>
              <TabPanel px={0} pt={0}>
                <PersonalDetailsForm
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
                <Text>Document Upload coming soon...</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>
    </DashboardDrawer>
  );
});

export default ProfileDetailsDrawer;
