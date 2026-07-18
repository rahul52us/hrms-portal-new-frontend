"use client";

import { locationStore, OfficeLocationItem } from "@/app/store/locationStore/locationStore";
import stores from "@/app/store/stores";
import { AddIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { FiEdit2, FiMapPin, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import LocationModal from "./LocationModal";

type LocationTableProps = {
  companyId?: string;
  companyName?: string;
};

const LocationTable = ({ companyId, companyName }: LocationTableProps) => {
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const canManageLocations = role === "superadmin" || role === "admin";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedLocation, setSelectedLocation] = useState<OfficeLocationItem | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<OfficeLocationItem | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 10;
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.800", "gray.900");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("blue.50", "blue.900");
  const emptyBg = useColorModeValue("gray.50", "gray.700");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorText = useColorModeValue("red.600", "red.300");

  useEffect(() => {
    if (companyId) {
      locationStore.fetchLocations(companyId, page, limit, search).catch(() => undefined);
      return;
    }

    locationStore.clearLocations();
  }, [companyId, page, search]);

  const totalPages = Math.max(1, locationStore.pagination?.totalPages || 1);

  const openCreate = () => {
    setSelectedLocation(null);
    onOpen();
  };

  const openEdit = (location: OfficeLocationItem) => {
    setSelectedLocation(location);
    onOpen();
  };

  const openDelete = (location: OfficeLocationItem) => {
    setDeleteLocation(location);
    onDeleteOpen();
  };

  const handleSaved = async (mode: "create" | "update") => {
    if (!companyId) return;

    if (mode === "create" && page !== 1) {
      setPage(1);
      return;
    }

    await locationStore.fetchLocations(companyId, page, limit, search);
  };

  const confirmDelete = async () => {
    if (!deleteLocation || !companyId) return;

    const moveToPreviousPage = page > 1 && locationStore.locations.length === 1;

    await locationStore.deleteLocation(deleteLocation._id);
    setDeleteLocation(null);
    onDeleteClose();

    if (moveToPreviousPage) {
      setPage((currentPage) => currentPage - 1);
      return;
    }

    await locationStore.fetchLocations(companyId, page, limit, search);
  };

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      shadow="sm"
    >
      <Box h="1" bgGradient="linear(to-r, blue.400, purple.500, pink.400)" />
      <Box p={{ base: 4, md: 6 }}>
        <Flex
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={4}
          direction={{ base: "column", md: "row" }}
          mb={5}
        >
          <HStack spacing={3} align="flex-start">
            <Box
              p={2.5}
              borderRadius="xl"
              bgGradient="linear(to-br, blue.500, purple.600)"
              color="white"
            >
              <Icon as={FiMapPin} boxSize={5} />
            </Box>
            <Box minW={0}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="800">
                Office Locations
              </Text>
              <Text color={muted} fontSize="sm" noOfLines={2}>
                {companyName
                  ? `${canManageLocations ? "Manage" : "View"} locations for ${companyName}`
                  : "Select a company to view its locations"}
              </Text>
            </Box>
          </HStack>

          <HStack spacing={3} align={{ base: "stretch", md: "center" }} flexWrap="wrap">
            <InputGroup maxW={{ base: "100%", md: "260px" }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color={muted} />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search location"
                borderRadius="full"
              />
            </InputGroup>
            <Tooltip
              label={
                !companyId
                  ? "Please select a company first"
                  : !canManageLocations
                    ? "Only Admins and Super Admins can manage locations"
                    : "Add new location"
              }
              hasArrow
            >
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                onClick={openCreate}
                isDisabled={!companyId || !canManageLocations}
                borderRadius="full"
                bgGradient="linear(to-r, blue.500, purple.600)"
                color="white"
              >
                Add Location
              </Button>
            </Tooltip>
          </HStack>
        </Flex>

        {locationStore.isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : locationStore.error ? (
          <Box p={4} bg={errorBg} borderRadius="xl">
            <Text color={errorText} textAlign="center">
              {locationStore.error}
            </Text>
          </Box>
        ) : locationStore.locations.length === 0 ? (
          <Box p={{ base: 6, md: 10 }} textAlign="center" bg={emptyBg} borderRadius="2xl" borderWidth="1px" borderStyle="dashed">
            <Icon as={FiMapPin} boxSize={10} color={muted} mb={3} />
            <Text fontWeight="800">No locations found</Text>
            <Text mt={1} color={muted} fontSize="sm">
              {companyName ? `No locations have been created for ${companyName} yet.` : "Select a company to get started."}
            </Text>
            {companyId && canManageLocations ? (
              <Button leftIcon={<AddIcon />} colorScheme="blue" size="sm" mt={4} onClick={openCreate}>
                Create location
              </Button>
            ) : null}
          </Box>
        ) : (
          <>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th color="white">Location</Th>
                    <Th color="white">Address</Th>
                    <Th color="white">City / State</Th>
                    <Th color="white">Status</Th>
                    {canManageLocations ? <Th color="white" textAlign="right">Actions</Th> : null}
                  </Tr>
                </Thead>
                <Tbody>
                  {locationStore.locations.map((location) => (
                    <Tr key={location._id} _hover={{ bg: rowHoverBg }}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="800">{location.name}</Text>
                          <Badge colorScheme="purple" borderRadius="full">
                            {location.code}
                          </Badge>
                        </VStack>
                      </Td>
                      <Td maxW="320px">
                        <Text noOfLines={2}>{location.address || "--"}</Text>
                        <Text fontSize="xs" color={muted}>
                          {location.pinCode || ""}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontWeight="600">{location.city || "--"}</Text>
                        <Text fontSize="sm" color={muted}>
                          {[location.state, location.country].filter(Boolean).join(", ") || "--"}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={location.is_active === false ? "red" : "green"} borderRadius="full">
                          {location.is_active === false ? "Inactive" : "Active"}
                        </Badge>
                      </Td>
                      {canManageLocations ? (
                        <Td>
                          <HStack justify="flex-end">
                            <Tooltip label="Edit location" hasArrow>
                              <IconButton
                                aria-label="Edit location"
                                icon={<Icon as={FiEdit2} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEdit(location)}
                              />
                            </Tooltip>
                            <Tooltip label="Delete location" hasArrow>
                              <IconButton
                                aria-label="Delete location"
                                icon={<Icon as={FiTrash2} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => openDelete(location)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      ) : null}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <Flex justify="space-between" align="center" mt={5} gap={3}>
              <Text fontSize="sm" color={muted}>
                Page {page} of {totalPages} - {locationStore.pagination?.total || 0} total
              </Text>
              <HStack>
                <Button size="sm" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} isDisabled={page <= 1}>
                  Prev
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} isDisabled={page >= totalPages}>
                  Next
                </Button>
              </HStack>
            </Flex>
          </>
        )}
      </Box>

      <LocationModal
        isOpen={isOpen}
        onClose={() => {
          setSelectedLocation(null);
          onClose();
        }}
        initialData={selectedLocation}
        companyId={companyId}
        companyName={companyName}
        onSaved={handleSaved}
      />

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size={{ base: "xs", md: "md" }}>
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent mx={4} borderRadius="2xl">
          <ModalHeader>Delete Location</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Delete {deleteLocation?.name || "this location"}? Locations assigned to employees cannot be deleted.
            </Text>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete} isLoading={locationStore.isSubmitting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default observer(LocationTable);
