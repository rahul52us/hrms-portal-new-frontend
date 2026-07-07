"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  useColorModeValue,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Input,
  Progress,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Tag,
  TagLabel,
  TagLeftIcon,
  Wrap,
  WrapItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip,
} from "@chakra-ui/react";
import {
  Building2,
  TrendingUp,
  Users,
  GraduationCap,
  Search,
  BarChart3,
  Briefcase,
  Eye,
  ArrowRight,
  RefreshCw,
  Filter,
  X,
  Calendar,
  Mail,
  UserCheck,
  Activity,
  Award,
  Target,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import stores from "../../../../../store/stores";

const MotionBox = motion(Box);

const CompaniesAnalytics = observer(() => {
  const sectionBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("batches");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [minBatches, setMinBatches] = useState("");
  const [maxBatches, setMaxBatches] = useState("");
  const [minUsers, setMinUsers] = useState("");
  const [maxUsers, setMaxUsers] = useState("");
  const [minGrowth, setMinGrowth] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { companyStore, batchStore } = stores;
  const companies = companyStore.companies?.data || [];
  const batches = batchStore.batches || [];
  const isLoading = companyStore.isLoading;

  // Fetch data on component mount
  useEffect(() => {
    if (companies.length === 0) {
      companyStore.fetchCompanies();
    }
    if (batches.length === 0) {
      batchStore.fetchBatches();
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      companyStore.fetchCompanies(),
      batchStore.fetchBatches()
    ]);
    setIsRefreshing(false);
  };

  const handleViewCompany = (company: any) => {
    setSelectedCompany(company);
    onOpen();
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("batches");
    setDateRange({ start: "", end: "" });
    setMinBatches("");
    setMaxBatches("");
    setMinUsers("");
    setMaxUsers("");
    setMinGrowth("");
  };

  // Calculate company metrics accurately
  const companyMetrics = companies.map((company: any) => {
    const companyBatches = batches.filter((b: any) => b.company?._id === company._id);
    const totalUsers = companyBatches.reduce((sum: number, b: any) => sum + (b.userCount || b.users?.length || 0), 0);
    
    // Get unique courses across all batches
    const allCourses = companyBatches.flatMap((b: any) => b.courses || b.courseIds || []);
    const uniqueCourses = Array.from(new Set(allCourses));
    const totalCourses = uniqueCourses.length;
    
    // Calculate growth based on batch creation over time
    const sortedBatches = [...companyBatches].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let growth = 0;
    if (sortedBatches.length >= 2) {
      const oldestBatches = sortedBatches.slice(0, Math.ceil(sortedBatches.length / 2));
      const newestBatches = sortedBatches.slice(-Math.ceil(sortedBatches.length / 2));
      const oldAvg = oldestBatches.reduce((sum, b) => sum + (b.userCount || 0), 0) / oldestBatches.length;
      const newAvg = newestBatches.reduce((sum, b) => sum + (b.userCount || 0), 0) / newestBatches.length;
      growth = newAvg > 0 ? Math.round(((newAvg - oldAvg) / oldAvg) * 100) : 0;
    } else if (sortedBatches.length === 1) {
      growth = 5; // Default growth for new companies
    }
    
    // Calculate completion rate
    const totalEnrollments = companyBatches.reduce((sum, b) => sum + (b.userCount || 0), 0);
    const completedEnrollments = companyBatches.reduce((sum, b) => sum + (b.completedCount || 0), 0);
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return {
      id: company._id,
      name: company.company_name || company.name || 'Unknown',
      email: company.email || company.contact_email || 'N/A',
      phone: company.phone || company.contact_phone || 'N/A',
      address: company.address || 'Not provided',
      industry: company.industry || 'Not specified',
      batchCount: companyBatches.length,
      courseCount: totalCourses,
      userCount: totalUsers,
      totalEnrolled: totalUsers,
      completedEnrollments,
      completionRate,
      growth: Math.max(0, Math.min(100, growth)), // Cap between 0-100
      status: company.status || 'active',
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      createdBy: company.createdBy?.name || company.createdBy?.username || 'System',
      batches: companyBatches,
    };
  });

  // Apply all filters
  let filteredCompanies = companyMetrics.filter((company: any) => {
    // Search filter
    const matchesSearch = 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    
    // Date range filter (based on company creation date)
    let matchesDateRange = true;
    if (dateRange.start && company.createdAt) {
      matchesDateRange = matchesDateRange && new Date(company.createdAt) >= new Date(dateRange.start);
    }
    if (dateRange.end && company.createdAt) {
      matchesDateRange = matchesDateRange && new Date(company.createdAt) <= new Date(dateRange.end);
    }
    
    // Batch count range filter
    const matchesMinBatches = !minBatches || company.batchCount >= parseInt(minBatches);
    const matchesMaxBatches = !maxBatches || company.batchCount <= parseInt(maxBatches);
    
    // User count range filter
    const matchesMinUsers = !minUsers || company.userCount >= parseInt(minUsers);
    const matchesMaxUsers = !maxUsers || company.userCount <= parseInt(maxUsers);
    
    // Growth filter
    const matchesMinGrowth = !minGrowth || company.growth >= parseInt(minGrowth);
    
    return matchesSearch && matchesStatus && matchesDateRange && 
           matchesMinBatches && matchesMaxBatches && 
           matchesMinUsers && matchesMaxUsers && matchesMinGrowth;
  });

  // Apply sorting
  if (sortBy === 'batches') {
    filteredCompanies.sort((a, b) => b.batchCount - a.batchCount);
  } else if (sortBy === 'users') {
    filteredCompanies.sort((a, b) => b.totalEnrolled - a.totalEnrolled);
  } else if (sortBy === 'courses') {
    filteredCompanies.sort((a, b) => b.courseCount - a.courseCount);
  } else if (sortBy === 'growth') {
    filteredCompanies.sort((a, b) => b.growth - a.growth);
  } else if (sortBy === 'name') {
    filteredCompanies.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Calculate statistics
  const totalCompanies = companies.length;
  const activeCompanies = companyMetrics.filter((c: any) => c.status === 'active').length;
  const inactiveCompanies = companyMetrics.filter((c: any) => c.status === 'inactive').length;
  const totalBatches = batches.length;
  const avgBatchesPerCompany = totalCompanies ? (totalBatches / totalCompanies).toFixed(1) : 0;
  const totalUsersAcrossCompanies = companyMetrics.reduce((sum, c) => sum + c.userCount, 0);
  const avgUsersPerCompany = totalCompanies ? Math.round(totalUsersAcrossCompanies / totalCompanies) : 0;
  const avgCompletionRate = totalCompanies ? Math.round(companyMetrics.reduce((sum, c) => sum + c.completionRate, 0) / totalCompanies) : 0;

  // Get top companies by different metrics
  const topByBatches = [...filteredCompanies].sort((a, b) => b.batchCount - a.batchCount).slice(0, 5);
  const topByUsers = [...filteredCompanies].sort((a, b) => b.userCount - a.userCount).slice(0, 5);
  const topByGrowth = [...filteredCompanies].sort((a, b) => b.growth - a.growth).slice(0, 5);
  const recentCompanies = [...filteredCompanies]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading && companies.length === 0) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="purple.500" />
      </Flex>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="start" spacing={2}>
            <HStack spacing={2}>
              <Icon as={Building2} boxSize={6} color="purple.600" />
              <Text fontSize="2xl" fontWeight="bold">Companies Analytics</Text>
            </HStack>
            <Text fontSize="sm" color={textSecondary}>
              Monitor company adoption, batch distribution, and user engagement
            </Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={RefreshCw} />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              size="sm"
              variant="outline"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Icon as={Filter} />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="sm"
              variant={showAdvancedFilters ? "solid" : "outline"}
              colorScheme="purple"
            >
              Filters
            </Button>
          </HStack>
        </Flex>
      </MotionBox>

      {/* Error Alert */}
      {companyStore.error && (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {companyStore.error}
        </Alert>
      )}

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">TOTAL COMPANIES</Text>
            <Text fontSize="2xl" fontWeight="bold">{totalCompanies}</Text>
            <HStack spacing={1}>
              <Icon as={Building2} boxSize={3} color="gray.500" />
              <Text fontSize="xs" color="gray.500">Registered</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">ACTIVE COMPANIES</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">{activeCompanies}</Text>
            <HStack spacing={1}>
              <Icon as={TrendingUp} boxSize={3} color="green.500" />
              <Text fontSize="xs" color="green.600">{totalCompanies ? ((activeCompanies / totalCompanies) * 100).toFixed(0) : 0}% active</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">TOTAL BATCHES</Text>
            <Text fontSize="2xl" fontWeight="bold">{totalBatches}</Text>
            <HStack spacing={1}>
              <Icon as={GraduationCap} boxSize={3} color="blue.500" />
              <Text fontSize="xs" color="blue.600">Across all companies</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">AVG COMPLETION RATE</Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">{avgCompletionRate}%</Text>
            <HStack spacing={1}>
              <Icon as={Award} boxSize={3} color="purple.500" />
              <Text fontSize="xs" color="purple.600">Average across companies</Text>
            </HStack>
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Status Distribution */}
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={UserCheck} boxSize={4} color="green.500" />
              <Text fontSize="sm" fontWeight="bold">Active</Text>
              <Badge ml="auto" colorScheme="green">{activeCompanies}</Badge>
            </Flex>
            <Box w="full">
              <Progress value={totalCompanies ? (activeCompanies / totalCompanies) * 100 : 0} size="sm" colorScheme="green" rounded="full" />
              <Text fontSize="xs" color={textSecondary} mt={1}>
                {totalCompanies ? ((activeCompanies / totalCompanies) * 100).toFixed(0) : 0}% of total
              </Text>
            </Box>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={Activity} boxSize={4} color="gray.500" />
              <Text fontSize="sm" fontWeight="bold">Inactive</Text>
              <Badge ml="auto" colorScheme="gray">{inactiveCompanies}</Badge>
            </Flex>
            <Box w="full">
              <Progress value={totalCompanies ? (inactiveCompanies / totalCompanies) * 100 : 0} size="sm" colorScheme="gray" rounded="full" />
              <Text fontSize="xs" color={textSecondary} mt={1}>
                {totalCompanies ? ((inactiveCompanies / totalCompanies) * 100).toFixed(0) : 0}% of total
              </Text>
            </Box>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={Target} boxSize={4} color="blue.500" />
              <Text fontSize="sm" fontWeight="bold">Avg Batches/Co</Text>
              <Badge ml="auto" colorScheme="blue">{avgBatchesPerCompany}</Badge>
            </Flex>
            <Box w="full">
              <Text fontSize="xs" color={textSecondary} mt={1}>
                Batches per company average
              </Text>
            </Box>
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <MotionBox
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          bg={sectionBg}
          p={5}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="bold" fontSize="md">Advanced Filters</Text>
              <Button size="xs" variant="ghost" onClick={clearAllFilters} leftIcon={<Icon as={X} boxSize={3} />}>
                Clear All
              </Button>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {/* Date Range Filter */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Registration Date</Text>
                <HStack spacing={2}>
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    size="sm"
                  />
                  <Text fontSize="xs">to</Text>
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    size="sm"
                  />
                </HStack>
              </Box>

              {/* Batch Count Range */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Batch Count Range</Text>
                <HStack spacing={2}>
                  <Input
                    type="number"
                    placeholder="Min batches"
                    value={minBatches}
                    onChange={(e) => setMinBatches(e.target.value)}
                    size="sm"
                  />
                  <Text fontSize="xs">to</Text>
                  <Input
                    type="number"
                    placeholder="Max batches"
                    value={maxBatches}
                    onChange={(e) => setMaxBatches(e.target.value)}
                    size="sm"
                  />
                </HStack>
              </Box>

              {/* User Count Range */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>User Count Range</Text>
                <HStack spacing={2}>
                  <Input
                    type="number"
                    placeholder="Min users"
                    value={minUsers}
                    onChange={(e) => setMinUsers(e.target.value)}
                    size="sm"
                  />
                  <Text fontSize="xs">to</Text>
                  <Input
                    type="number"
                    placeholder="Max users"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    size="sm"
                  />
                </HStack>
              </Box>

              {/* Minimum Growth */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Minimum Growth Rate</Text>
                <Input
                  type="number"
                  placeholder="Growth %"
                  value={minGrowth}
                  onChange={(e) => setMinGrowth(e.target.value)}
                  size="sm"
                />
              </Box>
            </SimpleGrid>

            {/* Active Filters Display */}
            {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end || minBatches || maxBatches || minUsers || maxUsers || minGrowth) && (
              <Wrap spacing={2} mt={2}>
                <Text fontSize="xs" color={textSecondary}>Active Filters:</Text>
                {searchQuery && (
                  <Tag size="sm" colorScheme="blue">
                    <TagLeftIcon as={Search} />
                    <TagLabel>Search: {searchQuery}</TagLabel>
                  </Tag>
                )}
                {statusFilter !== 'all' && (
                  <Tag size="sm" colorScheme="green">
                    <TagLabel>Status: {statusFilter}</TagLabel>
                  </Tag>
                )}
                {dateRange.start && (
                  <Tag size="sm" colorScheme="purple">
                    <TagLabel>From: {new Date(dateRange.start).toLocaleDateString()}</TagLabel>
                  </Tag>
                )}
                {dateRange.end && (
                  <Tag size="sm" colorScheme="purple">
                    <TagLabel>To: {new Date(dateRange.end).toLocaleDateString()}</TagLabel>
                  </Tag>
                )}
                {minBatches && (
                  <Tag size="sm" colorScheme="orange">
                    <TagLabel>Min Batches: {minBatches}</TagLabel>
                  </Tag>
                )}
                {maxBatches && (
                  <Tag size="sm" colorScheme="orange">
                    <TagLabel>Max Batches: {maxBatches}</TagLabel>
                  </Tag>
                )}
                {minGrowth && (
                  <Tag size="sm" colorScheme="teal">
                    <TagLabel>Min Growth: {minGrowth}%</TagLabel>
                  </Tag>
                )}
              </Wrap>
            )}
          </VStack>
        </MotionBox>
      )}

      {/* Basic Search & Sort */}
      {!showAdvancedFilters && (
        <MotionBox bg={sectionBg} p={5} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" fontSize="md">Search & Sort</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <Box position="relative">
                <Icon as={Search} position="absolute" left={3} top={3} color="gray.400" boxSize={4} />
                <Input
                  placeholder="Search by company name, email, or industry..."
                  pl={10}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="lg"
                />
              </Box>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} borderRadius="lg">
                <option value="batches">Sort by: Most Batches</option>
                <option value="users">Sort by: Most Users</option>
                <option value="courses">Sort by: Most Courses</option>
                <option value="growth">Sort by: Highest Growth</option>
                <option value="name">Sort by: Name A-Z</option>
              </Select>
            </SimpleGrid>
          </VStack>
        </MotionBox>
      )}

      {/* Companies Table */}
      <MotionBox bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
        <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={2}>
          <Box>
            <Text fontWeight="bold" fontSize="md">Companies List</Text>
            <Text fontSize="xs" color={textSecondary}>
              Showing {filteredCompanies.length} of {totalCompanies} companies
            </Text>
          </Box>
          <Badge colorScheme="purple" variant="subtle" fontSize="xs" p={2}>
            {filteredCompanies.length} Results
          </Badge>
        </Flex>

        <TableContainer overflowX="auto" maxH="500px">
          <Table variant="simple" size="sm">
            <Thead position="sticky" top={0} bg={headerBg} zIndex={1}>
              <Tr>
                <Th fontSize="xs" fontWeight="bold">Company</Th>
                <Th fontSize="xs" fontWeight="bold">Industry</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Batches</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Courses</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Users</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Completion</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Growth</Th>
                <Th fontSize="xs" fontWeight="bold">Status</Th>
                <Th fontSize="xs" fontWeight="bold">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCompanies.length === 0 ? (
                <Tr>
                  <Td colSpan={9} textAlign="center" py={8}>
                    <VStack spacing={2}>
                      <Icon as={Building2} boxSize={10} color="gray.300" />
                      <Text color={textSecondary}>No companies found</Text>
                      {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
                        <Button size="sm" onClick={clearAllFilters}>
                          Clear All Filters
                        </Button>
                      )}
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredCompanies.map((company) => (
                  <Tr key={company.id} _hover={{ bg: headerBg }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">{company.name}</Text>
                        <Text fontSize="xs" color={textSecondary}>{company.email}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="xs" color={textSecondary}>{company.industry}</Text>
                    </Td>
                    <Td textAlign="center">
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {company.batchCount}
                      </Badge>
                    </Td>
                    <Td textAlign="center">
                      <Badge colorScheme="green" variant="subtle" fontSize="xs">
                        {company.courseCount}
                      </Badge>
                    </Td>
                    <Td textAlign="center">
                      <Text fontSize="sm" fontWeight="bold">{company.userCount}</Text>
                    </Td>
                    <Td textAlign="center" minW="100px">
                      <VStack spacing={1}>
                        <Progress 
                          value={company.completionRate} 
                          size="xs" 
                          width="100%"
                          colorScheme={company.completionRate >= 70 ? 'green' : company.completionRate >= 40 ? 'yellow' : 'red'}
                          rounded="full"
                        />
                        <Text fontSize="xs">{company.completionRate}%</Text>
                      </VStack>
                    </Td>
                    <Td textAlign="center">
                      <HStack justify="center" spacing={1}>
                        <Icon as={TrendingUp} boxSize={3} color={company.growth >= 20 ? 'green.500' : company.growth >= 10 ? 'yellow.500' : 'orange.500'} />
                        <Text fontSize="xs" fontWeight="bold" color={company.growth >= 20 ? 'green.600' : company.growth >= 10 ? 'yellow.600' : 'orange.600'}>
                          +{company.growth}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={company.status === 'active' ? 'green' : 'gray'}
                        variant="solid"
                        size="sm"
                        fontSize="xs"
                        px={2}
                        py={1}
                      >
                        {company.status === 'active' ? '● Active' : '○ Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        rightIcon={<Icon as={Eye} boxSize={3} />}
                        onClick={() => handleViewCompany(company)}
                      >
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </MotionBox>

      {/* Analytics Cards */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5}>
        {/* Top by Batches */}
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Most Batches</Text>
            <Icon as={GraduationCap} boxSize={4} color="blue.600" />
          </Flex>
          <VStack spacing={3} align="stretch">
            {topByBatches.length > 0 ? (
              topByBatches.map((company, idx) => (
                <Box key={company.id} p={3} bg={headerBg} rounded="md" cursor="pointer" onClick={() => handleViewCompany(company)} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                  <Flex justify="space-between" align="start" mb={2}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        {idx + 1}. {company.name}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>{company.industry}</Text>
                    </Box>
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      {company.batchCount} batches
                    </Text>
                  </Flex>
                  <Progress 
                    value={(company.batchCount / topByBatches[0].batchCount) * 100} 
                    size="xs" 
                    colorScheme="blue" 
                    rounded="full" 
                  />
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color={textSecondary} textAlign="center" py={4}>No data available</Text>
            )}
          </VStack>
        </MotionBox>

        {/* Top by Users */}
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Most Users</Text>
            <Icon as={Users} boxSize={4} color="green.600" />
          </Flex>
          <VStack spacing={3} align="stretch">
            {topByUsers.length > 0 ? (
              topByUsers.map((company, idx) => (
                <Box key={company.id} p={3} bg={headerBg} rounded="md" cursor="pointer" onClick={() => handleViewCompany(company)} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                  <Flex justify="space-between" align="start" mb={2}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        {idx + 1}. {company.name}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>{company.industry}</Text>
                    </Box>
                    <Text fontSize="sm" fontWeight="bold" color="green.600">
                      {company.userCount} users
                    </Text>
                  </Flex>
                  <Progress 
                    value={(company.userCount / topByUsers[0].userCount) * 100} 
                    size="xs" 
                    colorScheme="green" 
                    rounded="full" 
                  />
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color={textSecondary} textAlign="center" py={4}>No data available</Text>
            )}
          </VStack>
        </MotionBox>

        {/* Fastest Growing */}
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Fastest Growing</Text>
            <Icon as={TrendingUp} boxSize={4} color="orange.600" />
          </Flex>
          <VStack spacing={3} align="stretch">
            {topByGrowth.length > 0 ? (
              topByGrowth.map((company, idx) => (
                <Box key={company.id} p={3} bg={headerBg} rounded="md" cursor="pointer" onClick={() => handleViewCompany(company)} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        {idx + 1}. {company.name}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>{company.industry}</Text>
                    </Box>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="orange.600">+{company.growth}%</Text>
                      <Text fontSize="xs" color={textSecondary}>{company.batchCount} batches</Text>
                    </VStack>
                  </Flex>
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color={textSecondary} textAlign="center" py={4}>No data available</Text>
            )}
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Recent Companies */}
      <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
        <Flex justify="space-between" align="center" mb={5}>
          <Text fontWeight="bold" fontSize="md">Recently Added Companies</Text>
          <Icon as={Calendar} boxSize={4} color="purple.600" />
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {recentCompanies.length > 0 ? (
            recentCompanies.map((company) => (
              <Box
                key={company.id}
                p={4}
                bg={headerBg}
                rounded="lg"
                borderLeft="4px"
                borderColor="purple.500"
                cursor="pointer"
                onClick={() => handleViewCompany(company)}
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
              >
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="full">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">{company.name}</Text>
                      <Text fontSize="xs" color={textSecondary}>{company.email}</Text>
                    </VStack>
                    <Badge colorScheme={company.status === 'active' ? 'green' : 'gray'} fontSize="xs">
                      {company.status}
                    </Badge>
                  </HStack>

                  <SimpleGrid columns={3} spacing={2} w="full">
                    <Box textAlign="center">
                      <Text fontSize="xs" color={textSecondary}>Batches</Text>
                      <Text fontWeight="bold" fontSize="sm">{company.batchCount}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="xs" color={textSecondary}>Courses</Text>
                      <Text fontWeight="bold" fontSize="sm">{company.courseCount}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="xs" color={textSecondary}>Growth</Text>
                      <Text fontWeight="bold" fontSize="sm" color="green.600">+{company.growth}%</Text>
                    </Box>
                  </SimpleGrid>

                  <Text fontSize="xs" color={textSecondary}>
                    Joined: {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </VStack>
              </Box>
            ))
          ) : (
            <Box p={4} textAlign="center" bg={headerBg} rounded="lg" gridColumn="1 / -1">
              <Text fontSize="sm" color={textSecondary}>No recent companies</Text>
            </Box>
          )}
        </SimpleGrid>
      </MotionBox>

      {/* Company Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={headerBg}>
            <Flex align="center" gap={2}>
              <Icon as={Building2} boxSize={5} color="purple.600" />
              <Text fontSize="lg" fontWeight="bold">{selectedCompany?.name}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedCompany && (
              <VStack spacing={5} align="stretch">
                {/* Status and Metrics */}
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Status</StatLabel>
                    <StatNumber>
                      <Badge
                        colorScheme={selectedCompany.status === 'active' ? 'green' : 'gray'}
                        variant="solid"
                        fontSize="md"
                        px={3}
                        py={1}
                      >
                        {selectedCompany.status === 'active' ? '● Active' : '○ Inactive'}
                      </Badge>
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Growth Rate</StatLabel>
                    <StatNumber color="green.600">+{selectedCompany.growth}%</StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <Icon as={TrendingUp} boxSize={3} />
                        <Text fontSize="xs">Last 6 months</Text>
                      </HStack>
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>

                <Divider />

                {/* Basic Info */}
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="bold" fontSize="md">Company Information</Text>
                  <SimpleGrid columns={2} spacing={3}>
                    <HStack>
                      <Icon as={Mail} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Email</Text>
                        <Text fontSize="sm" fontWeight="medium">{selectedCompany.email}</Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Icon as={Briefcase} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Industry</Text>
                        <Text fontSize="sm" fontWeight="medium">{selectedCompany.industry}</Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Icon as={Calendar} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Registered On</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Icon as={User} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Created By</Text>
                        <Text fontSize="sm" fontWeight="medium">{selectedCompany.createdBy}</Text>
                      </Box>
                    </HStack>
                  </SimpleGrid>
                </VStack>

                <Divider />

                {/* Performance Metrics */}
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="bold" fontSize="md">Performance Metrics</Text>
                  <SimpleGrid columns={3} spacing={3}>
                    <Box p={3} bg={headerBg} rounded="md" textAlign="center">
                      <Text fontSize="xs" color={textSecondary}>Total Batches</Text>
                      <Text fontSize="xl" fontWeight="bold" color="blue.600">{selectedCompany.batchCount}</Text>
                    </Box>
                    <Box p={3} bg={headerBg} rounded="md" textAlign="center">
                      <Text fontSize="xs" color={textSecondary}>Total Courses</Text>
                      <Text fontSize="xl" fontWeight="bold" color="green.600">{selectedCompany.courseCount}</Text>
                    </Box>
                    <Box p={3} bg={headerBg} rounded="md" textAlign="center">
                      <Text fontSize="xs" color={textSecondary}>Total Users</Text>
                      <Text fontSize="xl" fontWeight="bold" color="purple.600">{selectedCompany.userCount}</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>

                <Divider />

                {/* Completion Rate */}
                <Box>
                  <Text fontWeight="bold" fontSize="md" mb={2}>Completion Rate</Text>
                  <Progress 
                    value={selectedCompany.completionRate} 
                    size="lg" 
                    colorScheme={selectedCompany.completionRate >= 70 ? 'green' : selectedCompany.completionRate >= 40 ? 'yellow' : 'red'}
                    rounded="full"
                  />
                  <Text fontSize="sm" mt={2} textAlign="center">
                    {selectedCompany.completionRate}% of users completed their courses
                  </Text>
                </Box>

                {selectedCompany.batches && selectedCompany.batches.length > 0 && (
                  <>
                    <Divider />
                    <VStack align="stretch" spacing={3}>
                      <Text fontWeight="bold" fontSize="md">Associated Batches ({selectedCompany.batchCount})</Text>
                      <Wrap spacing={2}>
                        {selectedCompany.batches.slice(0, 5).map((batch: any, idx: number) => (
                          <WrapItem key={idx}>
                            <Tag size="md" colorScheme="blue" variant="subtle">
                              <TagLeftIcon as={GraduationCap} />
                              <TagLabel>{batch.name}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                        {selectedCompany.batchCount > 5 && (
                          <Tag size="md" colorScheme="gray" variant="subtle">
                            <TagLabel>+{selectedCompany.batchCount - 5} more</TagLabel>
                          </Tag>
                        )}
                      </Wrap>
                    </VStack>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
});

export default CompaniesAnalytics;