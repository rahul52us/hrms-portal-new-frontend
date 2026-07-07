"use client";

import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import stores from "@/app/store/stores";

type UserProfileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

function splitName(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

const UserProfileDrawer = observer(({ isOpen, onClose }: UserProfileDrawerProps) => {
  const toast = useToast();
  const user = stores.auth.user;
  const personalInfo = user?.profile_details?.personalInfo || {};
  const resolvedPhone =
    user?.mobileNumber ||
    personalInfo?.mobileNumber ||
    personalInfo?.phoneNumber ||
    personalInfo?.phoneNo ||
    personalInfo?.mobileNo ||
    "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    city: "",
    state: "",
    bio: "",
  });

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    const nameParts = splitName(user?.name || personalInfo?.name);
    setForm({
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      title: user?.title || personalInfo?.title || "",
      city: user?.city || personalInfo?.city || "",
      state: user?.state || personalInfo?.state || "",
      bio: user?.bio || personalInfo?.bio || "",
    });
  }, [isOpen, personalInfo?.bio, personalInfo?.city, personalInfo?.name, personalInfo?.state, personalInfo?.title, user]);

  const avatarName = useMemo(() => {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    return fullName || user?.name || user?.username || "Learner";
  }, [form.firstName, form.lastName, user?.name, user?.username]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?._id) {
      return;
    }

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const mergedPayload = {
      ...personalInfo,
      _id: user._id,
      name: fullName || user?.name || "",
      title: form.title,
      city: form.city,
      state: form.state,
      bio: form.bio,
      username: user?.username || personalInfo?.username || "",
      mobileNumber: resolvedPhone,
      role: user?.role || personalInfo?.role || "",
      code: user?.code || personalInfo?.code || "",
    };

    try {
      await stores.userStore.updateUser(mergedPayload);
      await stores.auth.fetchUser();
      toast({
        title: "Profile updated",
        description: "Your personal details have been saved.",
        status: "success",
        duration: 3500,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Unable to update profile",
        description: error?.message || error?.error || "Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">My Profile</DrawerHeader>

        <DrawerBody py={6}>
          <Stack spacing={6}>
            <Box borderWidth="1px" borderRadius="3xl" p={5} bg="gray.50">
              <Stack direction={{ base: "column", sm: "row" }} spacing={4} align={{ base: "start", sm: "center" }}>
                <Avatar
                  size="xl"
                  name={avatarName}
                  src={user?.pic?.url || ""}
                  bg="blue.600"
                  color="white"
                />
                <Box>
                  <Text fontSize="lg" fontWeight="bold">
                    {avatarName}
                  </Text>
                  <Text color="gray.600">{user?.username || "No email"}</Text>
                  <Text color="gray.500" fontSize="sm" textTransform="capitalize">
                    {String(user?.role || "user").replace(/_/g, " ")}
                  </Text>
                </Box>
              </Stack>
            </Box>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <FormControl>
                <FormLabel>First name</FormLabel>
                <Input value={form.firstName} onChange={(event) => handleChange("firstName", event.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>Last name</FormLabel>
                <Input value={form.lastName} onChange={(event) => handleChange("lastName", event.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input value={form.title} onChange={(event) => handleChange("title", event.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>City</FormLabel>
                <Input value={form.city} onChange={(event) => handleChange("city", event.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>State</FormLabel>
                <Input value={form.state} onChange={(event) => handleChange("state", event.target.value)} />
              </FormControl>

              <FormControl isReadOnly>
                <FormLabel>Role</FormLabel>
                <Input value={String(user?.role || "").replace(/_/g, " ")} />
              </FormControl>

              <FormControl isReadOnly>
                <FormLabel>Email</FormLabel>
                <Input value={user?.username || ""} />
              </FormControl>

              <FormControl isReadOnly>
                <FormLabel>Phone number</FormLabel>
                <Input value={resolvedPhone} />
              </FormControl>
            </Grid>

            <FormControl>
              <FormLabel>Bio</FormLabel>
              <Textarea
                rows={5}
                resize="vertical"
                value={form.bio}
                onChange={(event) => handleChange("bio", event.target.value)}
                placeholder="Add a short introduction about yourself"
              />
            </FormControl>
          </Stack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={stores.userStore.isLoading}>
            Save changes
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

export default UserProfileDrawer;
