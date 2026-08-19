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
  useColorModeValue,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { User, Calendar, Users, Briefcase } from "lucide-react";

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

  // Premium color tokens
  const cardBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.800", "gray.300");
  const headerGradient = useColorModeValue("linear(to-r, blue.600, purple.600)", "linear(to-r, blue.300, purple.300)");
  const sectionTitleColor = useColorModeValue("blue.600", "blue.300");

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
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack spacing={4} align="center">
          <Box display="inline-flex" p={2.5} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/30")} color={sectionTitleColor} boxShadow="sm">
            <User size={20} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="800" bgGradient={headerGradient} bgClip="text" letterSpacing="tight">
              Personal Information
            </Text>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} fontWeight="600" mt={0.5}>
              Manage basic identity and relationship details.
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
                Identity
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><User size={14} /><span>First Name</span></HStack>
                  </FormLabel>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><User size={14} /><span>Middle Name</span></HStack>
                  </FormLabel>
                  <Input
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Middle name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><User size={14} /><span>Last Name</span></HStack>
                  </FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><User size={14} /><span>Known As</span></HStack>
                  </FormLabel>
                  <Input
                    name="knownAs"
                    value={formData.knownAs}
                    onChange={handleChange}
                    placeholder="Preferred name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><Users size={14} /><span>Father/Husband Name</span></HStack>
                  </FormLabel>
                  <Input
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleChange}
                    placeholder="Father/Husband Name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
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
                Relationships
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5}><Users size={14} /><span>Marital Status</span></HStack>
                  </FormLabel>
                  <Select 
                    name="maritalStatus" 
                    value={formData.maritalStatus} 
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  >
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
                    <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                      <HStack spacing={1.5}><Calendar size={14} /><span>Anniversary Date</span></HStack>
                    </FormLabel>
                    <Input
                      type="date"
                      name="anniversaryDate"
                      value={formData.anniversaryDate}
                      onChange={handleChange}
                      variant="outline"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      borderRadius="xl"
                      size="lg"
                      fontSize="sm"
                    />
                  </FormControl>
                )}
              </SimpleGrid>
            </Box>
          </VStack>
        </Box>

        <Box display="flex" justifyContent="flex-end" pt={2} pb={6}>
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
            Save Personal Details
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default PersonalDetailsForm;
