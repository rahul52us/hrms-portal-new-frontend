"use client";

import { useState, useEffect } from "react";
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
  GraduationCap,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Filter,
  X,
  BookOpen,
  Building2,
  User,
  Calendar as CalendarIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import stores from "../../../../../store/stores";

const MotionBox = motion(Box);

const BatchesAnalytics = observer(() => {
  const sectionBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [courseFilter, setCourseFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [minUsers, setMinUsers] = useState("");
  const [maxUsers, setMaxUsers] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { batchStore, courseStore } = stores;
  const batches = batchStore.batches || [];
  const courses = courseStore.courses || [];
  const isLoading = batchStore.isLoading;

  // Fetch batches on component mount
  useEffect(() => {
    if (batches.length === 0) {
      batchStore.fetchBatches();
    }
    if (courses.length === 0) {
      courseStore.fetchCourses();
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await batchStore.fetchBatches();
    setIsRefreshing(false);
  };

  const handleViewBatch = (batch: any) => {
    setSelectedBatch(batch);
    onOpen();
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setCourseFilter("");
    setCompanyFilter("");
    setMinUsers("");
    setMaxUsers("");
  };

  // Calculate batch metrics accurately
  const batchMetrics = batches.map((batch: any) => {
    const batchCourses = batch.courses || batch.courseIds || [];
    const courseCount = Array.isArray(batchCourses) ? batchCourses.length : 0;
    
    const startDate = batch.startDate ? new Date(batch.startDate) : null;
    const endDate = batch.endDate ? new Date(batch.endDate) : null;
    const now = new Date();
    
    let daysRemaining = 0;
    let status = batch.status || 'active';
    
    if (endDate) {
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (status !== 'completed') {
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= 30) {
          status = 'expiring_soon';
        } else {
          status = 'active';
        }
      }
    }

    let progress = 0;
    if (startDate && endDate && status !== 'completed') {
      const total = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    } else if (status === 'completed') {
      progress = 100;
    }

    // Get course titles
    const courseTitles = batchCourses.map((course: any) => 
      typeof course === 'string' ? course : course?.title || course?.name
    );

    return {
      id: batch._id,
      name: batch.name || 'Unnamed Batch',
      company: batch.company?.company_name || batch.company?.name || 'Unassigned',
      companyId: batch.company?._id,
      status: status,
      userCount: batch.userCount || batch.users?.length || 0,
      users: batch.users || [],
      completedCount: batch.completedCount || 0,
      courseCount,
      courseTitles,
      startDate,
      endDate,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      progress,
      createdAt: batch.createdAt,
      createdBy: batch.createdBy?.name || batch.createdBy?.username || 'System',
      isExpired: daysRemaining < 0 && status !== 'completed',
    };
  });

  // Get unique companies for filter - FIXED: Convert Set to array properly
  const uniqueCompanies = Array.from(new Set(batchMetrics.map(b => b.company)));
  
  // Get unique courses for filter - FIXED: Convert Set to array properly
  const uniqueCourses = Array.from(new Set(batchMetrics.flatMap(b => b.courseTitles))).filter(Boolean);

  // Apply all filters
  const filteredBatches = batchMetrics.filter((batch: any) => {
    // Search filter
    const matchesSearch = 
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange.start && batch.startDate) {
      matchesDateRange = matchesDateRange && new Date(batch.startDate) >= new Date(dateRange.start);
    }
    if (dateRange.end && batch.endDate) {
      matchesDateRange = matchesDateRange && new Date(batch.endDate) <= new Date(dateRange.end);
    }
    
    // Course filter
    const matchesCourse = !courseFilter || batch.courseTitles.some((c: string) => 
      c?.toLowerCase().includes(courseFilter.toLowerCase())
    );
    
    // Company filter
    const matchesCompany = !companyFilter || batch.company.toLowerCase().includes(companyFilter.toLowerCase());
    
    // User count range filter
    const matchesMinUsers = !minUsers || batch.userCount >= parseInt(minUsers);
    const matchesMaxUsers = !maxUsers || batch.userCount <= parseInt(maxUsers);
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesCourse && 
           matchesCompany && matchesMinUsers && matchesMaxUsers;
  });

  // Calculate statistics
  const totalBatches = batches.length;
  const activeBatches = batchMetrics.filter((b: any) => b.status === 'active').length;
  const expiringSoonBatches = batchMetrics.filter((b: any) => b.status === 'expiring_soon').length;
  const completedBatches = batchMetrics.filter((b: any) => b.status === 'completed').length;
  const expiredBatches = batchMetrics.filter((b: any) => b.status === 'expired').length;
  
  const totalUsers = batchMetrics.reduce((sum: number, b: any) => sum + b.userCount, 0);
  const avgBatchSize = totalBatches ? Math.round(totalUsers / totalBatches) : 0;

  // Get top 5 largest batches
  const largestBatches = [...filteredBatches]
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 5);

  // Get batches expiring soon
  const expiringSoon = [...filteredBatches]
    .filter(b => b.status === 'expiring_soon' && b.daysRemaining > 0 && b.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  // Get recent batches
  const recentBatches = [...filteredBatches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading && batches.length === 0) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="blue.500" />
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
              <Icon as={GraduationCap} boxSize={6} color="blue.600" />
              <Text fontSize="2xl" fontWeight="bold">Batches Analytics</Text>
            </HStack>
            <Text fontSize="sm" color={textSecondary}>
              Monitor batch performance, user distribution, and lifecycle status
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
              colorScheme="blue"
            >
              Filters
            </Button>
          </HStack>
        </Flex>
      </MotionBox>

      {/* Error Alert */}
      {batchStore.error && (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {batchStore.error}
        </Alert>
      )}

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">TOTAL BATCHES</Text>
            <Text fontSize="2xl" fontWeight="bold">{totalBatches}</Text>
            <HStack spacing={1}>
              <Icon as={Calendar} boxSize={3} color="gray.500" />
              <Text fontSize="xs" color="gray.500">All time</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">ACTIVE BATCHES</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">{activeBatches}</Text>
            <HStack spacing={1}>
              <Icon as={CheckCircle} boxSize={3} color="green.500" />
              <Text fontSize="xs" color="green.600">
                {expiringSoonBatches > 0 && `${expiringSoonBatches} expiring soon`}
                {expiringSoonBatches === 0 && "Currently running"}
              </Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">TOTAL USERS</Text>
            <Text fontSize="2xl" fontWeight="bold">{totalUsers.toLocaleString()}</Text>
            <HStack spacing={1}>
              <Icon as={Users} boxSize={3} color="blue.500" />
              <Text fontSize="xs" color="blue.600">Enrolled across all batches</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">AVG BATCH SIZE</Text>
            <Text fontSize="2xl" fontWeight="bold">{avgBatchSize}</Text>
            <HStack spacing={1}>
              <Icon as={TrendingUp} boxSize={3} color="purple.500" />
              <Text fontSize="xs" color="purple.600">Users per batch</Text>
            </HStack>
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Status Distribution */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={CheckCircle} boxSize={4} color="green.500" />
              <Text fontSize="sm" fontWeight="bold">Active</Text>
              <Badge ml="auto" colorScheme="green">{activeBatches}</Badge>
            </Flex>
            <Box w="full">
              <Progress value={totalBatches ? (activeBatches / totalBatches) * 100 : 0} size="sm" colorScheme="green" rounded="full" />
              <Text fontSize="xs" color={textSecondary} mt={1}>
                {totalBatches ? ((activeBatches / totalBatches) * 100).toFixed(0) : 0}% of total
              </Text>
            </Box>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={AlertCircle} boxSize={4} color="orange.500" />
              <Text fontSize="sm" fontWeight="bold">Expiring Soon</Text>
              <Badge ml="auto" colorScheme="orange">{expiringSoonBatches}</Badge>
            </Flex>
            <Box w="full">
              <Progress value={totalBatches ? (expiringSoonBatches / totalBatches) * 100 : 0} size="sm" colorScheme="orange" rounded="full" />
              <Text fontSize="xs" color={textSecondary} mt={1}>
                {totalBatches ? ((expiringSoonBatches / totalBatches) * 100).toFixed(0) : 0}% of total
              </Text>
            </Box>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={CheckCircle} boxSize={4} color="blue.500" />
              <Text fontSize="sm" fontWeight="bold">Completed</Text>
              <Badge ml="auto" colorScheme="blue">{completedBatches}</Badge>
            </Flex>
            <Box w="full">
              <Progress value={totalBatches ? (completedBatches / totalBatches) * 100 : 0} size="sm" colorScheme="blue" rounded="full" />
              <Text fontSize="xs" color={textSecondary} mt={1}>
                {totalBatches ? ((completedBatches / totalBatches) * 100).toFixed(0) : 0}% of total
              </Text>
            </Box>
          </VStack>
        </MotionBox>

        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={4} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack align="start" spacing={3}>
            <Flex align="center" gap={2} w="full">
              <Icon as={AlertCircle} boxSize={4} color="red.500" />
              <Text fontSize="sm" fontWeight="bold">Expired</Text>
              <Badge ml="auto" colorScheme="red">{expiredBatches}</Badge>
            </Flex>
            <Box w="full">
              <Progress value={totalBatches ? (expiredBatches / totalBatches) * 100 : 0} size="sm" colorScheme="red" rounded="full" />
              <Text fontSize="xs" color={textSecondary} mt={1}>
                {totalBatches ? ((expiredBatches / totalBatches) * 100).toFixed(0) : 0}% of total
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
                <Text fontSize="sm" fontWeight="medium" mb={2}>Date Range</Text>
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

              {/* Course Filter */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Course</Text>
                <Select
                  placeholder="Select course"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  size="sm"
                >
                  {uniqueCourses.map((course, idx) => (
                    <option key={idx} value={course}>{course}</option>
                  ))}
                </Select>
              </Box>

              {/* Company Filter */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Company</Text>
                <Select
                  placeholder="Select company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  size="sm"
                >
                  {uniqueCompanies.map((company, idx) => (
                    <option key={idx} value={company}>{company}</option>
                  ))}
                </Select>
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
            </SimpleGrid>

            {/* Active Filters Display */}
            {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end || courseFilter || companyFilter || minUsers || maxUsers) && (
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
                {courseFilter && (
                  <Tag size="sm" colorScheme="orange">
                    <TagLabel>Course: {courseFilter}</TagLabel>
                  </Tag>
                )}
                {companyFilter && (
                  <Tag size="sm" colorScheme="teal">
                    <TagLabel>Company: {companyFilter}</TagLabel>
                  </Tag>
                )}
              </Wrap>
            )}
          </VStack>
        </MotionBox>
      )}

      {/* Basic Search & Filter */}
      {!showAdvancedFilters && (
        <MotionBox bg={sectionBg} p={5} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" fontSize="md">Search & Filter</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <Box position="relative">
                <Icon as={Search} position="absolute" left={3} top={3} color="gray.400" boxSize={4} />
                <Input
                  placeholder="Search batches by name or company..."
                  pl={10}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="lg"
                />
              </Box>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} borderRadius="lg">
                <option value="all">All Status ({totalBatches})</option>
                <option value="active">Active ({activeBatches})</option>
                <option value="expiring_soon">Expiring Soon ({expiringSoonBatches})</option>
                <option value="completed">Completed ({completedBatches})</option>
                <option value="expired">Expired ({expiredBatches})</option>
              </Select>
            </SimpleGrid>
          </VStack>
        </MotionBox>
      )}

      {/* Batches Table */}
      <MotionBox bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
        <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={2}>
          <Box>
            <Text fontWeight="bold" fontSize="md">Batches List</Text>
            <Text fontSize="xs" color={textSecondary}>
              Showing {filteredBatches.length} of {totalBatches} batches
            </Text>
          </Box>
          <Badge colorScheme="blue" variant="subtle" fontSize="xs" p={2}>
            {filteredBatches.length} Results
          </Badge>
        </Flex>

        <TableContainer overflowX="auto" maxH="500px">
          <Table variant="simple" size="sm">
            <Thead position="sticky" top={0} bg={headerBg} zIndex={1}>
              <Tr>
                <Th fontSize="xs" fontWeight="bold">Batch Name</Th>
                <Th fontSize="xs" fontWeight="bold">Company</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Courses</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Users</Th>
                <Th fontSize="xs" fontWeight="bold">Status</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Progress</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Days Left</Th>
                <Th fontSize="xs" fontWeight="bold">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredBatches.length === 0 ? (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={8}>
                    <VStack spacing={2}>
                      <Icon as={GraduationCap} boxSize={10} color="gray.300" />
                      <Text color={textSecondary}>No batches found</Text>
                      {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end || courseFilter || companyFilter) && (
                        <Button size="sm" onClick={clearAllFilters}>
                          Clear All Filters
                        </Button>
                      )}
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredBatches.map((batch) => (
                  <Tr key={batch.id} _hover={{ bg: headerBg }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{batch.name}</Text>
                        <Text fontSize="xs" color={textSecondary}>
                          {batch.startDate?.toLocaleDateString()} - {batch.endDate?.toLocaleDateString() || 'Ongoing'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontWeight="medium">{batch.company}</Text>
                    </Td>
                    <Td textAlign="center">
                      <Tooltip label={batch.courseTitles.join(', ')}>
                        <Badge colorScheme="purple" variant="subtle" fontSize="xs" cursor="pointer">
                          {batch.courseCount}
                        </Badge>
                      </Tooltip>
                    </Td>
                    <Td textAlign="center">
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {batch.userCount}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          batch.status === 'active' ? 'green' :
                          batch.status === 'expiring_soon' ? 'orange' :
                          batch.status === 'completed' ? 'blue' : 'red'
                        }
                        variant="solid"
                        size="sm"
                        fontSize="xs"
                        px={2}
                        py={1}
                      >
                        {batch.status === 'active' && '● Active'}
                        {batch.status === 'expiring_soon' && '⚠️ Expiring Soon'}
                        {batch.status === 'completed' && '✓ Completed'}
                        {batch.status === 'expired' && '✗ Expired'}
                      </Badge>
                    </Td>
                    <Td textAlign="center" minW="100px">
                      <VStack spacing={1}>
                        <Progress 
                          value={batch.progress} 
                          size="xs" 
                          width="100%"
                          colorScheme={
                            batch.progress === 100 ? 'green' :
                            batch.progress >= 75 ? 'blue' :
                            batch.progress >= 50 ? 'yellow' : 'gray'
                          }
                          rounded="full"
                        />
                        <Text fontSize="xs">{Math.round(batch.progress)}%</Text>
                      </VStack>
                    </Td>
                    <Td textAlign="center">
                      {batch.status !== 'completed' && batch.status !== 'expired' ? (
                        <HStack justify="center" spacing={1}>
                          <Icon 
                            as={Clock} 
                            boxSize={3} 
                            color={batch.daysRemaining > 30 ? 'green.500' : batch.daysRemaining > 0 ? 'orange.500' : 'red.500'} 
                          />
                          <Text fontSize="xs" fontWeight="bold">
                            {batch.daysRemaining > 0 ? `${batch.daysRemaining}d` : 'Ended'}
                          </Text>
                        </HStack>
                      ) : (
                        <Text fontSize="xs" color={textSecondary}>-</Text>
                      )}
                    </Td>
                    <Td>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        rightIcon={<Icon as={Eye} boxSize={3} />}
                        onClick={() => handleViewBatch(batch)}
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
        {/* Largest Batches */}
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Largest Batches</Text>
            <Icon as={Users} boxSize={4} color="blue.600" />
          </Flex>
          <VStack spacing={3} align="stretch">
            {largestBatches.length > 0 ? (
              largestBatches.map((batch, idx) => (
                <Box key={batch.id} p={3} bg={headerBg} rounded="md" cursor="pointer" onClick={() => handleViewBatch(batch)} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                  <Flex justify="space-between" align="start" mb={2}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        {idx + 1}. {batch.name}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>{batch.company}</Text>
                    </Box>
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      {batch.userCount} users
                    </Text>
                  </Flex>
                  <Progress value={totalUsers ? (batch.userCount / largestBatches[0].userCount) * 100 : 0} size="xs" colorScheme="blue" rounded="full" />
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color={textSecondary} textAlign="center" py={4}>No batches available</Text>
            )}
          </VStack>
        </MotionBox>

        {/* Expiring Soon */}
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Expiring Soon</Text>
            <Icon as={Calendar} boxSize={4} color="orange.600" />
          </Flex>
          <VStack spacing={3} align="stretch">
            {expiringSoon.length > 0 ? (
              expiringSoon.map((batch) => (
                <Box key={batch.id} p={3} bg={headerBg} rounded="md" borderLeft="3px" borderColor="orange.500" cursor="pointer" onClick={() => handleViewBatch(batch)}>
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{batch.name}</Text>
                      <Text fontSize="xs" color={textSecondary}>{batch.company}</Text>
                    </Box>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="orange.600">{batch.daysRemaining} days left</Text>
                      <Text fontSize="xs" color={textSecondary}>Ends {batch.endDate?.toLocaleDateString()}</Text>
                    </VStack>
                  </Flex>
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color={textSecondary} textAlign="center" py={4}>No batches expiring soon</Text>
            )}
          </VStack>
        </MotionBox>

        {/* Recent Batches */}
        <MotionBox whileHover={{ y: -2 }} bg={sectionBg} p={6} rounded="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Recent Batches</Text>
            <Icon as={Clock} boxSize={4} color="purple.600" />
          </Flex>
          <VStack spacing={3} align="stretch">
            {recentBatches.length > 0 ? (
              recentBatches.map((batch) => (
                <Box key={batch.id} p={3} bg={headerBg} rounded="md" cursor="pointer" onClick={() => handleViewBatch(batch)} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{batch.name}</Text>
                      <Text fontSize="xs" color={textSecondary}>{batch.company}</Text>
                    </Box>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="xs" color={textSecondary}>Created by {batch.createdBy}</Text>
                      <Text fontSize="xs" color="purple.600">{batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'N/A'}</Text>
                    </VStack>
                  </Flex>
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color={textSecondary} textAlign="center" py={4}>No recent batches</Text>
            )}
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Batch Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={headerBg}>
            <Flex align="center" gap={2}>
              <Icon as={GraduationCap} boxSize={5} color="blue.600" />
              <Text fontSize="lg" fontWeight="bold">{selectedBatch?.name}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedBatch && (
              <VStack spacing={5} align="stretch">
                {/* Status and Progress */}
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Status</StatLabel>
                    <StatNumber>
                      <Badge
                        colorScheme={
                          selectedBatch.status === 'active' ? 'green' :
                          selectedBatch.status === 'expiring_soon' ? 'orange' :
                          selectedBatch.status === 'completed' ? 'blue' : 'red'
                        }
                        variant="solid"
                        fontSize="md"
                        px={3}
                        py={1}
                      >
                        {selectedBatch.status === 'active' && '● Active'}
                        {selectedBatch.status === 'expiring_soon' && '⚠️ Expiring Soon'}
                        {selectedBatch.status === 'completed' && '✓ Completed'}
                        {selectedBatch.status === 'expired' && '✗ Expired'}
                      </Badge>
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Progress</StatLabel>
                    <StatNumber>{Math.round(selectedBatch.progress)}%</StatNumber>
                    <StatHelpText>
                      <Progress value={selectedBatch.progress} size="sm" colorScheme="blue" rounded="full" mt={2} />
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>

                <Divider />

                {/* Basic Info */}
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="bold" fontSize="md">Basic Information</Text>
                  <SimpleGrid columns={2} spacing={3}>
                    <HStack>
                      <Icon as={Building2} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Company</Text>
                        <Text fontSize="sm" fontWeight="medium">{selectedBatch.company}</Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Icon as={CalendarIcon} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Date Range</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {selectedBatch.startDate?.toLocaleDateString()} - {selectedBatch.endDate?.toLocaleDateString() || 'Ongoing'}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Icon as={Users} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Total Users</Text>
                        <Text fontSize="sm" fontWeight="medium">{selectedBatch.userCount}</Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Icon as={BookOpen} boxSize={4} color="gray.500" />
                      <Box>
                        <Text fontSize="xs" color={textSecondary}>Total Courses</Text>
                        <Text fontSize="sm" fontWeight="medium">{selectedBatch.courseCount}</Text>
                      </Box>
                    </HStack>
                  </SimpleGrid>
                </VStack>

                <Divider />

                {/* Courses List */}
                {selectedBatch.courseTitles && selectedBatch.courseTitles.length > 0 && (
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md">Courses ({selectedBatch.courseCount})</Text>
                    <Wrap spacing={2}>
                      {selectedBatch.courseTitles.map((course: string, idx: number) => (
                        <WrapItem key={idx}>
                          <Tag size="md" colorScheme="purple" variant="subtle">
                            <TagLeftIcon as={BookOpen} />
                            <TagLabel>{course}</TagLabel>
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </VStack>
                )}

                <Divider />

                {/* Additional Info */}
                <SimpleGrid columns={2} spacing={3}>
                  <Box>
                    <Text fontSize="xs" color={textSecondary}>Created By</Text>
                    <HStack mt={1}>
                      <Icon as={User} boxSize={3} color="gray.500" />
                      <Text fontSize="sm">{selectedBatch.createdBy}</Text>
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={textSecondary}>Created At</Text>
                    <HStack mt={1}>
                      <Icon as={Clock} boxSize={3} color="gray.500" />
                      <Text fontSize="sm">{selectedBatch.createdAt ? new Date(selectedBatch.createdAt).toLocaleString() : 'N/A'}</Text>
                    </HStack>
                  </Box>
                </SimpleGrid>

                {selectedBatch.daysRemaining > 0 && selectedBatch.status !== 'completed' && (
                  <Alert status={selectedBatch.daysRemaining <= 30 ? "warning" : "info"} borderRadius="md" size="sm">
                    <AlertIcon />
                    {selectedBatch.daysRemaining <= 30 
                      ? `This batch will expire in ${selectedBatch.daysRemaining} days` 
                      : `This batch has ${selectedBatch.daysRemaining} days remaining`}
                  </Alert>
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

export default BatchesAnalytics;