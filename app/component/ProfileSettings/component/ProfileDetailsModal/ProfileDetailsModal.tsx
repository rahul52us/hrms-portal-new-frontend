import {
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  InfoIcon,
} from "@chakra-ui/icons"; // Assuming standard chakra icons
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import stores from "../../../../store/stores";
import { getDefaultSchedule } from "../../utils/constant";
import OperatingHours from "../OperatingHours/OperatingHours";
import ProfileSettings from "../../ProfileSettings"; // Adjust path if needed

// Helper component for consistent key-value display
const DetailItem = ({ label, value, icon }) => (
  <Box p={3} borderWidth="1px" borderRadius="lg" bg="gray.50">
    <Flex align="center" mb={1}>
      {icon && <Icon as={icon} color="blue.500" mr={2} boxSize={3} />}
      <Text
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
        color="gray.500"
      >
        {label}
      </Text>
    </Flex>
    <Text fontSize="md" fontWeight="medium" color="gray.700">
      {value || "-"}
    </Text>
  </Box>
);

const ProfileDetailsModal = observer(({ isOpen, onClose, user }: any) => {
  const [isSaving, setIsSaving] = useState(false);
  const { companyStore } = stores;
  const toast = useToast();
  const [schedule, setSchedule] = useState(getDefaultSchedule());


  const handleSave = async () => {
    setIsSaving(true);
    const payload = schedule.map((item) => ({
      day: item.day,
      isOpen: item.isOpen,
      slots: item.isOpen ? item.slots.filter((s) => s.start && s.end) : [],
    }));

    try {
      const response = await companyStore.updateCompanyPreferences({
        sidebarColors: stores.themeStore.themeConfig.sidebarColors,
      });

      if (response?.data?.success) {
        toast({
          title: "Configuration Saved",
          description: "Operating hours updated successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        onClose();
      }
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err?.message || "Something went wrong.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsSaving(false);
    }
  };
  // Safety check if user is null
  if (!user) return null;
  const {
    name,
    title,
    username,
    role,
    pic,
    code,
    is_active,
    companyDetails,
    createdAt,
  } = user;

  const joinedDate = createdAt ? new Date(createdAt).toLocaleDateString() : "-";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={"3xl"}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Header Section: Identity */}
        <Box bg="blue.600" p={5} color="white" position="relative">
          <ModalCloseButton color="white" />
          <Flex
            direction={{ base: "column", sm: "row" }}
            align="center"
            gap={5}
          >
            <Avatar
              size="lg"
              src={pic?.url}
              name={name}
              border="4px solid white"
              boxShadow="lg"
            />
            <Box textAlign={{ base: "center", sm: "left" }}>
              <Flex
                align="center"
                gap={2}
                justify={{ base: "center", sm: "flex-start" }}
              >
                <Heading size="md">
                  {title} {name}
                </Heading>
                <Badge
                  colorScheme={is_active ? "green" : "red"}
                  variant="solid"
                  borderRadius="full"
                  px={2}
                >
                  {is_active ? "Active" : "Inactive"}
                </Badge>
              </Flex>
              <Text fontSize="md" opacity={0.9} mt={1}>
                {username}
              </Text>
              <Badge mt={2} colorScheme="orange" variant="subtle">
                {role}
              </Badge>
            </Box>
          </Flex>
        </Box>

        <ModalBody p={0}>
          <Tabs isFitted variant="enclosed" colorScheme="blue" defaultIndex={0}>
            <TabList px={4} pt={4}>
              <Tab fontWeight="bold">Profile</Tab>
              <Tab fontWeight="bold">Sidebar</Tab>
            </TabList>

            <TabPanels>
              {/* TAB 1: Profile Overview */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  <Divider />
                  {/* Details Grid */}
                  <Box>
                    <Text fontWeight="bold" mb={3}>
                      Account & Company Details
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem
                        label="Employee Code"
                        value={code}
                        icon={InfoIcon}
                      />
                      <DetailItem
                        label="Company"
                        value={companyDetails?.company_name}
                        icon={CheckCircleIcon}
                      />
                      <DetailItem
                        label="User Type"
                        value={user.userType}
                        icon={InfoIcon}
                      />
                      <DetailItem
                        label="Joined On"
                        value={joinedDate}
                        icon={CalendarIcon}
                      />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>



              {/* TAB 3: Sidebar Settings */}
              <TabPanel p={6}>
                <ProfileSettings />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter bg="gray.50">
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>

          <Button
            colorScheme="blue"
            leftIcon={<CheckIcon />}
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default ProfileDetailsModal;
