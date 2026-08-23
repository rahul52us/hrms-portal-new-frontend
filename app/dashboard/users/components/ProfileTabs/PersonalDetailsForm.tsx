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
  Stack,
  Divider,
  InputGroup,
  InputLeftAddon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import * as yup from "yup";
import { FormErrorMessage } from "@chakra-ui/react";
import { User, Calendar, Users, Briefcase, Image as ImageIcon, Trash2 } from "lucide-react";
import CustomInput from "../../../../component/config/component/customInput/CustomInput";
import stores from "@/app/store/stores";

type Props = {
  data: any;
  user?: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const PersonalDetailsForm = observer(({ data, user, onSave, isSaving }: Props) => {
  const [errors, setErrors] = useState<any>({});

  const schema = yup.object().shape({
    employeeNumber: yup.string().required("Employee Number is required"),
    fullName: yup.string().required("Full Name is required"),
    designation: yup.string().required("Designation is required"),
    department: yup.string().required("Department is required"),
    officeLocation: yup.string().required("Location is required"),
    dateOfBirth: yup.string().required("Date of Birth is required"),
    gender: yup.string().required("Gender is required"),
    bloodGroup: yup.string().required("Blood Group is required"),
    religion: yup.string().required("Religion is required"),
    nationality: yup.string().required("Nationality is required"),
    knownAs: yup.string().required("Known As is required"),
    fatherHusbandName: yup.string().required("Father/Husband Name is required"),
    maritalStatus: yup.string().required("Marital Status is required"),
    mobileNumber: yup.string().required("Mobile Number is required"),
    email: yup.string().email("Invalid email").required("Work Email is required"),
    personalEmail: yup.string().email("Invalid email").required("Personal Email is required"),
    emergencyContactName: yup.string().required("Emergency Contact Name is required"),
    emergencyContactNumber: yup.string().required("Emergency Contact Number is required"),
    address: yup.string().required("Street Address is required"),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    country: yup.string().required("Country is required"),
    postalCode: yup.string().required("Pincode is required"),
  });

  const [formData, setFormData] = useState<any>({
    pic: { file: null, url: "", isDeleted: 0, isAdd: 0 },
    employeeNumber: "",
    designation: "",
    fullName: "",
    knownAs: "",
    maritalStatus: "",
    anniversaryDate: "",
    fatherHusbandName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    religion: "",
    nationality: "",
    mobileNumber: "",
    email: "",
    personalEmail: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  // Premium color tokens
  const cardBorder = useColorModeValue("gray.400", "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.800", "gray.300");
  const headerGradient = useColorModeValue("linear(to-r, blue.600, purple.600)", "linear(to-r, blue.300, purple.300)");
  const sectionTitleColor = useColorModeValue("blue.600", "blue.300");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    const cId = user?.company?._id || user?.companyId || stores.companyStore.getActiveCompanyId();
    if (!stores.departmentStore.departments || stores.departmentStore.departments.length === 0) {
      stores.departmentStore.fetchDepartments(cId, 1, 100);
    }
    if (!stores.locationStore.locations || stores.locationStore.locations.length === 0) {
      stores.locationStore.fetchLocations(cId, 1, 100);
    }
  }, [user]);

  useEffect(() => {
    if (data?.personalDetails || user) {
      console.log("DEBUG USER DEPT/LOC", { 
        department: user?.department, 
        loc: user?.officeLocation 
      });
      const genderStringMap: Record<number, string> = { 1: "male", 2: "female", 3: "other" };
      setFormData({
        pic: user?.pic ? { ...user.pic, file: null, isAdd: 0, isDeleted: 0, url: user.pic.url || "" } : { file: null, isAdd: 0, isDeleted: 0, url: "" },
        employeeNumber: user?.employeeNumber || user?.code || "",
        designation: user?.designation || "",
        department: (user?.department?._id || user?.department || "").toString(),
        officeLocation: (user?.officeLocation?._id || user?.officeLocation || "").toString(),
        fullName: user?.name || "",
        knownAs: data?.personalDetails?.knownAs || "",
        maritalStatus: data?.personalDetails?.maritalStatus || "",
        anniversaryDate: data?.personalDetails?.anniversaryDate
          ? new Date(data.personalDetails.anniversaryDate).toISOString().split("T")[0]
          : "",
        fatherHusbandName: data?.personalDetails?.fatherHusbandName || "",
        dateOfBirth: user?.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user?.gender ? genderStringMap[user.gender] || "" : "",
        bloodGroup: data?.personalDetails?.bloodGroup || "",
        religion: data?.personalDetails?.religion || "",
        nationality: data?.personalDetails?.nationality || "",
        mobileNumber: user?.mobileNumber || "",
        email: user?.username || "",
        personalEmail: data?.personalDetails?.personalEmail || "",
        emergencyContactName: data?.personalDetails?.emergencyContactName || "",
        emergencyContactNumber: data?.personalDetails?.emergencyContactNumber || "",
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "",
        country: user?.country || "",
        postalCode: user?.postalCode || "",
      });
    }
  }, [data, user, user?.pic?.url]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      
      const payload = { ...formData };
      if (!payload.department) delete payload.department;
      if (!payload.officeLocation) delete payload.officeLocation;

      console.log("DEBUG SUBMIT PAYLOAD", payload);
      onSave(payload);
    } catch (err: any) {
      console.error("Validation error:", err);
      const newErrors: any = {};
      if (err.inner && err.inner.length > 0) {
        err.inner.forEach((error: any) => {
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
      } else if (err.path) {
        newErrors[err.path] = err.message;
      }
      setErrors(newErrors);
    }
  };

  console.log("DEBUG RENDER:", {
    userDept: user?.department,
    formDataDept: formData.department,
    departmentsLength: stores.departmentStore.departments?.length,
  });

  return (
    <Box as="form" onSubmit={handleSubmit} noValidate>
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
              {formData.pic?.url || formData.pic?.file ? (
                <Stack 
                  direction={{ base: "column", sm: "row" }}
                  spacing={6} 
                  align={{ base: "center", sm: "center" }} 
                  bg={useColorModeValue("gray.50", "whiteAlpha.50")} 
                  p={{ base: 4, sm: 6 }} 
                  borderRadius="2xl" 
                  border="1px dashed" 
                  borderColor={useColorModeValue("gray.400", "gray.600")}
                  textAlign={{ base: "center", sm: "left" }}
                >
                  <Box
                    borderRadius="full"
                    overflow="hidden"
                    border="4px solid"
                    borderColor={useColorModeValue("white", "gray.700")}
                    boxShadow="md"
                    w={{ base: "100px", sm: "120px" }}
                    h={{ base: "100px", sm: "120px" }}
                    flexShrink={0}
                  >
                    <img
                      src={formData.pic.file ? URL.createObjectURL(formData.pic.file) : (formData.pic.url ? `${formData.pic.url}${formData.pic.url.includes('?') ? '&' : '?'}t=${user?.updatedAt ? new Date(user.updatedAt).getTime() : Date.now()}` : "")}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <VStack align={{ base: "center", sm: "start" }} spacing={2}>
                    <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="800" color={sectionTitleColor} letterSpacing="tight">
                      Profile Picture
                    </Text>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color={muted} fontWeight="500">
                      A picture helps your team recognize you.
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      borderRadius="lg"
                      borderWidth="2px"
                      leftIcon={<Trash2 size={16} />}
                      mt={2}
                      _hover={{ bg: "red.50" }}
                      _dark={{ _hover: { bg: "red.900" } }}
                      onClick={() =>
                        setFormData((p: any) => ({
                          ...p,
                          pic: { file: null, url: "", isDeleted: 1, isAdd: 0 },
                        }))
                      }
                    >
                      Remove Photo
                    </Button>
                  </VStack>
                </Stack>
              ) : (
                <Box>
                  <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                    Profile Image
                  </Text>
                  <CustomInput
                    type="file-drag"
                    name="pic"
                    accept="image/*"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFormData((p: any) => ({
                        ...p,
                        pic: { file, url: "", isDeleted: 0, isAdd: 1 },
                      }));
                    }}
                  />
                </Box>
              )}
            </Box>

            <Divider borderColor={cardBorder} />

            <Box>
              <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                Identity & Role
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isInvalid={!!errors.employeeNumber} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Employee Number</span>
                  </FormLabel>
                  <InputGroup size="lg" borderRadius="xl" overflow="hidden">
                    <InputLeftAddon 
                      fontWeight="700" 
                      bg={useColorModeValue("gray.50", "whiteAlpha.100")}
                      border="1px solid"
                      borderColor={useColorModeValue("gray.300", "whiteAlpha.300")}
                      borderRight="none"
                    >
                      {`${user?.companyCode || user?.company?.companyCode || "COMPANY"}-`}
                    </InputLeftAddon>
                    <Input
                      name="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={(e) => {
                        const rawValue = e.target.value.toUpperCase();
                        const cCode = user?.companyCode || user?.company?.companyCode;
                        const prefix = cCode ? `${cCode.toUpperCase()}-` : "";
                        const employeeNumber = prefix && rawValue.startsWith(prefix) ? rawValue.slice(prefix.length) : rawValue;
                        setFormData((p: any) => ({ ...p, employeeNumber }));
                        if (errors.employeeNumber) {
                          setErrors((prev: any) => ({ ...prev, employeeNumber: undefined }));
                        }
                      }}
                      placeholder="001"
                      maxLength={40}
                      textTransform="uppercase"
                      variant="outline"
                      bg={useColorModeValue("white", "whiteAlpha.50")}
                      _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                      fontSize="sm"
                      borderLeftRadius="none"
                    />
                  </InputGroup>
                {errors.employeeNumber && <FormErrorMessage>{errors.employeeNumber}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.fullName} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><User size={14} /><span>Full Name</span></HStack>
                  </FormLabel>
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.fullName && <FormErrorMessage>{errors.fullName}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.designation} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><Briefcase size={14} /><span>Designation</span></HStack>
                  </FormLabel>
                  <Input
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Designation"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.designation && <FormErrorMessage>{errors.designation}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.department} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><Briefcase size={14} /><span>Department</span></HStack>
                  </FormLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  >
                    <option value="">Select department</option>
                    {stores.departmentStore.departments?.map((dept: any) => (
                      <option key={dept._id} value={dept._id}>{dept.departmentName}</option>
                    ))}
                  </Select>
                {errors.department && <FormErrorMessage>{errors.department}</FormErrorMessage>}</FormControl>
                
                <FormControl isInvalid={!!errors.officeLocation} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><Briefcase size={14} /><span>Location</span></HStack>
                  </FormLabel>
                  <Select
                    name="officeLocation"
                    value={formData.officeLocation}
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  >
                    <option value="">Select location</option>
                    {stores.locationStore.locations?.map((loc: any) => (
                      <option key={loc._id} value={loc._id}>{loc.name}</option>
                    ))}
                  </Select>
                {errors.officeLocation && <FormErrorMessage>{errors.officeLocation}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.dateOfBirth} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><Calendar size={14} /><span>Date of Birth</span></HStack>
                  </FormLabel>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.dateOfBirth && <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.gender} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><User size={14} /><span>Gender</span></HStack>
                  </FormLabel>
                  <Select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                {errors.gender && <FormErrorMessage>{errors.gender}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.bloodGroup} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><User size={14} /><span>Blood Group</span></HStack>
                  </FormLabel>
                  <Select 
                    name="bloodGroup" 
                    value={formData.bloodGroup} 
                    onChange={handleChange}
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  >
                    <option value="">Select group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </Select>
                {errors.bloodGroup && <FormErrorMessage>{errors.bloodGroup}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.religion} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><User size={14} /><span>Religion</span></HStack>
                  </FormLabel>
                  <Input
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    placeholder="Religion"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.religion && <FormErrorMessage>{errors.religion}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.nationality} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><User size={14} /><span>Nationality</span></HStack>
                  </FormLabel>
                  <Input
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="Nationality"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.nationality && <FormErrorMessage>{errors.nationality}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.knownAs} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><User size={14} /><span>Known As</span></HStack>
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
                {errors.knownAs && <FormErrorMessage>{errors.knownAs}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.fatherHusbandName} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><Users size={14} /><span>Father/Husband Name</span></HStack>
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
                {errors.fatherHusbandName && <FormErrorMessage>{errors.fatherHusbandName}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.maritalStatus} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <HStack spacing={1.5} display="inline-flex"><Users size={14} /><span>Marital Status</span></HStack>
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
                {errors.maritalStatus && <FormErrorMessage>{errors.maritalStatus}</FormErrorMessage>}</FormControl>

                {formData.maritalStatus === "married" && (
                  <FormControl isInvalid={!!errors.anniversaryDate} isRequired>
                    <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                      <HStack spacing={1.5} display="inline-flex"><Calendar size={14} /><span>Anniversary Date</span></HStack>
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
                  {errors.anniversaryDate && <FormErrorMessage>{errors.anniversaryDate}</FormErrorMessage>}</FormControl>
                )}
              </SimpleGrid>
            </Box>

            <Divider borderColor={cardBorder} />

            <Box>
              <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                Contact Information
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isInvalid={!!errors.mobileNumber} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Mobile Number</span>
                  </FormLabel>
                  <Input
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="Mobile Number"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.mobileNumber && <FormErrorMessage>{errors.mobileNumber}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Work Email</span>
                  </FormLabel>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Work Email"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.personalEmail} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Personal Email</span>
                  </FormLabel>
                  <Input
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    placeholder="Personal Email"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.personalEmail && <FormErrorMessage>{errors.personalEmail}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.emergencyContactName} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Emergency Contact Name</span>
                  </FormLabel>
                  <Input
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Contact Name"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.emergencyContactName && <FormErrorMessage>{errors.emergencyContactName}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.emergencyContactNumber} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Emergency Contact Number</span>
                  </FormLabel>
                  <Input
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                    placeholder="Contact Number"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.emergencyContactNumber && <FormErrorMessage>{errors.emergencyContactNumber}</FormErrorMessage>}</FormControl>
              </SimpleGrid>
            </Box>

            <Divider borderColor={cardBorder} />

            <Box>
              <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest" mb={4}>
                Address
              </Text>
              <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                <FormControl isInvalid={!!errors.address} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Street Address</span>
                  </FormLabel>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Address"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.address && <FormErrorMessage>{errors.address}</FormErrorMessage>}</FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mt={4}>
                <FormControl isInvalid={!!errors.city} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>City</span>
                  </FormLabel>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.city && <FormErrorMessage>{errors.city}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.state} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>State</span>
                  </FormLabel>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.state && <FormErrorMessage>{errors.state}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.country} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Country</span>
                  </FormLabel>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.country && <FormErrorMessage>{errors.country}</FormErrorMessage>}</FormControl>
                <FormControl isInvalid={!!errors.postalCode} isRequired>
                  <FormLabel fontSize="xs" fontWeight="700" color={labelColor} textTransform="uppercase" letterSpacing="wide">
                    <span>Pincode</span>
                  </FormLabel>
                  <Input
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    variant="outline"
                    _focus={{ borderColor: sectionTitleColor, boxShadow: `0 0 0 1px var(--chakra-colors-blue-400)` }}
                    borderRadius="xl"
                    size="lg"
                    fontSize="sm"
                  />
                {errors.postalCode && <FormErrorMessage>{errors.postalCode}</FormErrorMessage>}</FormControl>
              </SimpleGrid>
            </Box>

          </VStack>
        </Box>

        <Box display="flex" justifyContent="flex-end" pt={2} pb={6}>
          <Button 
            colorScheme="blue" 
            type="submit" 
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
});

export default PersonalDetailsForm;
