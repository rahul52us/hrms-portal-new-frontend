'use client'

import { PERMISSION_KEYS, hasAnyCourseViewPermission, hasPermission } from '@/app/config/utils/permissions';
import { isLearnerRole, isManagerRole } from '@/app/config/utils/roleAccess';
import stores from '@/app/store/stores';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  Link as ChakraLink,
  Collapse,
  Container,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiGrid, FiHome, FiMenu, FiUser } from 'react-icons/fi';
import UserProfileDrawer from './UserProfileDrawer';

interface NavLink {
  href: string;
  label: string;
}

const Header: React.FC = observer(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();
  const user = stores.auth.user;
  const role = String(stores.auth.userType || user?.role || '').toLowerCase();
  const isLoggedIn = Boolean(user);
  const isLearner = isLoggedIn && isLearnerRole(role);
  const isManagerUser = isLoggedIn && isManagerRole(role);
  const appHref = role === 'superadmin'
    ? '/dashboard/companies'
    : hasPermission(user, PERMISSION_KEYS.VIEW_USERS)
      ? '/dashboard/users'
      : hasAnyCourseViewPermission(user)
        ? '/dashboard/course'
        : hasPermission(user, PERMISSION_KEYS.VIEW_BATCHES)
          ? '/dashboard/batches'
          : '/course';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks: NavLink[] = useMemo(() => ([
    { href: '/', label: 'Home' },
    { href: '/course', label: 'Courses' },
    ...(isLearner ? [{ href: '/batches', label: 'Batches' }] : []),
    ...(isManagerUser ? [{ href: '/manager', label: 'Learners' }] : []),
    { href: '/about-us', label: 'About Us' },
    { href: '/contact-us', label: 'Contact Us' },
  ]), [isLearner, isManagerUser]);

  const bottomNavLinks = useMemo(
    () => [
      { href: '/', label: 'Home', icon: FiHome },
      { href: '/course', label: 'Courses', icon: FiBookOpen },
      ...(isLearner ? [{ href: '/batches', label: 'Batches', icon: FiGrid }] : []),
      ...(isLoggedIn ? [{ href: appHref, label: isLearner ? 'My' : 'App', icon: FiUser }] : [{ href: '/login', label: 'Login', icon: FiUser }]),
    ],
    [appHref, isLearner, isLoggedIn]
  );

  const handleLogout = () => {
    stores.auth.logout();
    setMobileMenuOpen(false);
    setIsProfileOpen(false);
    router.push('/login');
  };

  const displayName = user?.name || user?.username || 'Account';

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top="0"
        zIndex="1000"
        bg={scrolled ? (colorMode === 'light' ? 'rgba(255, 255, 255, 0.78)' : 'rgba(17, 24, 39, 0.85)') : (colorMode === 'light' ? 'white' : 'gray.900')}
        backdropFilter={scrolled ? 'blur(16px)' : 'none'}
        borderBottom="1px solid"
        borderColor={scrolled ? (colorMode === 'light' ? 'gray.100' : 'gray.700') : 'transparent'}
        transition="all 0.35s ease"
        py={{ base: 2, md: scrolled ? 2 : 4 }}
      >
        <Container maxW="1400px" px={{ base: 3, md: 6 }}>
          <Flex align="center" justify="space-between" gap={4}>
            <NextLink href="/">
              <ChakraLink _hover={{ textDecoration: 'none' }} display="flex" alignItems="center" gap={{ base: 1, md: 3 }}>
                <Box transition="transform 0.4s ease" _hover={{ transform: 'scale(1.06) rotate(-2deg)' }}>
                  <Image
                    src="https://www.lmscert.com/Logo%20LMS%20-1-.svg"
                    alt="CRAFT LMS Logo"
                    h={{ base: '32px', md: '48px' }}
                    objectFit="contain"
                  />
                </Box>
                <Text
                  fontWeight="900"
                  fontSize={{ base: 'md', lg: '2xl' }}
                  letterSpacing="-1px"
                    bgGradient={colorMode === 'light' ? 'linear(to-tr, brand.600, brand.400)' : 'linear(to-tr, brand.400, brand.200)'}
                  bgClip="text"
                  display={{ base: 'none', lg: 'block' }}
                >
                  CRAFT
                </Text>
              </ChakraLink>
            </NextLink>

            <HStack
              gap={1}
              display={{ base: 'none', md: 'flex' }}
              bg={colorMode === 'light' ? 'gray.50' : 'gray.800'}
              p={1}
              borderRadius="full"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <NextLink key={link.href} href={link.href} passHref legacyBehavior>
                    <ChakraLink
                      px={5}
                      py={2}
                      fontSize="sm"
                      fontWeight="600"
                      borderRadius="full"
                      color={isActive ? (colorMode === 'light' ? 'brand.700' : 'brand.300') : (colorMode === 'light' ? 'gray.600' : 'gray.300')}
                      bg={isActive ? (colorMode === 'light' ? 'brand.50' : 'brand.900') : 'transparent'}
                      boxShadow={isActive ? 'sm' : 'none'}
                      transition="all 0.25s ease"
                      _hover={{
                        color: colorMode === 'light' ? 'brand.700' : 'brand.300',
                        bg: colorMode === 'light' ? 'white' : 'gray.700',
                        textDecoration: 'none',
                        transform: 'translateY(-1px)'
                      }}
                    >
                      {link.label}
                    </ChakraLink>
                  </NextLink>
                );
              })}
            </HStack>

            <HStack gap={3}>
              <IconButton
                aria-label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="outline"
                size="md"
                borderColor={colorMode === 'light' ? 'brand.200' : 'brand.600'}
                color={colorMode === 'light' ? 'brand.600' : 'brand.400'}
                bg={colorMode === 'light' ? 'white' : 'gray.800'}
                _hover={{
                  bg: colorMode === 'light' ? 'brand.50' : 'gray.700',
                  borderColor: 'brand.500',
                  transform: 'scale(1.05)'
                }}
                _active={{ transform: 'scale(0.95)' }}
                transition="all 0.2s"
                display={{ base: 'none', sm: 'flex' }}
                borderRadius="full"
              />

              {isLoggedIn ? (
                <>
                  <ChakraLink
                    as={NextLink}
                    href={appHref}
                    display={{ base: 'none', md: 'flex' }}
                    bg={colorMode === 'light' ? 'white' : 'gray.800'}
                    border="1px solid"
                    borderColor={colorMode === 'light' ? 'brand.600' : 'brand.400'}
                    color={colorMode === 'light' ? 'brand.600' : 'brand.400'}
                    px={6}
                    py={2}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize="sm"
                    _hover={{
                      bg: colorMode === 'light' ? 'brand.600' : 'brand.500',
                      color: 'white',
                      transform: 'translateY(-1px)',
                      textDecoration: 'none',
                    }}
                    transition="all 0.2s"
                  >
                    {isLearner ? 'My Learning' : 'Dashboard'}
                  </ChakraLink>

                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      p={1}
                      h="auto"
                      borderRadius="full"
                      display={{ base: 'none', md: 'inline-flex' }}
                      _hover={{ bg: colorMode === 'light' ? 'brand.50' : 'gray.800' }}
                    >
                      <HStack spacing={3}>
                        <Avatar
                          size="sm"
                          name={displayName}
                          src={user?.pic?.url || ''}
                          bg="brand.600"
                          color="white"
                        />
                        <Box textAlign="left" display={{ base: 'none', lg: 'block' }}>
                          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                            {displayName}
                          </Text>
                          <Text fontSize="xs" color="gray.500" textTransform="capitalize" noOfLines={1}>
                            {String(user?.role || '').replace(/_/g, ' ')}
                          </Text>
                        </Box>
                      </HStack>
                    </MenuButton>
                    <MenuList borderRadius="2xl" p={2}>
                      <Box px={3} py={2}>
                        <Text fontWeight="bold" noOfLines={1}>{displayName}</Text>
                        <Text fontSize="sm" color="gray.500" noOfLines={1}>{user?.username || ''}</Text>
                      </Box>
                      <MenuItem borderRadius="xl" onClick={() => router.push('/user-profile')}>
                        View profile
                      </MenuItem>
                      <MenuItem borderRadius="xl" as={NextLink} href={appHref}>
                        {isLearner ? 'Go to learning' : 'Open dashboard'}
                      </MenuItem>
                      <MenuItem borderRadius="xl" color="red.500" onClick={handleLogout}>
                        Logout
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </>
              ) : (
                <ChakraLink
                  as={NextLink}
                  href="/login"
                  display={{ base: 'none', sm: 'flex' }}
                  bg={colorMode === 'light' ? 'white' : 'gray.800'}
                  border="1px solid"
                  borderColor={colorMode === 'light' ? 'brand.600' : 'brand.400'}
                  color={colorMode === 'light' ? 'brand.600' : 'brand.400'}
                  px={7}
                  py={2}
                  borderRadius="full"
                  fontWeight="bold"
                  fontSize="sm"
                  _hover={{
                    bg: colorMode === 'light' ? 'brand.600' : 'brand.500',
                    color: 'white',
                    transform: 'translateY(-1px)',
                    textDecoration: 'none',
                  }}
                  transition="all 0.2s"
                >
                  Login
                </ChakraLink>
              )}

              <Button
                display={{ base: 'flex', md: 'none' }}
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Menu"
                rounded="lg"
                minH="44px"
                minW="44px"
                p={0}
                _hover={{ bg: colorMode === 'light' ? 'brand.50' : 'gray.700' }}
              >
                <Box w="22px" h="22px" position="relative">
                  <Box
                    position="absolute"
                    h="2px"
                    w="100%"
                    bg="brand.600"
                    borderRadius="full"
                    transition="0.3s"
                    top={mobileMenuOpen ? '50%' : '25%'}
                    transform={mobileMenuOpen ? 'rotate(45deg)' : 'none'}
                  />
                  <Box
                    position="absolute"
                    h="2px"
                    w="100%"
                    bg="brand.600"
                    borderRadius="full"
                    transition="0.3s"
                    bottom={mobileMenuOpen ? '50%' : '25%'}
                    transform={mobileMenuOpen ? 'rotate(-45deg)' : 'none'}
                  />
                </Box>
              </Button>
            </HStack>
          </Flex>
        </Container>

        <Collapse in={mobileMenuOpen} animateOpacity>
          <Box
            bg={colorMode === 'light' ? 'white' : 'gray.800'}
            mx={{ base: 2, sm: 4 }}
            mt={3}
            shadow="lg"
            borderRadius="2xl"
            border="1px solid"
            borderColor={colorMode === 'light' ? 'gray.100' : 'gray.700'}
            display={{ base: 'block', md: 'none' }}
            overflow="hidden"
            transformOrigin="top"
          >
            <Stack p={{ base: 3, sm: 4 }} gap={{ base: 2, sm: 3 }}>
              {isLoggedIn ? (
                <Box borderWidth="1px" borderColor={colorMode === 'light' ? 'gray.100' : 'gray.700'} borderRadius="xl" p={3}>
                  <HStack spacing={3}>
                    <Avatar size="md" name={displayName} src={user?.pic?.url || ''} bg="brand.600" color="white" />
                    <Box>
                      <Text fontWeight="bold">{displayName}</Text>
                      <Text fontSize="sm" color="gray.500">{user?.username || ''}</Text>
                    </Box>
                  </HStack>
                </Box>
              ) : null}

              {navLinks.map((link) => (
                <NextLink key={link.href} href={link.href}>
                  <ChakraLink
                    p={{ base: '12px 14px', sm: '14px 16px' }}
                    borderRadius="lg"
                    fontWeight="600"
                    fontSize={{ base: 'sm', sm: 'md' }}
                    color={pathname === link.href ? (colorMode === 'light' ? 'brand.600' : 'brand.300') : (colorMode === 'light' ? 'gray.700' : 'gray.200')}
                    bg={pathname === link.href ? (colorMode === 'light' ? 'brand.50' : 'brand.900') : 'transparent'}
                    _hover={{
                      bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                      textDecoration: 'none',
                      transform: 'translateX(4px)'
                    }}
                    transition="all 0.2s"
                    minH="44px"
                    display="flex"
                    alignItems="center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </ChakraLink>
                </NextLink>
              ))}

              <Box h="1px" bg={colorMode === 'light' ? 'gray.100' : 'gray.700'} my={2} />

              <Button
                onClick={toggleColorMode}
                variant="ghost"
                leftIcon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                justifyContent="flex-start"
                p={{ base: '12px 14px', sm: '14px 16px' }}
                borderRadius="lg"
                fontSize={{ base: 'sm', sm: 'md' }}
                fontWeight="600"
                color={colorMode === 'light' ? 'gray.700' : 'gray.200'}
                minH="44px"
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.700' }}
                w="100%"
              >
                {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
              </Button>

              {isLoggedIn ? (
                <>
                  <Button
                    variant="outline"
                    borderRadius="lg"
                    minH="48px"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                  >
                    View profile
                  </Button>
                  <Button
                    as={NextLink}
                    href={appHref}
                    colorScheme="blue"
                    borderRadius="lg"
                    minH="48px"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isLearner ? 'My Learning' : 'Dashboard'}
                  </Button>
                  <Button
                    variant="ghost"
                    colorScheme="red"
                    borderRadius="lg"
                    minH="48px"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <NextLink href="/login">
                  <ChakraLink
                    p={{ base: '14px', sm: '16px' }}
                    borderRadius="lg"
                    fontWeight="bold"
                    fontSize={{ base: 'sm', sm: 'md' }}
                    color="white"
                    bg={colorMode === 'light' ? 'brand.600' : 'brand.500'}
                    textAlign="center"
                    minH="48px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => setMobileMenuOpen(false)}
                    _hover={{
                      textDecoration: 'none',
                      bg: colorMode === 'light' ? 'brand.700' : 'brand.600',
                      transform: 'translateY(-2px)'
                    }}
                    transition="all 0.2s"
                  >
                    Login
                  </ChakraLink>
                </NextLink>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Box>

      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        left="0"
        right="0"
        bottom="0"
        zIndex="1000"
        px={3}
        pt={2}
        pb="calc(8px + env(safe-area-inset-bottom))"
        bg={colorMode === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(17,24,39,0.94)'}
        borderTop="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        backdropFilter="blur(18px)"
      >
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${bottomNavLinks.length + 1}, minmax(0, 1fr))`}
          gap={1}
          maxW="520px"
          w="full"
          mx="auto"
        >
          {bottomNavLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <ChakraLink
                key={link.href}
                as={NextLink}
                href={link.href}
                w="full"
                minW={0}
                minH="50px"
                borderRadius="xl"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={1}
                color={isActive ? (colorMode === 'light' ? 'brand.600' : 'brand.300') : (colorMode === 'light' ? 'gray.500' : 'gray.400')}
                bg={isActive ? (colorMode === 'light' ? 'brand.50' : 'whiteAlpha.100') : 'transparent'}
                fontSize="10px"
                fontWeight="700"
                transition="all 0.2s ease"
                onClick={() => setMobileMenuOpen(false)}
                _hover={{ textDecoration: 'none', bg: colorMode === 'light' ? 'brand.50' : 'whiteAlpha.100', transform: 'translateY(-1px)' }}
                _active={{ transform: 'scale(0.96)' }}
              >
                <Icon as={link.icon} boxSize={5} />
                <Text lineHeight="1" noOfLines={1}>{link.label}</Text>
              </ChakraLink>
            );
          })}
          <Button
            flex="1"
            w="full"
            minW={0}
            minH="50px"
            borderRadius="xl"
            px={0}
            variant="ghost"
            display="flex"
            flexDirection="column"
            gap={1}
            fontSize="10px"
            fontWeight="700"
            color={mobileMenuOpen ? (colorMode === 'light' ? 'brand.600' : 'brand.300') : (colorMode === 'light' ? 'gray.500' : 'gray.400')}
            bg={mobileMenuOpen ? (colorMode === 'light' ? 'brand.50' : 'whiteAlpha.100') : 'transparent'}
            transition="all 0.2s ease"
            _hover={{ bg: colorMode === 'light' ? 'brand.50' : 'whiteAlpha.100', transform: 'translateY(-1px)' }}
            _active={{ transform: 'scale(0.96)' }}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Icon as={FiMenu} boxSize={5} />
            <Text lineHeight="1">More</Text>
          </Button>
        </Box>
      </Box>

      <UserProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
});

export default Header;
