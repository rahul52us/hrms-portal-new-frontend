"use client";

import { Flex, useBreakpointValue, useColorMode, useTheme, Box } from "@chakra-ui/react";
import HeaderNavbar from "./component/HeaderNavbar/HeaderNavbar";
import HeaderLogo from "./component/Logo/HeaderLogo";
import HeaderCompanySelector from "./component/CompanySelector/HeaderCompanySelector";
// import HeaderWorkflowSelector from "./component/WorkflowSelector/HeaderWorkflowSelector";
import { observer } from "mobx-react-lite";
import { headerHeight } from "../../../component/config/utils/variable";


const HeaderLayout = observer(() => {
  const { colorMode } = useColorMode();
  const theme = useTheme();
  const isCompactLayout = useBreakpointValue({ base: true, xl: false }) ?? false;

  const isDark = colorMode === "dark";
  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;
  const brandColor = brandScale[500] || "#2563EB";
  const accentColor = brandScale[400] || brandColor;

  return (
    <Flex
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      minH={{ base: "64px", md: headerHeight }}
      h={{ base: "64px", md: headerHeight }}
      px={{ base: 4, md: 5, xl: 8 }}
      py={{ base: 2, md: 3 }}
      gap={{ base: 3, md: 4 }}
      bg={isDark
        ? "#111827"
        : "#ffffff"
      }
      borderBottom={isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(226, 232, 240, 0.8)"}
      boxShadow={isDark
        ? "0 10px 40px -10px rgba(0,0,0,0.5)"
        : "0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02)"
      }
      color={isDark ? "#e2e8f0" : "#1e2850"}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      position="sticky"
      top="0"
      zIndex="1000"
    >

      <Flex flex="1" minW={0} align="center" gap={{ base: 2, md: 3 }}>
        <HeaderLogo />
        {!isCompactLayout ? <HeaderCompanySelector /> : null}
        {/* <HeaderWorkflowSelector /> */}
      </Flex>
      <HeaderNavbar />
    </Flex>
  );
});

export default HeaderLayout;
