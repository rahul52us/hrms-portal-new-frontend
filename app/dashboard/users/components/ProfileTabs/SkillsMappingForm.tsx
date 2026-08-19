"use client";
import {
  Box,
  Button,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Flex,
  Icon,
  useColorModeValue,
  Badge,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import stores from "../../../../store/stores";
import { Star, Layers, Clock, Plus, Zap, X, Trophy } from "lucide-react";

type Props = {
  data: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const PillTag = ({ label, onRemove, colorScheme }: any) => {
  const map: any = {
    blue:  { bg: useColorModeValue("blue.50", "blue.900/30"),  border: useColorModeValue("blue.200", "blue.500/30"),  text: useColorModeValue("blue.600", "blue.300")  },
    green: { bg: useColorModeValue("green.50", "green.900/30"), border: useColorModeValue("green.200", "green.500/30"), text: useColorModeValue("green.600", "green.300") },
  };
  const c = map[colorScheme] || map.blue;
  return (
    <Flex
      align="center"
      gap={2}
      bg={c.bg}
      border="1px solid"
      borderColor={c.border}
      borderRadius="full"
      px={3}
      py={1}
      boxShadow="sm"
    >
      <Text fontSize="xs" fontWeight="700" color={c.text}>{label}</Text>
      <Box as="button" onClick={onRemove} opacity={0.6} _hover={{ opacity: 1, transform: "scale(1.1)" }} transition="all 0.2s" color={c.text} display="flex">
        <X size={14} />
      </Box>
    </Flex>
  );
};

const SkillsMappingForm = observer(({ data, onSave, isSaving }: Props) => {
  const { companyStore } = stores;

  const [masterCoreDomains, setMasterCoreDomains] = useState<string[]>([]);
  const [masterDomainSkills, setMasterDomainSkills] = useState<any[]>([]);
  const [masterLoaded, setMasterLoaded] = useState(false);

  const [totalYearsOfExperience, setTotalYearsOfExperience] = useState("");
  const [coreDomainAreas, setCoreDomainAreas] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");

  const bg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.800", "gray.300");
  const headerGradient = useColorModeValue("linear(to-r, blue.600, purple.600)", "linear(to-r, blue.300, purple.300)");
  const sectionTitleColor = useColorModeValue("blue.600", "blue.300");
  const cardBg = useColorModeValue("white", "whiteAlpha.50");
  const inputBg = useColorModeValue("white", "whiteAlpha.50");
  const inputHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  // Load master data on mount
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const companyId = companyStore.getActiveCompanyId();
        if (!companyId) return;
        const response = await companyStore.getMasterData({ company: companyId });
        const md = response?.data?.data;
        if (md) {
          setMasterCoreDomains(md.coreDomains || []);
          setMasterDomainSkills(md.domainSkills || []);
          setMasterLoaded(true);
        }
      } catch {}
    };
    loadMaster();
  }, []);

  useEffect(() => {
    if (data?.skills) {
      setTotalYearsOfExperience(data.skills.totalYearsOfExperience ?? "");
      setCoreDomainAreas(data.skills.coreDomainAreas || []);
      setSkills(data.skills.skills || []);
    }
  }, [data]);

  const availableSkills = useMemo(() => {
    let out: string[] = [];
    coreDomainAreas.forEach((d) => {
      const m = masterDomainSkills.find((ds: any) => ds.domain === d);
      if (m?.skills) out = [...out, ...m.skills];
    });
    return Array.from(new Set(out));
  }, [coreDomainAreas, masterDomainSkills]);

  useEffect(() => {
    if (!masterLoaded) return; 
    setSkills((prev) => prev.filter((s) => availableSkills.includes(s)));
  }, [coreDomainAreas]); 

  const addDomain = () => {
    if (selectedDomain && !coreDomainAreas.includes(selectedDomain)) {
      setCoreDomainAreas([...coreDomainAreas, selectedDomain]);
      setSelectedDomain("");
    }
  };

  const addSkill = () => {
    if (selectedSkill && !skills.includes(selectedSkill)) {
      setSkills([...skills, selectedSkill]);
      setSelectedSkill("");
    }
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        
        {/* Header */}
        <HStack spacing={4} align="center">
          <Box display="inline-flex" p={2.5} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/30")} color={sectionTitleColor} boxShadow="sm">
            <Trophy size={20} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="800" bgGradient={headerGradient} bgClip="text" letterSpacing="tight">
              Skills & Expertise
            </Text>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} fontWeight="600" mt={0.5}>
              Map out your professional domains and specific technical skills.
            </Text>
          </Box>
        </HStack>

        {/* ── Stat Row ── */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {/* Domains */}
          <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="3xl" p={5} boxShadow="sm" display="flex" flexDirection="column" justifyContent="space-between">
            <HStack spacing={3} mb={3}>
              <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/40")} color="blue.500">
                <Layers size={16} />
              </Flex>
              <Text fontSize="xs" fontWeight="800" color={useColorModeValue("gray.500", "gray.400")} textTransform="uppercase" letterSpacing="widest">Domains</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="900" color={useColorModeValue("gray.800", "white")} lineHeight="1">{coreDomainAreas.length}</Text>
          </Box>

          {/* Skills */}
          <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="3xl" p={5} boxShadow="sm" display="flex" flexDirection="column" justifyContent="space-between">
            <HStack spacing={3} mb={3}>
              <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg={useColorModeValue("green.50", "green.900/40")} color="green.500">
                <Zap size={16} />
              </Flex>
              <Text fontSize="xs" fontWeight="800" color={useColorModeValue("gray.500", "gray.400")} textTransform="uppercase" letterSpacing="widest">Skills</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="900" color={useColorModeValue("gray.800", "white")} lineHeight="1">{skills.length}</Text>
          </Box>
        </SimpleGrid>

        {/* ── Main Container ── */}
        <Box 
          p={{ base: 5, md: 8 }} 
          borderWidth="1px" 
          borderColor={cardBorder} 
          borderRadius="3xl" 
          bg={cardBg} 
          boxShadow={useColorModeValue("0 4px 20px rgba(0,0,0,0.03)", "0 4px 20px rgba(0,0,0,0.2)")}
        >
          <VStack spacing={8} align="stretch">
            
            {/* Domain Areas */}
            <Box>
              <HStack spacing={3} mb={5}>
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/40")} color={sectionTitleColor}>
                  <Layers size={14} />
                </Flex>
                <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest">
                  Domain Areas
                </Text>
                {coreDomainAreas.length > 0 && (
                  <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="xs" fontWeight="800">{coreDomainAreas.length}</Badge>
                )}
              </HStack>
              
              <Box bg={useColorModeValue("gray.50", "blackAlpha.300")} p={5} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder}>
                <HStack spacing={3} mb={4}>
                  <Select
                    size="lg"
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    placeholder="Select a domain area..."
                    borderRadius="xl"
                    flex={1}
                    fontSize="sm"
                    fontWeight="500"
                    bg={inputBg}
                    _hover={{ bg: inputHoverBg }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    variant="outline"
                  >
                    {masterCoreDomains
                      .filter((d: string) => !coreDomainAreas.includes(d))
                      .map((d: string) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                  <Button 
                    size="lg" 
                    colorScheme="blue" 
                    leftIcon={<Plus size={16} />} 
                    borderRadius="xl" 
                    px={6} 
                    fontSize="sm"
                    fontWeight="bold"
                    onClick={addDomain} 
                    isDisabled={!selectedDomain} 
                    flexShrink={0}
                    boxShadow="sm"
                  >
                    Add
                  </Button>
                </HStack>
                {coreDomainAreas.length === 0
                  ? <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")} fontWeight="500">No domains added yet. Select one from above.</Text>
                  : <Flex gap={2} wrap="wrap">
                      {coreDomainAreas.map((d) => (
                        <PillTag key={d} label={d} colorScheme="blue" onRemove={() => setCoreDomainAreas(coreDomainAreas.filter((x) => x !== d))} />
                      ))}
                    </Flex>
                }
              </Box>
            </Box>

            <Divider borderColor={cardBorder} />

            {/* Skills */}
            <Box opacity={coreDomainAreas.length === 0 ? 0.5 : 1} transition="opacity 0.2s">
              <HStack spacing={3} mb={5}>
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg={useColorModeValue("green.50", "green.900/40")} color={useColorModeValue("green.600", "green.300")}>
                  <Zap size={14} />
                </Flex>
                <Text fontSize="md" fontWeight="800" color={useColorModeValue("green.600", "green.300")} textTransform="uppercase" letterSpacing="widest">
                  Specific Skills
                </Text>
                {skills.length > 0 && (
                  <Badge colorScheme="green" borderRadius="full" px={2} py={0.5} fontSize="xs" fontWeight="800">{skills.length}</Badge>
                )}
              </HStack>

              <Box bg={useColorModeValue("gray.50", "blackAlpha.300")} p={5} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder}>
                <HStack spacing={3} mb={4}>
                  <Select
                    size="lg"
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    placeholder={coreDomainAreas.length === 0 ? "Add domains first to see skills..." : "Select a specific skill..."}
                    isDisabled={coreDomainAreas.length === 0}
                    borderRadius="xl"
                    flex={1}
                    fontSize="sm"
                    fontWeight="500"
                    bg={inputBg}
                    _hover={{ bg: inputHoverBg }}
                    _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px #38a169" }}
                    variant="outline"
                  >
                    {availableSkills
                      .filter((s: string) => !skills.includes(s))
                      .map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Button 
                    size="lg" 
                    colorScheme="green" 
                    leftIcon={<Plus size={16} />} 
                    borderRadius="xl" 
                    px={6} 
                    fontSize="sm"
                    fontWeight="bold"
                    onClick={addSkill} 
                    isDisabled={!selectedSkill || coreDomainAreas.length === 0} 
                    flexShrink={0}
                    boxShadow="sm"
                  >
                    Add
                  </Button>
                </HStack>
                {skills.length === 0
                  ? <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")} fontWeight="500">{coreDomainAreas.length === 0 ? "You must add domains before selecting skills." : "No skills added yet."}</Text>
                  : <Flex gap={2} wrap="wrap">
                      {skills.map((s) => (
                        <PillTag key={s} label={s} colorScheme="green" onRemove={() => setSkills(skills.filter((x) => x !== s))} />
                      ))}
                    </Flex>
                }
              </Box>
            </Box>

            {/* Experience */}
            <Divider borderColor={cardBorder} />
            <Box>
              <HStack spacing={3} mb={5}>
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg={useColorModeValue("orange.50", "orange.900/40")} color="orange.500">
                  <Clock size={14} />
                </Flex>
                <Text fontSize="md" fontWeight="800" color="orange.500" textTransform="uppercase" letterSpacing="widest">
                  Total Experience
                </Text>
              </HStack>
              
              <Box bg={useColorModeValue("gray.50", "blackAlpha.300")} p={5} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder}>
                <HStack spacing={3}>
                  <Input
                    type="number"
                    value={totalYearsOfExperience}
                    onChange={(e) => setTotalYearsOfExperience(e.target.value)}
                    placeholder="Enter years of experience (e.g. 5)"
                    step="0.5"
                    min={0}
                    size="lg"
                    borderRadius="xl"
                    fontSize="sm"
                    fontWeight="500"
                    bg={inputBg}
                    _hover={{ bg: inputHoverBg }}
                    _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #dd6b20" }}
                    variant="outline"
                  />
                  <Text fontSize="sm" fontWeight="700" color="orange.500" whiteSpace="nowrap">Years</Text>
                </HStack>
              </Box>
            </Box>

          </VStack>
        </Box>

        {/* ── Save ── */}
        <Box display="flex" justifyContent="flex-end" pt={2} pb={6}>
          <Button
            leftIcon={<Star size={16} fill="currentColor" />}
            colorScheme="blue"
            borderRadius="full"
            size="lg"
            px={10}
            fontWeight="bold"
            fontSize="md"
            boxShadow="0 4px 14px 0 rgba(0, 118, 255, 0.39)"
            _hover={{ transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0, 118, 255, 0.23)" }}
            transition="all 0.2s"
            onClick={() => onSave({ totalYearsOfExperience, coreDomainAreas, skills })}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Skills & Expertise
          </Button>
        </Box>

      </VStack>
    </Box>
  );
});

export default SkillsMappingForm;
