"use client";

import CustomInput from "@/app/component/config/component/customInput/CustomInput";
import { OfficeLocationItem, locationStore } from "@/app/store/locationStore/locationStore";
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiMapPin } from "react-icons/fi";

type LocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: OfficeLocationItem | null;
  companyId?: string;
  companyName?: string;
  onSaved?: (_mode: "create" | "update") => Promise<void> | void;
};

const initialForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pinCode: "",
  is_active: true,
};

const LocationModal = ({
  isOpen,
  onClose,
  initialData,
  companyId,
  companyName,
  onSaved,
}: LocationModalProps) => {
  const [formData, setFormData] = useState(initialForm);
  const isEditMode = Boolean(initialData?._id);

  const modalBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const warningBg = useColorModeValue("orange.50", "orange.900");
  const warningText = useColorModeValue("orange.700", "orange.200");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "",
        pinCode: initialData.pinCode || "",
        is_active: initialData.is_active !== false,
      });
      return;
    }

    setFormData(initialForm);
  }, [initialData, isOpen]);

  const payload = {
    name: formData.name.trim(),
    code: formData.code.trim().toUpperCase(),
    address: formData.address.trim(),
    city: formData.city.trim(),
    state: formData.state.trim(),
    country: formData.country.trim(),
    pinCode: formData.pinCode.trim(),
    is_active: formData.is_active,
  };

  const isDisabled = !payload.name || !payload.code || !payload.city || (!isEditMode && !companyId);

  const handleSave = async () => {
    if (isDisabled) return;

    const mode = isEditMode ? "update" : "create";

    if (mode === "update" && initialData?._id) {
      await locationStore.updateLocation(initialData._id, payload);
    } else {
      await locationStore.createLocation({
        ...payload,
        companyId,
      });
    }

    await onSaved?.(mode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "xs", md: "xl" }}>
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.400" />
      <ModalContent mx={4} bg={modalBg} borderRadius="2xl" overflow="hidden">
        <Box h="1" bgGradient="linear(to-r, blue.400, purple.500, pink.400)" />
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          <HStack spacing={3} pr={8}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={10}
              h={10}
              borderRadius="xl"
              bgGradient="linear(to-br, blue.500, purple.600)"
              color="white"
              flexShrink={0}
            >
              <Icon as={FiMapPin} boxSize={5} />
            </Box>
            <Box minW={0}>
              <Text fontSize="lg" fontWeight="800" color={titleColor}>
                {isEditMode ? "Update Location" : "New Location"}
              </Text>
              <Text mt={1} fontSize="sm" color={muted} noOfLines={2}>
                {companyName || "Selected company"}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={5}>
          <Stack spacing={4}>
            {!isEditMode && !companyId ? (
              <Box p={3} bg={warningBg} borderRadius="xl">
                <Text fontSize="xs" fontWeight="600" color={warningText}>
                  Please select a company before creating a location.
                </Text>
              </Box>
            ) : null}

            <Box p={3} bg={softBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
              <Text fontSize="xs" color={muted} fontWeight="700" textTransform="uppercase">
                Office location is used for employee assignment and filtering. Attendance work-location rules stay separate in company policy.
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <CustomInput
                label="Location Name"
                name="name"
                placeholder="e.g. Delhi Head Office"
                value={formData.name}
                onChange={(event: any) =>
                  setFormData((previous) => ({ ...previous, name: event.target.value }))
                }
              />
              <CustomInput
                label="Location Code"
                name="code"
                placeholder="e.g. DEL-HO"
                value={formData.code}
                onChange={(event: any) =>
                  setFormData((previous) => ({
                    ...previous,
                    code: event.target.value.toUpperCase(),
                  }))
                }
              />
              <CustomInput
                label="City"
                name="city"
                placeholder="e.g. Delhi"
                value={formData.city}
                onChange={(event: any) =>
                  setFormData((previous) => ({ ...previous, city: event.target.value }))
                }
              />
              <CustomInput
                label="State"
                name="state"
                placeholder="e.g. Delhi"
                value={formData.state}
                onChange={(event: any) =>
                  setFormData((previous) => ({ ...previous, state: event.target.value }))
                }
              />
              <CustomInput
                label="Country"
                name="country"
                placeholder="e.g. India"
                value={formData.country}
                onChange={(event: any) =>
                  setFormData((previous) => ({ ...previous, country: event.target.value }))
                }
              />
              <CustomInput
                label="Pin Code"
                name="pinCode"
                placeholder="e.g. 110001"
                value={formData.pinCode}
                onChange={(event: any) =>
                  setFormData((previous) => ({ ...previous, pinCode: event.target.value }))
                }
              />
            </SimpleGrid>

            <CustomInput
              label="Address"
              name="address"
              placeholder="Full office address"
              value={formData.address}
              onChange={(event: any) =>
                setFormData((previous) => ({ ...previous, address: event.target.value }))
              }
            />

            <Checkbox
              isChecked={formData.is_active}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, is_active: event.target.checked }))
              }
            >
              Active location
            </Checkbox>
          </Stack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor} gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={isDisabled}
            isLoading={locationStore.isSubmitting}
            bgGradient="linear(to-r, blue.500, purple.600)"
            color="white"
          >
            {isEditMode ? "Update Location" : "Create Location"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LocationModal;
