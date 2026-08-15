import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

type Props = {
  data: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const PersonalDetailsForm = ({ data, onSave, isSaving }: Props) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    knownAs: "",
    maritalStatus: "",
    anniversaryDate: "",
    fatherHusbandName: "",
  });

  useEffect(() => {
    if (data?.personalDetails) {
      setFormData({
        firstName: data.personalDetails.firstName || "",
        middleName: data.personalDetails.middleName || "",
        lastName: data.personalDetails.lastName || "",
        knownAs: data.personalDetails.knownAs || "",
        maritalStatus: data.personalDetails.maritalStatus || "",
        anniversaryDate: data.personalDetails.anniversaryDate
          ? new Date(data.personalDetails.anniversaryDate).toISOString().split("T")[0]
          : "",
        fatherHusbandName: data.personalDetails.fatherHusbandName || "",
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="xl" bg="white" _dark={{ bg: "gray.800" }}>
      <VStack spacing={5} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">First Name</FormLabel>
            <Input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Middle Name</FormLabel>
            <Input
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Middle name"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Last Name</FormLabel>
            <Input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
            />
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Known As</FormLabel>
            <Input
              name="knownAs"
              value={formData.knownAs}
              onChange={handleChange}
              placeholder="Preferred name"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Father/Husband Name</FormLabel>
            <Input
              name="fatherHusbandName"
              value={formData.fatherHusbandName}
              onChange={handleChange}
              placeholder="Father/Husband Name"
            />
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Marital Status</FormLabel>
            <Select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
              <option value="">Select status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="other">Other</option>
            </Select>
          </FormControl>

          {formData.maritalStatus === "married" && (
            <FormControl>
              <FormLabel fontSize="sm" color="gray.500">Anniversary Date</FormLabel>
              <Input
                type="date"
                name="anniversaryDate"
                value={formData.anniversaryDate}
                onChange={handleChange}
              />
            </FormControl>
          )}
        </SimpleGrid>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSaving} px={8}>
            Save Personal Details
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default PersonalDetailsForm;
