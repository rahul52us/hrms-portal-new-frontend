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
  Flex,
  useColorModeValue,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IdCard, Globe, CreditCard, ShieldCheck } from "lucide-react";

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

  // Premium color tokens
  const cardBorder = useColorModeValue("gray.400", "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.800", "gray.300");
  const headerGradient = useColorModeValue("linear(to-r, blue.600, purple.600)", "linear(to-r, blue.300, purple.300)");
  const sectionTitleColor = useColorModeValue("blue.600", "blue.300");

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
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack spacing={4} align="center">
          <Box display="inline-flex" p={2.5} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/30")} color={sectionTitleColor} boxShadow="sm">
            <ShieldCheck size={20} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="800" bgGradient={headerGradient} bgClip="text" letterSpacing="tight">
              Statutory Information
            </Text>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} fontWeight="600" mt={0.5}>
              Manage government IDs and legal compliance details.
            </Text>
          </Box>
        </HStack>

        <Box 
          p={{ base: 5, md: 8 }} 
          borderWidth="1px" 
          borderColor={cardBorder} 
          borderRadius="3xl" 
          bg={useColorModeValue("white", "whiteAlpha.50")} 
          boxShadow={useColorModeValue("0 4px 20px rgba(0,0,0,0.03)", "0 4px 20px rgba(0,0,0,0.2)")}
        >
          <VStack spacing={6} align="stretch">
            <Box>
              <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                Aadhar Details
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><IdCard size={14} /><span>Aadhar Number</span></HStack>
                  </FormLabel>
                  <Input
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    placeholder="12-digit Aadhar number"
                    maxLength={12}
                    variant="outline"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><IdCard size={14} /><span>Name as per Aadhar</span></HStack>
                  </FormLabel>
                  <Input
                    name="nameAsPerAadhar"
                    value={formData.nameAsPerAadhar}
                    onChange={handleChange}
                    placeholder="Exact name on Aadhar"
                    variant="outline"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider borderColor={cardBorder} />

            <Box>
              <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                PAN Details
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><CreditCard size={14} /><span>PAN Number</span></HStack>
                  </FormLabel>
                  <Input
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="10-character PAN"
                    maxLength={10}
                    textTransform="uppercase"
                    variant="outline"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><CreditCard size={14} /><span>Name as per PAN</span></HStack>
                  </FormLabel>
                  <Input
                    name="nameAsPerPan"
                    value={formData.nameAsPerPan}
                    onChange={handleChange}
                    placeholder="Exact name on PAN"
                    variant="outline"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider borderColor={cardBorder} />

            <Box>
              <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                Other Statutory Info
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><Globe size={14} /><span>Nationality</span></HStack>
                  </FormLabel>
                  <Select 
                    name="nationality" 
                    value={formData.nationality} 
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  >
                    <option value="indian">Indian</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </Box>
          </VStack>
        </Box>

        <Box display="flex" justifyContent="flex-end" pt={4} pb={6}>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit} 
            isLoading={isSaving} 
            px={10} 
            borderRadius="full" 
            size="lg" 
            fontSize="md" 
            fontWeight="bold"
            boxShadow="0 4px 14px 0 rgba(0, 118, 255, 0.39)"
            _hover={{ transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0, 118, 255, 0.23)" }}
            transition="all 0.2s"
          >
            Save Statutory Details
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default StatutoryDetailsForm;
