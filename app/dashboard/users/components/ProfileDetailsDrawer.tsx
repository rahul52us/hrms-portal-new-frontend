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
          <Center h="300px">
            <Spinner size="xl" color="blue.500" />
          </Center>
        ) : (
          <Tabs variant="unstyled" colorScheme="blue" display="flex" flexDirection="column" h="full">
            <Box pb={4} borderBottomWidth="1px" mb={4}>
              <TabList
                gap={2}
                bg={useColorModeValue("gray.100", "gray.800")}
                p={1.5}
                borderRadius="xl"
                display="inline-flex"
                w={{ base: "100%", md: "fit-content" }}
                overflowX="auto"
                css={{ "&::-webkit-scrollbar": { display: "none" } }}
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
                      bg: useColorModeValue("white", "gray.700"),
                      color: useColorModeValue("blue.600", "blue.300"),
                      boxShadow: "sm",
                      fontWeight: "bold",
                    }}
                    color="gray.500"
                    fontSize="sm"
                    fontWeight="medium"
                    borderRadius="lg"
                    px={5}
                    py={2}
                    transition="all 0.2s"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    whiteSpace="nowrap"
                  >
                    {tab.icon}
                    {tab.name}
                  </Tab>
                ))}
              </TabList>
            </Box>

            <TabPanels flex={1} overflowY="auto">
              <TabPanel px={0}>
                <PersonalDetailsForm
                  data={profileData}
                  onSave={handleSavePersonalDetails}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0}>
                <FamilyContactsForm
                  data={profileData}
                  onSave={handleSaveFamilyContacts}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0}>
                <SkillsMappingForm
                  data={profileData}
                  onSave={handleSaveSkills}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0}>
                <StatutoryDetailsForm
                  data={profileData}
                  onSave={handleSaveStatutory}
                  isSaving={saving}
                />
              </TabPanel>
              <TabPanel px={0}>
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
