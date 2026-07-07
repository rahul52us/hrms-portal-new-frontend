import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Textarea,
  FormLabel,
  Box,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { userStore } from "../../../store/userStore/userStore";
import CustomInput from "../../../component/config/component/customInput/CustomInput";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

const EditUserModal = ({ isOpen, onClose, user, onSuccess }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    code: user.code || "",
    bio: user.bio || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userStore.updateUser({
        _id: user._id,
        name: formData.name,
        code: formData.code,
        bio: formData.bio,
      });
      toast({
        title: "User updated",
        status: "success",
        duration: 3000,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "An error occurred",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent rounded="2xl" mx={4}>
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          Edit User
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            <HStack gap={4}>
              <CustomInput
                label="Full Name *"
                name="edit-name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              />
              <CustomInput
                label="Employee Code"
                name="edit-code"
                type="text"
                placeholder="E01"
                value={formData.code}
                onChange={(e: any) => setFormData({ ...formData, code: e.target.value })}
              />
            </HStack>

            <Box>
              <FormLabel fontSize="sm" fontWeight="500" color="gray.600" mb={1}>
                Bio
              </FormLabel>
              <Textarea
                rows={3}
                placeholder="Brief description..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                fontSize="sm"
                borderColor={borderColor}
                rounded="lg"
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor} gap={3}>
          <Button variant="ghost" onClick={onClose} rounded="full" isDisabled={isSaving}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            rounded="full"
            isLoading={isSaving}
            onClick={handleSave}
            shadow="sm"
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;
