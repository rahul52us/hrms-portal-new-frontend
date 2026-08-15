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
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import stores from "../../../../store/stores";
import { FiStar, FiLayers, FiClock, FiPlus, FiZap, FiX } from "react-icons/fi";

type Props = {
  data: any;
  onSave: (payload: any) => void;
  isSaving: boolean;
};

const PillTag = ({ label, onRemove, colorScheme }: any) => {
  const map: any = {
    blue:  { bg: "blue.50",  border: "blue.200",  text: "blue.600"  },
    green: { bg: "green.50", border: "green.200", text: "green.600" },
  };
  const c = map[colorScheme] || map.blue;
  return (
    <Flex
      align="center"
      gap={1}
      bg={c.bg}
      border="1px solid"
      borderColor={c.border}
      borderRadius="full"
      px={2.5}
      py={0.5}
    >
      <Text fontSize="xs" fontWeight="600" color={c.text}>{label}</Text>
      <Icon as={FiX} boxSize={2.5} color={c.text} cursor="pointer" opacity={0.5} _hover={{ opacity: 1 }} onClick={onRemove} />
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

  const bg     = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted  = useColorModeValue("gray.400", "gray.500");
  const head   = useColorModeValue("gray.700", "gray.200");

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

  // Only clean up skills when user actively changes domains (not on initial master data load)
  useEffect(() => {
    if (!masterLoaded) return; // don't run before master data is ready
    setSkills((prev) => prev.filter((s) => availableSkills.includes(s)));
  }, [coreDomainAreas]); // only trigger when user changes domains, not when availableSkills changes

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

  // Shared card wrapper
  const Card = ({ children }: any) => (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" boxShadow="xs" overflow="hidden">
      {children}
    </Box>
  );

  const CardHeader = ({ icon, title, colorScheme, badge }: any) => {
    const map: any = {
      blue:  { ic: "blue.500",  ibg: "blue.50",  tc: "blue.600"  },
      green: { ic: "green.500", ibg: "green.50", tc: "green.600" },
    };
    const c = map[colorScheme] || map.blue;
    return (
      <HStack px={4} py={2.5} spacing={2} borderBottomWidth="1px" borderColor={border} bg={useColorModeValue("gray.50", "gray.750")}>
        <Box p={1} borderRadius="md" bg={c.ibg}>
          <Icon as={icon} color={c.ic} boxSize={3} />
        </Box>
        <Text fontSize="xs" fontWeight="700" color={c.tc}>{title}</Text>
        {badge > 0 && (
          <Badge colorScheme={colorScheme} borderRadius="full" px={1.5} fontSize="9px" fontWeight="700">{badge}</Badge>
        )}
      </HStack>
    );
  };

  return (
    <VStack spacing={3} align="stretch">

      {/* ── Stat Row ── */}
      <SimpleGrid columns={3} spacing={3}>
        {/* Domains */}
        <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" boxShadow="xs" p={3}>
          <HStack spacing={2} mb={1.5}>
            <Box p={1} borderRadius="md" bg="blue.50"><Icon as={FiLayers} color="blue.500" boxSize={3} /></Box>
            <Text fontSize="9px" fontWeight="700" color={muted} textTransform="uppercase" letterSpacing="wide">Domains</Text>
          </HStack>
          <Text fontSize="xl" fontWeight="800" color={head} lineHeight="1">{coreDomainAreas.length}</Text>
        </Box>

        {/* Skills */}
        <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" boxShadow="xs" p={3}>
          <HStack spacing={2} mb={1.5}>
            <Box p={1} borderRadius="md" bg="green.50"><Icon as={FiZap} color="green.500" boxSize={3} /></Box>
            <Text fontSize="9px" fontWeight="700" color={muted} textTransform="uppercase" letterSpacing="wide">Skills</Text>
          </HStack>
          <Text fontSize="xl" fontWeight="800" color={head} lineHeight="1">{skills.length}</Text>
        </Box>

        {/* Experience */}
        <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" boxShadow="xs" p={3}>
          <HStack spacing={2} mb={2}>
            <Box p={1} borderRadius="md" bg="orange.50"><Icon as={FiClock} color="orange.500" boxSize={3} /></Box>
            <Text fontSize="9px" fontWeight="700" color={muted} textTransform="uppercase" letterSpacing="wide">Experience</Text>
          </HStack>
          <HStack spacing={1} align="baseline">
            <Input
              type="number"
              value={totalYearsOfExperience}
              onChange={(e) => setTotalYearsOfExperience(e.target.value)}
              placeholder="–"
              step="0.5"
              min={0}
              variant="flushed"
              fontWeight="800"
              fontSize="xl"
              color={head}
              w="50px"
              p={0}
              borderColor="orange.200"
              _focus={{ borderColor: "orange.400" }}
              _placeholder={{ color: useColorModeValue("gray.300", "gray.600"), fontWeight: "800" }}
            />
            <Text fontSize="xs" fontWeight="600" color="orange.400">yrs</Text>
          </HStack>
        </Box>



      </SimpleGrid>

      {/* ── Domain Areas ── */}
      <Card>
        <CardHeader icon={FiLayers} title="Domain Areas" colorScheme="blue" badge={coreDomainAreas.length} />
        <Box px={4} py={3}>
          <HStack spacing={2} mb={2}>
            <Select
              size="sm"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              placeholder="Select domain..."
              borderRadius="lg"
              flex={1}
              fontSize="xs"
            >
              {masterCoreDomains
                .filter((d: string) => !coreDomainAreas.includes(d))
                .map((d: string) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Button size="sm" colorScheme="blue" leftIcon={<FiPlus size={12} />} borderRadius="lg" px={3} fontSize="xs" onClick={addDomain} isDisabled={!selectedDomain} flexShrink={0}>
              Add
            </Button>
          </HStack>
          {coreDomainAreas.length === 0
            ? <Text fontSize="xs" color={muted}>No domains added.</Text>
            : <Flex gap={1.5} wrap="wrap">
                {coreDomainAreas.map((d) => (
                  <PillTag key={d} label={d} colorScheme="blue" onRemove={() => setCoreDomainAreas(coreDomainAreas.filter((x) => x !== d))} />
                ))}
              </Flex>
          }
        </Box>
      </Card>

      {/* ── Skills ── */}
      <Card>
        <CardHeader icon={FiZap} title="Skills" colorScheme="green" badge={skills.length} />
        <Box px={4} py={3} opacity={coreDomainAreas.length === 0 ? 0.5 : 1} transition="opacity 0.2s">
          <HStack spacing={2} mb={2}>
            <Select
              size="sm"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              placeholder={coreDomainAreas.length === 0 ? "Select domains first..." : "Select skill..."}
              isDisabled={coreDomainAreas.length === 0}
              borderRadius="lg"
              flex={1}
              fontSize="xs"
            >
              {availableSkills
                .filter((s: string) => !skills.includes(s))
                .map((s: string) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Button size="sm" colorScheme="green" leftIcon={<FiPlus size={12} />} borderRadius="lg" px={3} fontSize="xs" onClick={addSkill} isDisabled={!selectedSkill || coreDomainAreas.length === 0} flexShrink={0}>
              Add
            </Button>
          </HStack>
          {skills.length === 0
            ? <Text fontSize="xs" color={muted}>{coreDomainAreas.length === 0 ? "Add domains first." : "No skills added."}</Text>
            : <Flex gap={1.5} wrap="wrap">
                {skills.map((s) => (
                  <PillTag key={s} label={s} colorScheme="green" onRemove={() => setSkills(skills.filter((x) => x !== s))} />
                ))}
              </Flex>
          }
        </Box>
      </Card>

      {/* ── Save ── */}
      <Flex justify="flex-end" pt={1}>
        <Button
          leftIcon={<FiStar size={14} />}
          colorScheme="blue"
          borderRadius="lg"
          size="sm"
          px={8}
          fontWeight="700"
          fontSize="sm"
          bgGradient="linear(to-r, blue.500, blue.400)"
          _hover={{ bgGradient: "linear(to-r, blue.600, blue.500)", transform: "translateY(-1px)", boxShadow: "md" }}
          transition="all 0.15s"
          onClick={() => onSave({ totalYearsOfExperience, coreDomainAreas, skills })}
          isLoading={isSaving}
          loadingText="Saving..."
        >
          Save Skills
        </Button>
      </Flex>

    </VStack>
  );
});

export default SkillsMappingForm;
