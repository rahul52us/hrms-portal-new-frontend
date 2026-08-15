import { Box, Button, FormControl, FormLabel, Grid, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Text, Textarea, useColorModeValue, VStack } from '@chakra-ui/react'
import { FiCheck, FiEdit2 } from 'react-icons/fi'
import { genderOptions } from '@/app/config/constant'

const EditProfileModal = ({onClose,isOpen,form,handleChange,handleSave,saving}:any) => {
    const modalBg = useColorModeValue("white", "gray.900");
    const modalBorder = useColorModeValue("gray.200", "gray.700");
    const modalHeaderBg = useColorModeValue("gray.50", "gray.800");
    const labelStyle:any = {
        fontSize: "13px",
        fontWeight: "600",
        color: useColorModeValue("gray.600", "gray.400"),
    }
    const inputStyles:any = {
        fontSize: "13px",
        fontWeight: "400",
        color: useColorModeValue("gray.600", "gray.400"),
        border: "1px solid",
        borderColor: useColorModeValue("gray.200", "gray.700"),
        borderRadius: "8px",
    }
  return (
    <div>
          <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay
          bg={useColorModeValue("blackAlpha.600", "blackAlpha.700")}
          backdropFilter="blur(4px)"
        />
        <ModalContent
          bg={modalBg}
          border="1px solid"
          borderColor={modalBorder}
          borderRadius="16px"
          overflow="hidden"
          mx={4}
        >
          {/* Modal Header */}
          <ModalHeader
            bg={modalHeaderBg}
            borderBottom="1px solid"
            borderColor={modalBorder}
            px={6}
            py={4}
          >
            <HStack spacing={3}>
              <Box
                w="32px"
                h="32px"
                borderRadius="8px"
                bg={useColorModeValue("gray.200", "gray.700")}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color={useColorModeValue("gray.600", "gray.300")}
              >
                <FiEdit2 size={14} />
              </Box>
              <Box>
                <Text
                  fontSize="15px"
                  fontWeight="600"
                  color={useColorModeValue("gray.900", "gray.50")}
                  letterSpacing="-0.01em"
                >
                  Edit Profile
                </Text>
                <Text fontSize="11px" color={useColorModeValue("gray.500", "gray.500")} fontWeight="400">
                  Update your personal information
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton
            top={4}
            right={4}
            borderRadius="8px"
            color={useColorModeValue("gray.500", "gray.400")}
            _hover={{ bg: useColorModeValue("gray.100", "gray.800") }}
          />

          <ModalBody px={6} py={5}>
            <VStack spacing={4} align="stretch">

              {/* Name row */}
              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl>
                  <FormLabel {...labelStyle}>First Name</FormLabel>
                  <Input
                    {...inputStyles}
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="First name"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelStyle}>Last Name</FormLabel>
                  <Input
                    {...inputStyles}
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Last name"
                  />
                </FormControl>
              </Grid>

              {/* Title */}
              <FormControl>
                <FormLabel {...labelStyle}>Job Title</FormLabel>
                <Input
                  {...inputStyles}
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. Senior Engineer"
                />
              </FormControl>

              {/* Address */}
              <FormControl>
                <FormLabel {...labelStyle}>Address</FormLabel>
                <Input
                  {...inputStyles}
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Street address"
                />
              </FormControl>

              {/* City / State / Country */}
              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl>
                  <FormLabel {...labelStyle}>City</FormLabel>
                  <Input
                    {...inputStyles}
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Your city"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel {...labelStyle}>State</FormLabel>
                  <Input
                    {...inputStyles}
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="Your state"
                  />
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel {...labelStyle}>Country</FormLabel>
                <Input
                  {...inputStyles}
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Your country"
                />
              </FormControl>

              {/* Gender / DOB */}
              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl>
                  <FormLabel {...labelStyle}>Gender</FormLabel>
                  <Select
                    {...inputStyles}
                    value={form.gender || ""}
                    onChange={(e) =>
                      handleChange("gender", e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Select gender"
                  >
                    {genderOptions.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel {...labelStyle}>Date of Birth</FormLabel>
                  <Input
                    {...inputStyles}
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  />
                </FormControl>
              </Grid>

              {/* Bio */}
              <FormControl>
                <FormLabel {...labelStyle}>Bio</FormLabel>
                <Textarea
                  {...inputStyles}
                  fontSize="13px"
                  borderRadius="8px"
                  rows={3}
                  resize="vertical"
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  _placeholder={{ color: useColorModeValue("gray.400", "gray.600") }}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter
            px={6}
            py={4}
            borderTop="1px solid"
            borderColor={modalBorder}
            gap={2}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              size="sm"
              borderRadius="8px"
              fontSize="13px"
              color={useColorModeValue("gray.600", "gray.400")}
              _hover={{ bg: useColorModeValue("gray.100", "gray.800") }}
            >
              Cancel
            </Button>
            <Button
              leftIcon={<FiCheck size={13} />}
              onClick={handleSave}
              isLoading={saving}
              loadingText="Saving…"
              size="sm"
              px={5}
              borderRadius="8px"
              fontSize="13px"
              fontWeight="600"
              bg={useColorModeValue("gray.900", "gray.100")}
              color={useColorModeValue("white", "gray.900")}
              _hover={{
                bg: useColorModeValue("gray.700", "gray.300"),
              }}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default EditProfileModal
