import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  VStack,
  Text,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

type Props = {
  data: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const StatutoryDetailsForm = ({ data, onSave, isSaving }: Props) => {
  const [formData, setFormData] = useState({
    aadharNumber: "",
    nameAsPerAadhar: "",
    panNumber: "",
    nameAsPerPan: "",
    nationality: "indian",
  });

  useEffect(() => {
    if (data?.statutoryDetails) {
      setFormData({
        aadharNumber: data.statutoryDetails.aadharNumber || "",
        nameAsPerAadhar: data.statutoryDetails.nameAsPerAadhar || "",
        panNumber: data.statutoryDetails.panNumber || "",
        nameAsPerPan: data.statutoryDetails.nameAsPerPan || "",
        nationality: data.statutoryDetails.nationality || "indian",
      });
    } else {
      setFormData({
        aadharNumber: "",
        nameAsPerAadhar: "",
        panNumber: "",
        nameAsPerPan: "",
        nationality: "indian",
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'panNumber' ? value.toUpperCase() : value 
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="xl" bg="white" _dark={{ bg: "gray.800" }}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="lg" fontWeight="semibold">Statutory Information</Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Aadhar Number</FormLabel>
            <Input
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              placeholder="12-digit Aadhar number"
              maxLength={12}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Name as per Aadhar</FormLabel>
            <Input
              name="nameAsPerAadhar"
              value={formData.nameAsPerAadhar}
              onChange={handleChange}
              placeholder="Exact name on Aadhar"
            />
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">PAN Number</FormLabel>
            <Input
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              placeholder="10-character PAN"
              maxLength={10}
              textTransform="uppercase"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Name as per PAN</FormLabel>
            <Input
              name="nameAsPerPan"
              value={formData.nameAsPerPan}
              onChange={handleChange}
              placeholder="Exact name on PAN"
            />
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">Nationality</FormLabel>
            <Select name="nationality" value={formData.nationality} onChange={handleChange}>
              <option value="indian">Indian</option>
              <option value="other">Other</option>
            </Select>
          </FormControl>
        </SimpleGrid>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSaving} px={8}>
            Save Statutory Details
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default StatutoryDetailsForm;
