"use client";
import {
  Box,
  Flex,
  Link,
  Stack,
  Collapse,
  IconButton,
  useDisclosure,
  useBreakpointValue
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  HamburgerIcon
} from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface NavLink {
  name: string;
  href: string;
  dropdown?: boolean;
  links?: NavLink[];
}

interface NavItemProps {
  item: {
    title: string;
    link: string;
    dropdown?: boolean;
    links?: NavLink[];
    external?: boolean;
  };
  onClose: () => void;
  isNested?: boolean;
  isMobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  item,
  onClose,
  isNested = false,
}) => {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const { isOpen, onToggle } = useDisclosure();

  // Provide default value for server-side rendering
  const isMobileView = useBreakpointValue({ base: true, md: false }, {
    ssr: true,
    fallback: 'md' // Assume desktop view by default during SSR
  });

  const handleNavClick = (link: string, external: boolean = false) => {
    if (external) {
      window.open(link, "_blank");
    } else {
      router.push(link);
    }
    onClose();
  };

  const renderDropdownItem = (subItem: NavLink) => {
    if (subItem.dropdown) {
      return (
        <NavItem
          item={{
            title: subItem.name,
            link: subItem.href,
            dropdown: true,
            links: subItem.links
          }}
          onClose={onClose}
          isNested={true}
          isMobile={isMobileView}
        />
      );
    }

    return isMobileView ? (
      <Box
        as={Link}
        href={subItem.href}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          handleNavClick(subItem.href);
        }}
        _hover={{ bg: "gray.100", color: "#045B64", fontWeight: "medium" }}
        px={3}
        py={2}
        fontSize="16px"
        color="gray.700"
        display="block"
        w="100%"
      >
        {subItem.name}
      </Box>
    ) : (
      <Box
      as="a"
      href={subItem.href}
      onClick={() => {
        // e.preventDefault();
        router.push(subItem.href);

      }}
      _hover={{ bg: "transparent", color: "#045B64", fontWeight: "medium" }}
      px={3}
      py={2}
      fontSize="15px"
      color="gray.700"
      display="block"
    >
      {subItem.name}
    </Box>
    );
  };

  const renderMultiColumnDropdown = () => {
    const conditions = item.links?.find((link) => link.name === "Conditions");
    const specialtyServices = item.links?.find(
      (link) => link.name === "Speciality Services"
    );
    const otherLinks = item.links?.filter(
      (link) => link.name !== "Speciality Services" && link.name !== "Conditions"
    );

    if (isMobileView) {
      return (
        <Stack spacing={4} w="100%">
          {otherLinks && otherLinks.length > 0 && (
            <Box w="100%">
              <Stack spacing={0}>
                {otherLinks.map((subItem, index) => (
                  <React.Fragment key={index}>
                    {renderDropdownItem(subItem)}
                  </React.Fragment>
                ))}
              </Stack>
            </Box>
          )}

          {conditions && (
            <Box w="100%">
              <Box fontWeight="bold" px={3} py={2} color="#045B64">
                {conditions.name}
              </Box>
              <Stack spacing={0}>
                {conditions.links?.map((subItem, index) => (
                  <React.Fragment key={index}>
                    {renderDropdownItem(subItem)}
                  </React.Fragment>
                ))}
              </Stack>
            </Box>
          )}

          {specialtyServices && (
            <Box w="100%">
              <Box fontWeight="bold" px={3} py={2} color="#045B64">
                {specialtyServices.name}
              </Box>
              <Stack spacing={0}>
                {specialtyServices.links?.map((subItem, index) => (
                  <React.Fragment key={index}>
                    {renderDropdownItem(subItem)}
                  </React.Fragment>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      );
    }

    return (
      <Flex
        direction="row"
        minWidth="500px"
        p={2}
        gap={4}
      >
        {otherLinks && otherLinks.length > 0 && (
          <Box
            flex={1}
            borderRight="1px solid"
            borderColor="gray.200"
            pr={4}
          >
            <Stack spacing={0}>
              {otherLinks.map((subItem, index) => (
                <React.Fragment key={index}>
                  {renderDropdownItem(subItem)}
                </React.Fragment>
              ))}
            </Stack>
          </Box>
        )}
        {conditions && (
          <Box
            flex={1}
            borderRight="1px solid"
            borderColor="gray.200"
            px={4}
          >
            <Box fontWeight="bold" px={3} py={2} color="#045B64">
              {conditions.name}
            </Box>
            <Stack spacing={0}>
              {conditions.links?.map((subItem, index) => (
                <React.Fragment key={index}>
                  {renderDropdownItem(subItem)}
                </React.Fragment>
              ))}
            </Stack>
          </Box>
        )}
        {specialtyServices && (
          <Box flex={1} pl={4}>
            <Box fontWeight="bold" px={3} py={2} color="#045B64">
              {specialtyServices.name}
            </Box>
            <Stack spacing={0}>
              {specialtyServices.links?.map((subItem, index) => (
                <React.Fragment key={index}>
                  {renderDropdownItem(subItem)}
                </React.Fragment>
              ))}
            </Stack>
          </Box>
        )}
      </Flex>
    );
  };

  const renderNonDropdownItem = () => {
    if (item.external) {
      return (
        <Link
          href={item.link}
          fontSize={isMobileView ? "16px" : "18px"}
          color="#045B64"
          position="relative"
          cursor="pointer"
          w={isMobileView ? "100%" : "auto"}
          display="block"
          px={isMobileView ? 3 : 0}
          py={isMobileView ? 2 : 0}
          _hover={{
            textDecoration: "none",
            bg: isMobileView ? "gray.50" : "transparent",
            "&::after": isMobileView
              ? {}
              : {
                content: '""',
                position: "absolute",
                bottom: "-4px",
                left: 0,
                width: "100%",
                height: "2px",
                backgroundColor: "#045B64"
              }
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.title}
        </Link>
      );
    }

    return (
      <Box
        as="span"
        fontSize={isMobileView ? "16px" : "18px"}
        color="#045B64"
        position="relative"
        cursor="pointer"
        w={isMobileView ? "100%" : "auto"}
        display="block"
        px={isMobileView ? 3 : 0}
        py={isMobileView ? 2 : 0}
        _hover={{
          bg: isMobileView ? "gray.50" : "transparent",
          "&::after": isMobileView
            ? {}
            : {
              content: '""',
              position: "absolute",
              bottom: "-4px",
              left: 0,
              width: "100%",
              height: "2px",
              backgroundColor: "#045B64"
            }
        }}
        onClick={() => handleNavClick(item.link)}
      >
        {item.title}
      </Box>
    );
  };

  const renderMobileDropdown = () => {
    return (
      <Box width="100%">
        <Flex
          justify="space-between"
          align="center"
          onClick={onToggle}
          px={3}
          py={2}
          _hover={{ bg: "gray.50" }}
        >
          <Box fontSize="16px" color="#045B64">
            {item.title}
          </Box>
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <Box pl={4} py={2} bg="gray.50">
            {item.title === "Services"
              ? renderMultiColumnDropdown()
              : item.links?.map((subItem, index) => (
                <React.Fragment key={index}>
                  {renderDropdownItem(subItem)}
                </React.Fragment>
              ))}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const renderDesktopDropdown = () => {
    return (
      <Box position="relative">
        <Box
          as="div"
          display="flex"
          alignItems="center"
          px={isNested ? 3 : 0}
          py={isNested ? 1 : 0}
          _hover={{ color: "#045B64" }}
          onClick={() => setIsHovering(!isHovering)}
          cursor="pointer"
        >
          <Flex alignItems="center">
            {item.title}
            {isNested ? (
              <ChevronRightIcon ml={1} />
            ) : (
              <ChevronDownIcon ml={1} />
            )}
          </Flex>
        </Box>

        {isHovering && (
          <Box
            position="absolute"
            top={isNested ? "0" : "100%"}
            left={isNested ? "100%" : "0"}
            minWidth={isNested ? "200px" : "240px"}
            py={2}
            px={2}
            // border="1px solid"
            borderColor="gray.200"
            // boxShadow="md"
            borderRadius="md"
            backgroundColor="white"
            zIndex={999}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {item.title === "Services"
              ? renderMultiColumnDropdown()
              : item.links?.map((subItem, index) => (
                <React.Fragment key={index}>
                  {renderDropdownItem(subItem)}
                </React.Fragment>
              ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      as="span"
      fontSize={{ base: "16px", lg: "16px", xl: "18px" }}
      color="#045B64"
      position="relative"
      cursor="pointer"
      width={isMobileView ? "100%" : "auto"}
      onMouseEnter={() => !isMobileView && setIsHovering(true)}
      onMouseLeave={() => !isMobileView && setIsHovering(false)}
    >
      {item.dropdown ? (
        isMobileView ? renderMobileDropdown() : renderDesktopDropdown()
      ) : (
        renderNonDropdownItem()
      )}
    </Box>
  );
};

export default NavItem;

export const ResponsiveNavbar = ({ navItems }) => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  // Provide default value for server-side rendering
  const isMobileView = useBreakpointValue({ base: true, md: false }, {
    ssr: true,
    fallback: 'md'
  });

  return (
    <Box as="nav" width="100%" minHeight="60px"> {/* Add minHeight to prevent layout shift */}
      {/* Mobile toggle button */}
      {isMobileView && (
        <Flex justify="flex-end" py={2}>
          <IconButton
            aria-label="Toggle navigation menu"
            icon={<HamburgerIcon />}
            onClick={onToggle}
            variant="ghost"
          />
        </Flex>
      )}

      {/* Desktop navigation */}
      {!isMobileView && (
        <Flex justify="space-between" align="center" gap={6}>
          {navItems.map((item, index) => (
            <NavItem key={index} item={item} onClose={onClose} isMobile={false} />
          ))}
        </Flex>
      )}

      {/* Mobile navigation */}
      {isMobileView && (
        <Collapse in={isOpen} animateOpacity>
          <Stack spacing={0} py={2}>
            {navItems.map((item, index) => (
              <NavItem key={index} item={item} onClose={onClose} isMobile={true} />
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
};