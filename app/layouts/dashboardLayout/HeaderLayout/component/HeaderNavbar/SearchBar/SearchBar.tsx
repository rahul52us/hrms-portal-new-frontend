"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Icon,
  InputGroup,
  Input,
  InputLeftElement,
  List,
  ListItem,
  Flex,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import debounce from "lodash.debounce";
import Link from "next/link";
import { sidebarDatas } from "../../../../SidebarLayout/utils/SidebarItems";
import stores from "@/app/store/stores";
import { hasPermission } from "@/app/config/utils/permissions";

const SearchBar = () => {
  const isCompact = useBreakpointValue({ base: true, md: false }) ?? false;
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const user = stores.auth.user;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSearchDebounced = debounce((query: string) => handleSearch(query), 100);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query) {
      setResults([]);
      return;
    }

    const filtered = sidebarDatas.filter(
      (item: any) =>
        item?.name?.toLowerCase()?.includes(query.toLowerCase()) &&
        (!item.permissionKey || hasPermission(user, item.permissionKey))
    );
    setResults(filtered);
  };

  // Function to highlight the searched term
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text as="span" key={index} color="yellow.500" fontWeight="bold">
          {part}
        </Text>
      ) : (
        <Text as="span" key={index}>
          {part}
        </Text>
      )
    );
  };


  return (
    <Box position="relative" width="100%" maxW={{ base: "full", md: "320px", xl: "360px" }} ref={dropdownRef}>
      <InputGroup>
        <InputLeftElement h={{ base: "40px", md: "44px" }}>
          <Icon as={FaSearch} color={useColorModeValue("brand.500", "brand.200")} boxSize={isCompact ? 3.5 : 4} />
        </InputLeftElement>
        <Input
          placeholder={isCompact ? "Search dashboard" : "Start typing to search..."}
          bg={useColorModeValue("white", "darkBrand.50")}
          border="1px solid"
          borderColor={useColorModeValue("brand.200", "darkBrand.200")}
          _focus={{ borderColor: "brand.500", boxShadow: "0 0 4px brand.500" }}
          _hover={{ borderColor: "brand.300" }}
          borderRadius="full"
          h={{ base: "40px", md: "44px" }}
          pl={{ base: 10, md: 11 }}
          pr={4}
          fontSize={{ base: "sm", md: "sm" }}
          value={searchQuery}
          onChange={(e) => handleSearchDebounced(e.target.value)}
        />
      </InputGroup>

      {results.length > 0 && (
        <List
          bg={useColorModeValue("white", "darkBrand.100")}
          mt={2}
          borderRadius="lg"
          boxShadow="xl"
          position="absolute"
          width="100%"
          zIndex={100}
          border="1px solid"
          borderColor={useColorModeValue("brand.200", "darkBrand.200")}
          maxHeight="300px"
          overflowY="auto"
          overflowX="hidden"
        >
          {results.map((result: any, index: number) => (
            <ListItem
              key={result.url}
              px={4}
              py={{ base: 2.5, md: 3 }}
              _hover={{
                bg: useColorModeValue("brand.50", "darkBrand.200"),
                cursor: "pointer",
                transform: "scale(1.01)",
                transition: "transform 0.2s ease-in-out",
              }}
              borderBottom={index < results.length - 1 ? "1px solid" : "none"}
              borderColor={useColorModeValue("brand.100", "darkBrand.200")}
            >
              <Link
                href={result.url}
                onClick={() => {
                  setSearchQuery("");
                  setResults([]);
                }}
              >
                <Flex align="center" gap={4}>
                  <Box fontSize={{ base: "20px", md: "24px" }} color="brand.500">
                    {result.icon}
                  </Box>
                  <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} color={useColorModeValue("gray.700", "white")}>
                    {highlightText(result.name, searchQuery)}
                  </Text>
                </Flex>
              </Link>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default SearchBar;
