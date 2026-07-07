"use client"; // Add this for client-side component in Next.js

import { Flex, IconButton, useColorModeValue, useMediaQuery } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { FaBars } from "react-icons/fa";
import HeaderNotification from "./HeaderNotification/HeaderNotification";
import HeaderProfile from "./HeaderProfile/HeaderProfile";
import HeaderThemeSwitch from "./HeaderThemeSwitch/HeaderThemeSwitch";
// import HeaderChatMessage from "./HeaderChatMessage/HeaderChatMessage";
// import CartContainer from "./CartContainer/CartContainer";
import stores from "../../../../../store/stores";

const HeaderNavbar = observer(() => {
  const {
    layout: { setOpenMobileSideDrawer },
  } = stores;
  const [isLargerThan1020] = useMediaQuery("(min-width: 1280px)");

  return (
    <Flex
      display="flex"
      justifyContent="flex-end"
      alignItems="center"
      width="auto"
      gap={{ base: 2, md: 3 }}
      flexShrink={0}
    >
      {isLargerThan1020 ? (
        <>
          {/* <HeaderLanguageSwitch /> */}
          <HeaderThemeSwitch />
          {/* <HeaderChatMessage />
          <HeaderNotification />
          <CartContainer /> */}
          <HeaderNotification />
          <HeaderProfile />
        </>
      ) : (
        <IconButton
          aria-label="Open navigation"
          fontSize="lg"
          size="sm"
          _hover={{ color: useColorModeValue("brand.500", "brand.200"), bg: useColorModeValue("brand.50", "gray.700") }}
          _active={{ bg: useColorModeValue("brand.100", "gray.800") }}
          onClick={() => setOpenMobileSideDrawer(true)}
          borderRadius="xl"
          icon={<FaBars />}
        />
      )}
    </Flex>
  );
});

export default HeaderNavbar;
