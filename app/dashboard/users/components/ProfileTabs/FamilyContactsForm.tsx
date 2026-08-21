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
  Switch,
  IconButton,
  Flex,
  useColorModeValue,
  Divider,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Trash, Plus, User, Users, Phone, MapPin, Calendar, Heart, Shield, Briefcase, FileText } from "lucide-react";

type Props = {
  data: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const FamilyContactsForm = ({ data, onSave, isSaving }: Props) => {
  const [contacts, setContacts] = useState<any[]>([]);

  // Premium color tokens
  const cardBg = useColorModeValue("white", "whiteAlpha.50");
  const cardBorder = useColorModeValue("gray.400", "whiteAlpha.100");
  const inputBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const inputHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.800", "gray.300");
  const headerGradient = useColorModeValue("linear(to-r, blue.600, purple.600)", "linear(to-r, blue.300, purple.300)");
  const sectionTitleColor = useColorModeValue("blue.600", "blue.300");

  useEffect(() => {
    if (data?.familyContacts && Array.isArray(data.familyContacts)) {
      setContacts(
        data.familyContacts.map((contact: any) => ({
          ...contact,
          dateOfBirth: contact.dateOfBirth
            ? new Date(contact.dateOfBirth).toISOString().split("T")[0]
            : "",
        }))
      );
    } else {
      setContacts([]);
    }
  }, [data]);

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      {
        name: "",
        relationship: "",
        address: "",
        telephone: "",
        mobile: "",
        dateOfBirth: "",
        isResidingWithEmployee: false,
        isPfNominee: false,
        isMedicalInsuranceCovered: false,
        comments: "",
      },
    ]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: finalValue,
    };
    setContacts(updatedContacts);
  };

  const handleSubmit = () => {
    onSave({ familyContacts: contacts });
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Flex 
          direction={{ base: "column", sm: "row" }} 
          justify="space-between" 
          align={{ base: "stretch", sm: "center" }} 
          gap={4}
        >
          <HStack spacing={4} align="center">
            <Box display="inline-flex" p={2.5} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/30")} color={sectionTitleColor} boxShadow="sm">
              <Users size={20} />
            </Box>
            <Box>
              <Text fontSize="lg" fontWeight="800" bgGradient={headerGradient} bgClip="text" letterSpacing="tight">
                Family & Emergency Contacts
              </Text>
              <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} fontWeight="600" mt={0.5}>
                Manage family details, emergency numbers, and nominations.
              </Text>
            </Box>
          </HStack>
          <Button 
            colorScheme="blue" 
            leftIcon={<Plus size={18} />} 
            onClick={handleAddContact}
            borderRadius="full"
            px={6}
            fontWeight="bold"
            w={{ base: "full", sm: "auto" }}
            boxShadow="0 4px 14px 0 rgba(0, 118, 255, 0.39)"
            _hover={{ transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0, 118, 255, 0.23)" }}
            transition="all 0.2s"
          >
            Add Contact
          </Button>
        </Flex>

        {contacts.length === 0 ? (
          <Box py={16} textAlign="center" bg={cardBg} borderRadius="3xl" borderWidth="1px" borderColor={cardBorder} borderStyle="dashed">
            <Box display="inline-flex" p={4} borderRadius="full" bg={useColorModeValue("blue.50", "blue.900/30")} color="blue.500" mb={4}>
              <Heart size={32} />
            </Box>
            <Text color={useColorModeValue("gray.800", "white")} fontSize="lg" fontWeight="bold">
              No family contacts yet
            </Text>
            <Text fontSize="sm" color={labelColor} mt={2} mb={6} maxW="sm" mx="auto">
              Add emergency contacts to ensure we can reach someone in case of an emergency.
            </Text>
            <Button colorScheme="blue" variant="outline" leftIcon={<Plus size={16} />} onClick={handleAddContact} borderRadius="full" px={6}>
              Add First Contact
            </Button>
          </Box>
        ) : (
          <VStack spacing={8} align="stretch">
            {contacts.map((contact, index) => (
              <Box 
                key={index} 
                p={{ base: 5, md: 8 }} 
                borderWidth="1px" 
                borderColor={cardBorder} 
                borderRadius="3xl" 
                bg={cardBg} 
                boxShadow={useColorModeValue("0 4px 20px rgba(0,0,0,0.03)", "0 4px 20px rgba(0,0,0,0.2)")}
                position="relative"
                overflow="hidden"
              >
                
                <Flex justify="space-between" align="center" mb={6}>
                  <HStack spacing={3}>
                    <Flex align="center" justify="center" w={10} h={10} borderRadius="xl" bg={useColorModeValue("blue.50", "blue.900/40")} color="blue.500">
                      <User size={20} />
                    </Flex>
                    <Box>
                      <Text fontSize="xs" fontWeight="800" color="blue.500" textTransform="uppercase" letterSpacing="widest">
                        Contact {index + 1}
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color={useColorModeValue("gray.800", "white")}>
                        {contact.name || "New Contact"}
                      </Text>
                    </Box>
                  </HStack>
                  <IconButton
                    aria-label="Remove contact"
                    icon={<Trash size={18} />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    borderRadius="full"
                    onClick={() => handleRemoveContact(index)}
                    _hover={{ bg: useColorModeValue("red.50", "red.900/30"), color: "red.500" }}
                  />
                </Flex>
                
                <VStack spacing={6} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">Full Name</FormLabel>
                      <Input
                        name="name"
                        value={contact.name}
                        onChange={(e) => handleChange(index, e)}
                        placeholder="E.g. Jane Doe"
                        variant="outline"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        borderRadius="xl"
                        size="lg"
                        fontSize="sm"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">Relationship</FormLabel>
                      <Select
                        name="relationship"
                        value={contact.relationship}
                        onChange={(e) => handleChange(index, e)}
                        variant="outline"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        borderRadius="xl"
                        size="lg"
                        fontSize="sm"
                      >
                        <option value="">Select relationship...</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="spouse">Spouse</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="brother">Brother</option>
                        <option value="sister">Sister</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                        <HStack spacing={1.5}><Phone size={14} /><span>Mobile Number</span></HStack>
                      </FormLabel>
                      <Input
                        name="mobile"
                        value={contact.mobile}
                        onChange={(e) => handleChange(index, e)}
                        placeholder="+1 234 567 8900"
                        variant="outline"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        borderRadius="xl"
                        size="lg"
                        fontSize="sm"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                        <HStack spacing={1.5}><Phone size={14} /><span>Telephone</span></HStack>
                      </FormLabel>
                      <Input
                        name="telephone"
                        value={contact.telephone}
                        onChange={(e) => handleChange(index, e)}
                        placeholder="Landline (optional)"
                        variant="outline"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        borderRadius="xl"
                        size="lg"
                        fontSize="sm"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                        <HStack spacing={1.5}><Calendar size={14} /><span>Date of Birth</span></HStack>
                      </FormLabel>
                      <Input
                        type="date"
                        name="dateOfBirth"
                        value={contact.dateOfBirth}
                        onChange={(e) => handleChange(index, e)}
                        variant="outline"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        borderRadius="xl"
                        size="lg"
                        fontSize="sm"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                      <HStack spacing={1.5}><MapPin size={14} /><span>Full Address</span></HStack>
                    </FormLabel>
                    <Input
                      name="address"
                      value={contact.address}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Street, City, Zip Code"
                      variant="outline"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      borderRadius="xl"
                      size="lg"
                      fontSize="sm"
                    />
                  </FormControl>

                  <Box p={5} bg={useColorModeValue("white", "blackAlpha.300")} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder}>
                    <Text fontSize="xs" fontWeight="800" color={labelColor} mb={4} textTransform="uppercase" letterSpacing="widest">
                      Declarations & Coverage
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <Flex align="center" justify="space-between" bg={useColorModeValue("gray.50", "whiteAlpha.50")} p={3} borderRadius="xl" borderWidth="1px" borderColor={cardBorder}>
                        <HStack>
                          <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="blue.500" color="white">
                            <User size={14} />
                          </Flex>
                          <Text fontSize="sm" fontWeight="600">Resides with employee</Text>
                        </HStack>
                        <Switch
                          name="isResidingWithEmployee"
                          isChecked={contact.isResidingWithEmployee}
                          onChange={(e: any) => handleChange(index, e)}
                          colorScheme="blue"
                          size="md"
                        />
                      </Flex>
                      <Flex align="center" justify="space-between" bg={useColorModeValue("gray.50", "whiteAlpha.50")} p={3} borderRadius="xl" borderWidth="1px" borderColor={cardBorder}>
                        <HStack>
                          <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="purple.500" color="white">
                            <Briefcase size={14} />
                          </Flex>
                          <Text fontSize="sm" fontWeight="600">PF Nominee</Text>
                        </HStack>
                        <Switch
                          name="isPfNominee"
                          isChecked={contact.isPfNominee}
                          onChange={(e: any) => handleChange(index, e)}
                          colorScheme="purple"
                          size="md"
                        />
                      </Flex>
                      <Flex align="center" justify="space-between" bg={useColorModeValue("gray.50", "whiteAlpha.50")} p={3} borderRadius="xl" borderWidth="1px" borderColor={cardBorder}>
                        <HStack>
                          <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="green.500" color="white">
                            <Shield size={14} />
                          </Flex>
                          <Text fontSize="sm" fontWeight="600">Medical Insurance</Text>
                        </HStack>
                        <Switch
                          name="isMedicalInsuranceCovered"
                          isChecked={contact.isMedicalInsuranceCovered}
                          onChange={(e: any) => handleChange(index, e)}
                          colorScheme="green"
                          size="md"
                        />
                      </Flex>
                    </SimpleGrid>
                  </Box>
                  
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                      <HStack spacing={1.5}><FileText size={14} /><span>Additional Notes</span></HStack>
                    </FormLabel>
                    <Input
                      name="comments"
                      value={contact.comments}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Any medical conditions, allergies, or other notes"
                      variant="outline"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      borderRadius="xl"
                      size="lg"
                      fontSize="sm"
                    />
                  </FormControl>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}

        {contacts.length > 0 && (
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
              Save Family Contacts
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default FamilyContactsForm;
