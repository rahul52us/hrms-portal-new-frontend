"use client";

import stores from "@/app/store/stores";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiEdit2,
  FiHash,
  FiMail,
  FiMapPin,
  FiUser
} from "react-icons/fi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { MdOutlineVerified } from "react-icons/md";
import EditProfileModal from "./component/EditProfileModal";
import { genderOptions } from "@/app/config/constant";
import { formatDateForInput } from "@/app/component/config/utils/dateUtils";

function s(v: any): string {
  if (v == null || typeof v === "object") return "";
  return String(v);
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function genderLabel(value?: number | string) {
  if (value == null || value === "") return "";
  const match = genderOptions.find((option: any) => option.value === Number(value));
  return match?.label || "";
}

function profileField(user: any, personalInfo: any, key: string) {
  return s(user?.[key] || personalInfo?.[key]);
}

const emptyForm = {
  firstName: "",
  lastName: "",
  title: "",
  address: "",
  city: "",
  state: "",
  country: "",
  gender: "" as number | "",
  dateOfBirth: "",
  bio: "",
};

function buildFormFromUser(user: any, personalInfo: any) {
  const { firstName, lastName } = splitName(s(user?.name || personalInfo?.name));
  const genderValue = user?.gender ?? personalInfo?.gender;
  const dob = user?.dateOfBirth || personalInfo?.dateOfBirth;

  return {
    firstName,
    lastName,
    title: profileField(user, personalInfo, "title"),
    address: profileField(user, personalInfo, "address"),
    city: profileField(user, personalInfo, "city"),
    state: profileField(user, personalInfo, "state"),
    country: profileField(user, personalInfo, "country"),
    gender: typeof genderValue === "number" ? genderValue : ("" as number | ""),
    dateOfBirth: dob ? formatDateForInput(String(dob)) : "",
    bio: profileField(user, personalInfo, "bio"),
  };
}


const ProfilePage: React.FC = observer(() => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const user = stores.auth.user;
  const personalInfo = user?.profile_details?.personalInfo || {};

  const [tempForm, setTempForm] = useState(emptyForm);

  const resolvedPhone = s(
    user?.mobileNumber ||
      personalInfo?.mobileNumber ||
      personalInfo?.phoneNumber
  );

  const role = s(user?.role).toLowerCase().replace(/_/g, " ");

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm(buildFormFromUser(user, personalInfo));
  }, [user]);

  const fullName = `${form.firstName} ${form.lastName}`.trim() || s(user?.name) || "User";

  const handleOpen = () => {
    setTempForm(form); // clone current data
    onOpen();
  };

  const handleSave = async () => {
    if (!user?._id) return;
    setSaving(true);
  
    const name = `${tempForm.firstName} ${tempForm.lastName}`.trim();
  
    try {
      await stores.userStore.updateUser({
        _id: user._id,
        name: s(name || user?.name),
        title: s(tempForm.title),
        address: s(tempForm.address),
        city: s(tempForm.city),
        state: s(tempForm.state),
        country: s(tempForm.country),
        gender: tempForm.gender ? Number(tempForm.gender) : undefined,
        dateOfBirth: tempForm.dateOfBirth || undefined,
        bio: s(tempForm.bio),
        username: s(user?.username),
        mobileNumber: s(resolvedPhone),
        role: s(user?.role),
        code: s(user?.code || personalInfo?.code),
        company: s(user?.company || user?.companyId || personalInfo?.company),
      });
  
      setForm(tempForm); // ✅ apply changes to UI only after save
  
      await stores.auth.fetchUser();
      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
  
      onClose();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description:
          typeof err?.message === "string" ? err.message : "Please try again.",
        status: "error",
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  };

  // const handleSave = async () => {
  //   if (!user?._id) return;
  //   setSaving(true);
  //   const name = `${form.firstName} ${form.lastName}`.trim();
  //   try {
  //     await stores.userStore.updateUser({
  //       _id: user._id,
  //       name: s(name || user?.name),
  //       title: s(form.title),
  //       city: s(form.city),
  //       state: s(form.state),
  //       bio: s(form.bio),
  //       username: s(user?.username),
  //       mobileNumber: s(resolvedPhone),
  //       role: s(user?.role),
  //       code: s(user?.code || personalInfo?.code),
  //       company: s(user?.company || user?.companyId || personalInfo?.company),
  //     });
  //     await stores.auth.fetchUser();
  //     toast({
  //       title: "Profile updated",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //       position: "top-right",
  //     });
  //     onClose();
  //   } catch (err: any) {
  //     toast({
  //       title: "Save failed",
  //       description:
  //         typeof err?.message === "string" ? err.message : "Please try again.",
  //       status: "error",
  //       duration: 4000,
  //       position: "top-right",
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleModalClose = () => {
    if (!user) return onClose();
    setForm(buildFormFromUser(user, personalInfo));
    onClose();
  };

  const pageBg = useColorModeValue("gray.50", "gray.950");
  const pageHeadingColor = useColorModeValue("gray.900", "gray.50");
  const pageSubColor = useColorModeValue("gray.500", "gray.500");
  const location = [form.city, form.state, form.country].filter(Boolean).join(", ");
  const accentGradient = useColorModeValue(
    "linear(to-br, blue.500, blue.300)",
    "linear(to-br, blue.300, blue.500)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const glassBg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(26, 32, 44, 0.8)");

  return (
    <Box
      bg={pageBg}
      minH="100vh"
      py={{ base: 5, md: 7 }}
      px={{ base: 4, sm: 5, md: "60px" }}
      transition="background 0.2s"
    >
      <Box>
        <Flex
          justify="space-between"
          align={{ base: "flex-start", sm: "center" }}
          direction={{ base: "column", sm: "row" }}
          gap={3}
          mb={{ base: 5, md: 5 }}
        >
          <Box>
            <Text
              fontSize={{ base: "20px", md: "22px" }}
              fontWeight="700"
              color={pageHeadingColor}
              letterSpacing="-0.02em"
            >
              Profile
            </Text>
            <Text fontSize="12px" color={pageSubColor} mt="2px">
              View and manage your profile details
            </Text>
          </Box>

          <HStack spacing={2}>
         
            <Button
              leftIcon={<FiEdit2 size={13} />}
              onClick={handleOpen}
              size="sm"
              px={5}
              borderRadius="8px"
              fontSize="13px"
              fontWeight="600"
              bg={useColorModeValue("blue.500", "blue.300")}
              color={useColorModeValue("white", "gray.900")}
              _hover={{
                bg: useColorModeValue("blue.600", "blue.200"),
              }}
            >
              Edit Profile
            </Button>
          </HStack>
        </Flex>


        <Grid
      templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)", xl: "400px 1fr" }}
      gap={6}
      p={4}
    >
      {/* LEFT BOX: THE SQUARE PROFILE CARD */}
      <Box
        aspectRatio={1}
        bg={cardBg}
        position="relative"
        overflow="hidden"
        borderRadius="32px"
        boxShadow="lg"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={8}
        border="1px solid"
        borderColor="whiteAlpha.300"
        _before={{
          content: '""',
          position: "absolute",
          top: 0, left: 0, right: 0, height: "40%",
          bgGradient: accentGradient,
          opacity: 0.15,
          zIndex: 0
        }}
      >
        <Box position="relative" zIndex={1} mb={4}>
          <Box
            p="6px"
            borderRadius="full"
            bgGradient={accentGradient}
            boxShadow={useColorModeValue(
              "0px 10px 25px -5px rgba(15, 23, 42, 0.18)",
              "0px 10px 25px -5px rgba(0, 0, 0, 0.42)"
            )}
          >
            <Avatar
              name={fullName}
              src={s(user?.pic?.url)}
              w={{ base: "120px", md: "150px" }}
              h={{ base: "120px", md: "150px" }}
              border="4px solid"
              borderColor={cardBg}
            />
          </Box>
          <Box
            position="absolute"
            bottom="10px"
            right="10px"
            w="20px"
            h="20px"
            borderRadius="full"
            bg="green.400"
            border="4px solid"
            borderColor={cardBg}
          >
             <Box
              position="absolute"
              top="-4px" left="-4px" right="-4px" bottom="-4px"
              borderRadius="full"
              bg="green.400"
            />
          </Box>
        </Box>

        <VStack spacing={2} zIndex={1}>
          <Text fontSize="22px" fontWeight="800" letterSpacing="-0.03em" color={useColorModeValue("gray.800", "white")}>
          {form.title ? `${form.title} ${fullName}` : fullName}
          </Text>
        </VStack>

        <Divider my={6} opacity={0.6} />

        <VStack spacing={3} w="full" align="center" zIndex={1}>
          <HStack color="gray.500" fontSize="13px">
            <FiMail size={14} />
            <Text fontWeight="600" fontSize={'md'}>{s(user?.username)}</Text>
          </HStack>
          {location && (
            <HStack color="gray.500" fontSize="13px">
              <FiMapPin size={14} />
              <Text fontWeight="500" fontSize={'sm'}>{location}</Text>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* RIGHT BOX: DETAILS CARD */}
      <Box
        bg={glassBg}
        backdropFilter="blur(10px)"
        borderRadius="32px"
        border="1px solid"
        borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}
        boxShadow="lg"
        p={8}
        display="flex"
        flexDirection="column"
      >
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={3}>
            <Icon as={MdOutlineVerified} color="blue.400" boxSize={6} />
            <Text fontSize="18px" fontWeight="700">My Profile</Text>
          </HStack>
          <Box w="8px" h="8px" borderRadius="full" bg="green.400" />
        </Flex>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={5}>
          {[
            // { icon: FiUser, label: "Role", value: role, color: "blue.400" },
            { icon: FiBriefcase, label: "Department", value: s(user?.department), color: "purple.400" },
            // { icon: FiUser, label: "Title", value: s(form.title), color: "orange.400" },
            { icon: FiHash, label: "Employee Code", value: s(user?.code), color: "red.400" },
            { icon: FiCalendar, label: "Joined Date", value: fmtDate(user?.joiningDate), color: "teal.400" },
            { icon: FiCalendar, label: "Date of Birth", value: fmtDate(form.dateOfBirth || user?.dateOfBirth), color: "pink.400" },
            { icon: FiUser, label: "Gender", value: genderLabel(form.gender || user?.gender), color: "cyan.400" },
            { icon: FiMapPin, label: "Address", value: form.address, color: "green.400" },
            { icon: FiMapPin, label: "City", value: form.city, color: "yellow.500" },
            { icon: FiMapPin, label: "Country", value: form.country, color: "orange.300" },
            // { icon: HiOutlineOfficeBuilding, label: "Company", value: s(user?.companyDetails?.company_name), color: "blue.400" },
          ].map((item, idx) => (
            <HStack key={idx} spacing={4} _hover={{ transform: "translateX(5px)" }} transition="0.2s">
              <Flex 
                align="center" justify="center" 
                p={2} borderRadius="12px" 
                bg={useColorModeValue(`${item.color.split('.')[0]}.50`, "whiteAlpha.100")}
              >
                <Icon as={item.icon} color={item.color} boxSize={5} />
              </Flex>
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">{item.label}</Text>
                <Text fontWeight="600" fontSize="15px">{item.value || "N/A"}</Text>
              </VStack>
            </HStack>
          ))}
        </Grid>

        {form.bio && (
          <Box mt="auto" pt={4}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={3}>
              About Me
            </Text>
            <Box 
              p={4} 
              bg={useColorModeValue("gray.50", "whiteAlpha.50")} 
              borderRadius="20px"
              borderLeft="4px solid"
              borderColor="blue.400"
            >
              <Text fontSize="14px" lineHeight="1.8" color={useColorModeValue("gray.700", "gray.300")}>
                {form.bio}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </Grid>
      </Box>
      <EditProfileModal
  isOpen={isOpen}
  onClose={handleModalClose}
  form={tempForm}
  handleChange={(field, value) =>
    setTempForm((c) => ({ ...c, [field]: value }))
  }
  handleSave={handleSave}
  saving={saving}
/>
    </Box>
  );
});
export default ProfilePage;
