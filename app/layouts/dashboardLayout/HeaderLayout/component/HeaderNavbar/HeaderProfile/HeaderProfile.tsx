"use client";

import {
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  Box,
  Text,
  VStack,
  Icon,
  Portal,
  useDisclosure,
  useColorModeValue,
  useColorMode,
  Flex,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import {
  FaCog,
  FaPalette,
  FaSignOutAlt,
  FaUser,
  FaKey,
  FaHome,
} from "react-icons/fa";
import stores from "../../../../../../store/stores";
import { authentication, main } from "../../../../../../config/utils/routes";
import { useRouter, usePathname } from "next/navigation";
import { WEBSITE_TITLE } from "../../../../../../config/utils/variables";
import ProfileDetailsModal from "../../../../../../component/ProfileSettings/component/ProfileDetailsModal/ProfileDetailsModal";

const HeaderProfile = observer(() => {
  const { auth: { doLogout } } = stores;
  const pathname = usePathname();
  const router = useRouter();
  const {
    auth: { user },
    themeStore: { setOpenThemeDrawer },
  } = stores;
  const { isOpen:profileIsOpen, onOpen:profileOnOpen, onClose:profileOnClose } = useDisclosure();
  const { colorMode } = useColorMode();

  return user ? (
    <>
      <Menu closeOnSelect={true} placement="bottom-end">
        <MenuButton
          as={IconButton}
          aria-label="User Menu"
          icon={
            <Avatar
              src={user?.pic?.url || undefined}
              size="sm"
              w="32px"
              h="32px"
              borderRadius="full"
              name={user?.name}
              bg="brand.500"
              color="white"
              fontWeight="bold"
            />
          }
          isRound
          w="40px"
          h="40px"
          minW="40px"
          p={0}
          bg={useColorModeValue("blackAlpha.50", "whiteAlpha.100")}
          _hover={{
            bg: useColorModeValue("blackAlpha.100", "whiteAlpha.200"),
            transform: "scale(1.05)"
          }}
          _active={{
            bg: useColorModeValue("blackAlpha.200", "whiteAlpha.300"),
            transform: "scale(0.97)"
          }}
          transition="all 0.2s ease"
        />
        <Portal>
          <MenuList borderRadius="2xl" p={0} overflow="hidden" border="1px solid" borderColor={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'} boxShadow={colorMode === 'light' ? '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)' : '0 10px 25px -5px rgba(0,0,0,0.5)'} bg={colorMode === 'light' ? 'white' : 'gray.900'} minWidth="240px" zIndex={9999}>
            <Box px={4} py={3.5} borderBottom="1px solid" borderColor={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'} bg={colorMode === 'light' ? 'gray.50' : 'whiteAlpha.50'}>
              <Text fontWeight="800" fontSize="15px" color={colorMode === 'light' ? 'gray.900' : 'white'} noOfLines={1}>{user?.name}</Text>
              <Text fontSize="13px" fontWeight="500" color={colorMode === 'light' ? 'gray.500' : 'gray.400'} noOfLines={1}>{WEBSITE_TITLE?.split('-').join(' ')}</Text>
            </Box>
            <Box p={2}>
              {user && pathname !== main.home && (
                <MenuItem bg="transparent" _focus={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100' }} borderRadius="xl" px={3} py={2} mb={1} onClick={() => router.push(main.home)} _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100' }} transition="all 0.2s">
                  <Flex align="center" gap={3}>
                    <Flex align="center" justify="center" w={8} h={8} borderRadius="md" bg={colorMode === 'light' ? 'blue.50' : 'rgba(59, 130, 246, 0.15)'} color={colorMode === 'light' ? 'blue.500' : 'blue.300'}>
                      <Icon as={FaHome} boxSize={4} />
                    </Flex>
                    <Text fontWeight="600" fontSize="14px">Home</Text>
                  </Flex>
                </MenuItem>
              )}

              <MenuItem bg="transparent" _focus={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100' }} borderRadius="xl" px={3} py={2} mb={1} onClick={() => router.push('/dashboard/user-profile')} _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100' }} transition="all 0.2s">
                <Flex align="center" gap={3}>
                  <Flex align="center" justify="center" w={8} h={8} borderRadius="md" bg={colorMode === 'light' ? 'blue.50' : 'rgba(59, 130, 246, 0.15)'} color={colorMode === 'light' ? 'blue.500' : 'blue.300'}>
                    <Icon as={FaCog} boxSize={4} />
                  </Flex>
                  <Text fontWeight="600" fontSize="14px">Profile Settings</Text>
                </Flex>
              </MenuItem>

              <MenuItem bg="transparent" _focus={{ bg: colorMode === 'light' ? 'red.50' : 'rgba(239, 68, 68, 0.15)' }} borderRadius="xl" px={3} py={2} onClick={() => { doLogout(); router.push(authentication.login); }} _hover={{ bg: colorMode === 'light' ? 'red.50' : 'rgba(239, 68, 68, 0.15)' }} transition="all 0.2s">
                <Flex align="center" gap={3}>
                  <Flex align="center" justify="center" w={8} h={8} borderRadius="md" bg={colorMode === 'light' ? 'red.50' : 'transparent'} color={colorMode === 'light' ? 'red.500' : 'red.400'}>
                    <Icon as={FaSignOutAlt} boxSize={4} />
                  </Flex>
                  <Text fontWeight="600" fontSize="14px" color={colorMode === 'light' ? 'red.600' : 'red.400'}>Logout</Text>
                </Flex>
              </MenuItem>
            </Box>
          </MenuList>
        </Portal>
      </Menu>
      <ProfileDetailsModal isOpen={profileIsOpen} onClose={profileOnClose} user={user} />
    </>
  ) : (
    <Menu closeOnSelect={true} placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="User Menu"
        icon={<Avatar size="sm" borderRadius="full" />}
        size="sm"
        variant="ghost"
      />
      <Portal>
        <MenuList minWidth="220px" boxShadow="md" borderRadius="md" zIndex={9999} p={2}>
          <VStack spacing={2}>
            <MenuItem onClick={() => router.push(authentication.login)}>
              <Icon as={FaUser} boxSize={6} mr={2} color="blue.500" />
              <Text>Login</Text>
            </MenuItem>
            <MenuItem onClick={() => router.push(authentication.createOrganisationStep1)}>
              <Icon as={FaKey} boxSize={6} mr={2} color="blue.500" />
              <Text>Create New Account</Text>
            </MenuItem>
          </VStack>
        </MenuList>
      </Portal>
    </Menu>
  );
});

export default HeaderProfile;
