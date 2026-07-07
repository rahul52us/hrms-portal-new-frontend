"use client";

import { Flex, IconButton, useBreakpointValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi";
import stores from "../../../../../store/stores";
import SearchBar from "../HeaderNavbar/SearchBar/SearchBar";

const HeaderLogo = observer(() => {
  const isLargerThanXl = useBreakpointValue({ xl: true }) ?? false;

  const {
    layout: { fullScreenMode, openDashSidebarFun, isCallapse },
  } = stores;

  return (
    <Flex width="100%" minW={0} alignItems="center" gap={{ base: 2, md: 3 }}>
      {isLargerThanXl && (
        <Flex alignItems="center" flexShrink={0}>
          {/* Sidebar collapse/expand toggle */}
          <IconButton
            aria-label="Toggle sidebar"
            icon={
              isCallapse ? (
                <BiRightArrowAlt fontSize={20} />
              ) : (
                <BiLeftArrowAlt fontSize={20} />
              )
            }
            onClick={() => openDashSidebarFun()}
            isRound
            bg="gray.700"
            color="white"
            fontSize="lg"
            w={{ xl: "38px", "2xl": "40px" }}
            h={{ xl: "38px", "2xl": "40px" }}
            minW={{ xl: "38px", "2xl": "40px" }}
            _hover={{ bg: "blue.500", transform: "scale(1.05)" }}
            _active={{ bg: "blue.600", transform: "scale(0.97)" }}
            transition="all 0.2s ease"
            sx={{ marginRight: "0.75rem", marginTop: "2px" }}
          />

          {/* Fullscreen toggle — kept hidden as per original */}
          <IconButton
            aria-label="open the drawer button"
            icon={
              fullScreenMode ? (
                <BiRightArrowAlt fontSize={20} />
              ) : (
                <BiLeftArrowAlt fontSize={20} />
              )
            }
            onClick={() => openDashSidebarFun()}
            isRound
            bg="gray.700"
            color="white"
            fontSize="xl"
            w="40px"
            h="40px"
            minW="40px"
            _hover={{ bg: "blue.500", transform: "scale(1.05)" }}
            _active={{ bg: "blue.600", transform: "scale(0.97)" }}
            transition="all 0.2s ease"
            sx={{ marginRight: "1rem", marginTop: "2px" }}
            display="none"
          />
        </Flex>
      )}
      <SearchBar />
    </Flex>
  );
});

export default HeaderLogo;
