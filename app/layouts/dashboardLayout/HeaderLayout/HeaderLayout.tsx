"use client";

import { Flex, useBreakpointValue, useColorMode, useTheme } from "@chakra-ui/react";
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
      minH={{ base: "64px", md: "68px", xl: headerHeight }}
      px={{ base: 3, md: 4, xl: 6 }}
      py={{ base: 2, md: 2.5 }}
      gap={{ base: 3, md: 4 }}
      bg={isDark 
        ? "linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1e1e2e 100%)" 
        : `linear-gradient(135deg, #ffffff 0%, ${accentColor}12 30%, ${brandColor}1F 80%)`
      }
      borderBottom={isDark ? "1px solid rgba(255, 255, 255, 0.08)" : `1px solid ${brandColor}26`}
      boxShadow={isDark 
        ? "0 4px 12px rgba(0, 0, 0, 0.3)" 
        : `0 1px 3px rgba(30, 40, 100, 0.06), 0 4px 16px ${brandColor}1F`
      }
      color={isDark ? "#e2e8f0" : "#1e2850"}
      transition="all 0.3s ease"
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
