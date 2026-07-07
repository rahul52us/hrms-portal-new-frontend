import CustomInput from "@/app/component/config/component/customInput/CustomInput";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
import {
  Box,
  Button,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiBriefcase, FiLayers } from "react-icons/fi";

type AddDepartmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  companyId?: string;
  companyName?: string;
  onSaved?: (_mode: "create" | "update") => Promise<void> | void;
};

const AddDepartmentModal = ({
  isOpen,
  onClose,
  initialData,
  companyId,
  companyName,
  onSaved,
}: AddDepartmentModalProps) => {
  const [formData, setFormData] = useState({ name: "", code: "" });

  const isEditMode = Boolean(initialData?._id);

  const modalBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const titleColor = useColorModeValue("gray.900", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const companyTextColor = useColorModeValue("gray.700", "gray.200");
  const warningBg = useColorModeValue("orange.50", "orange.900");
  const warningText = useColorModeValue("orange.700", "orange.200");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.departmentName || "",
        code: initialData.code || "",
      });
    } else {
      setFormData({ name: "", code: "" });
    }
  }, [initialData, isOpen]);

  const departmentName = formData.name.trim();
  const code = formData.code.trim();

  const isDisabled = !departmentName || !code || (!isEditMode && !companyId);

  const handleSave = async () => {
    if (isDisabled) return;

    const mode = isEditMode ? "update" : "create";

    try {
      if (mode === "update") {
        await departmentStore.updateDepartment(initialData._id, {
          departmentName,
          code,
        });
      } else {
        await departmentStore.createDepartment({
          departmentName,
          code,
          companyId,
        });
      }

      await onSaved?.(mode);
      onClose();
    } catch (error) {
      console.error("Failed to save department:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      motionPreset="slideInBottom"
      size={{ base: "xs", sm: "sm", md: "md" }}
    >
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.400" />

      <ModalContent
        mx={{ base: 3, sm: 4 }}
        borderRadius={{ base: "2xl", md: "3xl" }}
        boxShadow="2xl"
        bg={modalBg}
        overflow="hidden"
      >
        <Box h="1" bgGradient="linear(to-r, blue.400, purple.500, pink.400)" />

        <ModalHeader
          px={{ base: 4, md: 6 }}
          py={{ base: 4, md: 5 }}
          borderBottomWidth="1px"
          borderColor={borderColor}
        >
          <HStack spacing={3} align="flex-start" pr={8}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={{ base: 9, md: 10 }}
              h={{ base: 9, md: 10 }}
              borderRadius="xl"
              bgGradient="linear(to-br, blue.500, purple.600)"
              color="white"
              flexShrink={0}
            >
              <Icon as={FiLayers} boxSize={{ base: 4, md: 5 }} />
            </Box>

            <Box minW={0}>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="800"
                color={titleColor}
                lineHeight="1.2"
              >
                {isEditMode ? "Update Department" : "New Department"}
              </Text>

              <Text
                mt={1}
                fontSize={{ base: "xs", md: "sm" }}
                color={mutedTextColor}
                fontWeight="500"
                noOfLines={2}
              >
                {isEditMode
                  ? "Edit department name and code."
                  : "Create a department for the selected company."}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>

        <ModalCloseButton top={{ base: 3, md: 4 }} right={{ base: 3, md: 4 }} />

        <ModalBody px={{ base: 4, md: 6 }} py={{ base: 4, md: 5 }}>
          <Stack spacing={{ base: 4, md: 5 }}>
            <Box
              p={{ base: 3, md: 4 }}
              bg={softBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              borderStyle="dashed"
            >
              <HStack spacing={3} align="flex-start">
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="8"
                  h="8"
                  borderRadius="lg"
                  bg={useColorModeValue("blue.50", "blue.900")}
                  color={useColorModeValue("blue.500", "blue.300")}
                  flexShrink={0}
                >
                  <Icon as={FiBriefcase} boxSize={4} />
                </Box>

                <Box minW={0}>
                  <Text
                    fontSize="xs"
                    fontWeight="800"
                    color={mutedTextColor}
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    Company
                  </Text>

                  <Text
                    mt={0.5}
                    fontSize={{ base: "sm", md: "md" }}
                    fontWeight="700"
                    color={companyTextColor}
                    noOfLines={2}
                  >
                    {companyName || "No company selected"}
                  </Text>
                </Box>
              </HStack>
            </Box>

            {!isEditMode && !companyId ? (
              <Box
                px={3}
                py={2.5}
                bg={warningBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={useColorModeValue("orange.100", "orange.700")}
              >
                <Text fontSize="xs" fontWeight="600" color={warningText}>
                  Please select a company before creating a department.
                </Text>
              </Box>
            ) : null}

            <CustomInput
              label="Department Name"
              placeholder="e.g. Engineering"
              name="name"
              value={formData.name}
              onChange={(e: any) =>
                setFormData((previous) => ({
                  ...previous,
                  name: e.target.value,
                }))
              }
            />

            <CustomInput
              label="Department Code"
              placeholder="e.g. ENG-01"
              name="code"
              value={formData.code}
              onChange={(e: any) =>
                setFormData((previous) => ({
                  ...previous,
                  code: e.target.value.toUpperCase(),
                }))
              }
            />

            <Text fontSize="xs" color={mutedTextColor} lineHeight="1.5">
              Department code should be short and easy to identify, for example{" "}
              <Text as="span" fontWeight="700">
                ENG
              </Text>{" "}
              or{" "}
              <Text as="span" fontWeight="700">
                HR-01
              </Text>
              .
            </Text>
          </Stack>
        </ModalBody>

        <ModalFooter
          px={{ base: 4, md: 6 }}
          py={{ base: 4, md: 5 }}
          gap={3}
          borderTopWidth="1px"
          borderColor={borderColor}
          flexDirection={{ base: "column-reverse", sm: "row" }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            fontWeight="600"
            width={{ base: "100%", sm: "auto" }}
            rounded="full"
          >
            Cancel
          </Button>

          <Button
            colorScheme="blue"
            px={6}
            fontWeight="800"
            onClick={handleSave}
            isDisabled={isDisabled}
            isLoading={departmentStore.isSubmitting}
            loadingText={isEditMode ? "Saving..." : "Creating..."}
            width={{ base: "100%", sm: "auto" }}
            rounded="full"
            bgGradient="linear(to-r, blue.500, purple.600)"
            color="white"
            _hover={{
              bgGradient: "linear(to-r, blue.600, purple.700)",
              transform: "translateY(-1px)",
              boxShadow: "lg",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s"
          >
            {isEditMode ? "Update Changes" : "Create Department"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddDepartmentModal;