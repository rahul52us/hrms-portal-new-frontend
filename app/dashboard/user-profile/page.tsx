"use client";

import {
  Avatar,
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { FiFolder, FiShield, FiStar, FiUser, FiUsers, FiMail, FiBriefcase, FiMapPin } from "react-icons/fi";
import { MdOutlineVerified } from "react-icons/md";
import stores from "@/app/store/stores";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { readFileAsBase64 } from "@/app/config/utils/utils";

import PersonalDetailsForm from "../users/components/ProfileTabs/PersonalDetailsForm";
import FamilyContactsForm from "../users/components/ProfileTabs/FamilyContactsForm";
import SkillsMappingForm from "../users/components/ProfileTabs/SkillsMappingForm";
import StatutoryDetailsForm from "../users/components/ProfileTabs/StatutoryDetailsForm";
import DocumentsForm from "../users/components/ProfileTabs/DocumentsForm";

const ProfilePage: React.FC = observer(() => {
  const { userStore, auth } = stores;
  const user = auth.user;
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>({});


  useEffect(() => {
    if (user?._id) {
      loadProfileDetails();
    }
  }, [user]);

  const loadProfileDetails = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await userStore.getMyProfileDetails();
      setProfileData(res?.data || {});
    } catch (error: any) {
      toast({
        title: "Failed to load profile",
        description: getApiErrorMessage(error),
        status: "error",
      });
    } finally {
      if (showLoader) setLoading(false);
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
        delete finalPayload.pic;
      }

      await userStore.updateMyPersonalDetails(finalPayload);
      
      // Refresh local user to update navbar avatar/name
      await auth.fetchUser();
      toast({ title: "Personal details updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFamilyContacts = async (payload: any) => {
    setSaving(true);
    try {
      await userStore.updateMyFamilyContacts(payload);
      toast({ title: "Family & Contacts updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async (payload: any) => {
    setSaving(true);
    try {
      await userStore.updateMySkills(payload);
      toast({ title: "Skills mapping updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatutory = async (payload: any) => {
    setSaving(true);
    try {
      await userStore.updateMyStatutoryDetails(payload);
      toast({ title: "Statutory details updated", status: "success" });
      loadProfileDetails(false);
    } catch (error: any) {
      toast({ title: "Failed to update", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.400", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const avatarUrl = user?.pic?.url || "";
  const fullName = user?.name || "User";
  const designation = user?.designation || "Employee";

  // Use horizontal tabs on mobile for better space utilization
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false; // basic fallback
  
  return (
    <Box p={{ base: 2, md: 2 }} w="full">
      <VStack align="stretch" spacing={4}>
        
        {/* Simple Profile Header */}
        <Flex 
          direction={{ base: "column", md: "row" }} 
          align="center" 
          textAlign={{ base: "center", md: "left" }}
          justify="space-between"
          bg={cardBg}
          p={{ base: 6, md: 5 }}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={cardBorder}
          boxShadow="sm"
          gap={4}
        >
          <Flex direction={{ base: "column", md: "row" }} align="center" gap={{ base: 4, md: 6 }} w="full">
            <Avatar 
              size="xl" 
              name={fullName} 
              src={avatarUrl} 
              boxShadow="md"
            />
            <VStack align={{ base: "center", md: "start" }} spacing={1} flex="1">
              <Flex direction={{ base: "column", sm: "row" }} align={{ base: "center", sm: "center" }} gap={2}>
                <HStack>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">{fullName}</Text>
                  <Icon as={MdOutlineVerified} color="blue.400" boxSize={5} />
                </HStack>
                <Badge 
                  colorScheme="blue" 
                  variant="solid" 
                  px={3} 
                  py={1} 
                  borderRadius="full" 
                  fontSize="xs"
                >
                  {user?.role?.toUpperCase() || "EMPLOYEE"}
                </Badge>
              </Flex>
              <Text color={muted} fontSize="md">{designation}</Text>
              
              <Flex 
                direction="row" 
                wrap="wrap" 
                justify={{ base: "center", md: "flex-start" }} 
                gap={{ base: 3, md: 4 }} 
                mt={2} 
                color={muted} 
                fontSize="sm"
              >
                {user?.username && <HStack><Icon as={FiMail} /> <Text>{user.username}</Text></HStack>}
                {user?.city && <HStack><Icon as={FiMapPin} /> <Text>{user.city}</Text></HStack>}
              </Flex>
            </VStack>
          </Flex>
        </Flex>

        {loading ? (
          <Flex direction={{ base: "column", md: "row" }} w="full" gap={6} align="stretch">
            {/* Sidebar Skeleton */}
            <Box 
              w={{ base: "full", md: "260px" }} 
              bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={cardBorder} 
              p={{ base: 2, md: 4 }} flexShrink={0}
            >
              <Skeleton height="12px" width="100px" mb={6} ml={2} />
              <VStack spacing={2} align="stretch">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height="44px" borderRadius="xl" startColor="gray.100" endColor="gray.200" _dark={{ startColor: "whiteAlpha.50", endColor: "whiteAlpha.200" }} />
                ))}
              </VStack>
            </Box>
            
            {/* Content Skeleton */}
            <Box flex="1" w="full" bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={cardBorder} p={{ base: 4, md: 6 }}>
              <HStack spacing={4} mb={8}>
                <Skeleton height="50px" width="50px" borderRadius="lg" />
                <VStack align="start" spacing={2} flex="1">
                  <Skeleton height="24px" width="250px" />
                  <Skeleton height="14px" width="180px" />
                </VStack>
              </HStack>
              <VStack spacing={6} align="stretch">
                <Skeleton height="120px" borderRadius="2xl" />
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Skeleton height="70px" borderRadius="xl" />
                  <Skeleton height="70px" borderRadius="xl" />
                  <Skeleton height="70px" borderRadius="xl" />
                  <Skeleton height="70px" borderRadius="xl" />
                </SimpleGrid>
              </VStack>
            </Box>
          </Flex>
        ) : (
          <Tabs orientation={{ base: "horizontal", md: "vertical" } as any} variant="unstyled" isLazy w="full">
            <Flex direction={{ base: "column", md: "row" }} w="full" gap={6} align="stretch">
              
              {/* Left Sidebar / Top Scroller - Vertical Tabs */}
              <Box 
                w={{ base: "full", md: "260px" }} 
                bg={cardBg}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={cardBorder}
                boxShadow="sm"
                p={{ base: 2, md: 4 }}
                flexShrink={0}
                overflow="hidden"
              >
                <Text display={{ base: "none", md: "block" }} fontSize="xs" fontWeight="bold" color={muted} textTransform="uppercase" letterSpacing="wider" mb={4} px={2}>
                  Profile Settings
                </Text>
                
                <TabList 
                  display="flex" 
                  flexDirection={{ base: "row", md: "column" }} 
                  gap={2}
                  overflowX={{ base: "auto", md: "visible" }}
                  pb={{ base: 2, md: 0 }}
                  css={{
                    "&::-webkit-scrollbar": { height: "4px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "4px" }
                  }}
                >
                  {[
                    { name: "Personal Details", icon: <FiUser size={18} /> },
                    { name: "Family & Contacts", icon: <FiUsers size={18} /> },
                    { name: "Skills & Expertise", icon: <FiStar size={18} /> },
                    { name: "Statutory Details", icon: <FiShield size={18} /> },
                    { name: "My Documents", icon: <FiFolder size={18} /> }
                  ].map((tab) => (
                    <Tab
                      key={tab.name}
                      justifyContent={{ base: "center", md: "flex-start" }}
                      px={{ base: 4, md: 4 }}
                      py={{ base: 2, md: 3 }}
                      borderRadius="xl"
                      whiteSpace="nowrap"
                      bg={{ base: useColorModeValue("blackAlpha.50", "whiteAlpha.100"), md: "transparent" }}
                      _selected={{
                        bg: useColorModeValue("blue.500", "blue.400"),
                        color: "white",
                        fontWeight: "600",
                        boxShadow: "md"
                      }}
                      _hover={{
                        bg: useColorModeValue("gray.100", "whiteAlpha.200"),
                        _selected: {
                          bg: useColorModeValue("blue.600", "blue.500"),
                        }
                      }}
                      color={muted}
                      fontSize="sm"
                      fontWeight="500"
                      transition="all 0.2s"
                    >
                      <HStack spacing={2}>
                        {tab.icon}
                        <Text>{tab.name}</Text>
                      </HStack>
                    </Tab>
                  ))}
                </TabList>
              </Box>

              {/* Right Side - Tab Content */}
              <Box flex="1" w="full" overflow="hidden">
                  <TabPanels>
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
                </Box>
                
              </Flex>
            </Tabs>
        )}
      </VStack>
    </Box>
  );
});

export default ProfilePage;
