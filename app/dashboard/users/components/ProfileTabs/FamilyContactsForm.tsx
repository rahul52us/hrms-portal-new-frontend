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
  Checkbox,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Trash } from "lucide-react";

type Props = {
  data: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const FamilyContactsForm = ({ data, onSave, isSaving }: Props) => {
  const [contacts, setContacts] = useState<any[]>([]);

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
    <Box p={4} borderWidth="1px" borderRadius="xl" bg="white" _dark={{ bg: "gray.800" }}>
      <VStack spacing={6} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text fontSize="lg" fontWeight="semibold">Family & Emergency Contacts</Text>
          <Button size="sm" colorScheme="blue" variant="outline" onClick={handleAddContact}>
            + Add Contact
          </Button>
        </Box>

        {contacts.length === 0 ? (
          <Text color="gray.500" fontStyle="italic" textAlign="center" py={4}>
            No family contacts added yet. Click "+ Add Contact" to begin.
          </Text>
        ) : (
          contacts.map((contact, index) => (
            <Box key={index} p={4} borderWidth="1px" borderRadius="lg" position="relative">
              <IconButton
                aria-label="Remove contact"
                icon={<Trash size={16} />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                position="absolute"
                top={2}
                right={2}
                onClick={() => handleRemoveContact(index)}
              />
              
              <VStack spacing={4} align="stretch" mt={2}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" color="gray.500">Name</FormLabel>
                    <Input
                      name="name"
                      value={contact.name}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Full Name"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.500">Relationship</FormLabel>
                    <Select
                      name="relationship"
                      value={contact.relationship}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="">Select</option>
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

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.500">Mobile</FormLabel>
                    <Input
                      name="mobile"
                      value={contact.mobile}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Mobile number"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.500">Telephone</FormLabel>
                    <Input
                      name="telephone"
                      value={contact.telephone}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Landline (optional)"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.500">Date of Birth</FormLabel>
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={contact.dateOfBirth}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="sm" color="gray.500">Address</FormLabel>
                  <Input
                    name="address"
                    value={contact.address}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Full Address"
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} pt={2}>
                  <Checkbox
                    name="isResidingWithEmployee"
                    isChecked={contact.isResidingWithEmployee}
                    onChange={(e: any) => handleChange(index, e)}
                    colorScheme="blue"
                  >
                    Resides with employee
                  </Checkbox>
                  <Checkbox
                    name="isPfNominee"
                    isChecked={contact.isPfNominee}
                    onChange={(e: any) => handleChange(index, e)}
                    colorScheme="blue"
                  >
                    PF Nominee
                  </Checkbox>
                  <Checkbox
                    name="isMedicalInsuranceCovered"
                    isChecked={contact.isMedicalInsuranceCovered}
                    onChange={(e: any) => handleChange(index, e)}
                    colorScheme="blue"
                  >
                    Medical Insurance Covered
                  </Checkbox>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.500">Comments</FormLabel>
                  <Input
                    name="comments"
                    value={contact.comments}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Additional notes"
                  />
                </FormControl>
              </VStack>
            </Box>
          ))
        )}

        {contacts.length > 0 && (
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSaving} px={8}>
              Save Family Contacts
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default FamilyContactsForm;
