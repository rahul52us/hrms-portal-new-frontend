"use client";

import { useEffect, useState } from "react";
import { IconButton, useColorMode, useTheme } from "@chakra-ui/react";
import { BiMoon, BiSun } from "react-icons/bi";

const HeaderThemeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    typeof window !== "undefined" ? colorMode === "dark" : false
  );
  const [isMounted, setIsMounted] = useState(false);
  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;
  const lightIconColor = brandScale[500] || "#6366f1";
  const lightBg = `${lightIconColor}1A`;
  const lightHoverBg = `${lightIconColor}33`;
  const lightActiveBg = `${lightIconColor}4D`;

  useEffect(() => {
    setIsMounted(true);
    setIsDarkMode(colorMode === "dark");
  }, [colorMode]);

  const toggleMode = () => {
    toggleColorMode();
    setIsDarkMode(!isDarkMode);
  };

  if (!isMounted) {
    return (
      <IconButton
        icon={<BiMoon />}
        onClick={toggleMode}
        aria-label="Toggle theme"
        fontSize="xl"
        color={colorMode === "dark" ? "#fbbf24" : lightIconColor}
        bg={colorMode === "dark" ? "rgba(255, 255, 255, 0.1)" : lightBg}
        borderRadius="full"
        w="40px"
        h="40px"
        minW="40px"
        _hover={{ 
          bg: colorMode === "dark" ? "rgba(255, 255, 255, 0.15)" : lightHoverBg, 
          transform: "scale(1.05)" 
        }}
        _active={{ 
          bg: colorMode === "dark" ? "rgba(255, 255, 255, 0.2)" : lightActiveBg, 
          transform: "scale(0.97)" 
        }}
        transition="all 0.2s ease"
      />
    );
  }

  return (
    <IconButton
      icon={isDarkMode ? <BiSun /> : <BiMoon />}
      onClick={toggleMode}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      fontSize="xl"
      color={isDarkMode ? "#fbbf24" : lightIconColor}
      bg={isDarkMode ? "rgba(255, 255, 255, 0.1)" : lightBg}
      borderRadius="full"
      w="40px"
      h="40px"
      minW="40px"
      _hover={{ 
        bg: isDarkMode ? "rgba(255, 255, 255, 0.15)" : lightHoverBg, 
        transform: "scale(1.05)" 
      }}
      _active={{ 
        bg: isDarkMode ? "rgba(255, 255, 255, 0.2)" : lightActiveBg, 
        transform: "scale(0.97)" 
      }}
      transition="all 0.2s ease"
    />
  );
};

export default HeaderThemeSwitch;
