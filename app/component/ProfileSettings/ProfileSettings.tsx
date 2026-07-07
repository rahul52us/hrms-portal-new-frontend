import React from "react";
import { Box, Heading, SimpleGrid, VStack, Text, useColorModeValue, Flex, Button } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import stores from "../../store/stores";
import { sidebarDatas, sidebarFooterData } from "../../layouts/dashboardLayout/SidebarLayout/utils/SidebarItems";
import ColorPickerComponent from "../common/ColorPicker/ColorPickerComponent";
import { DeleteIcon } from "@chakra-ui/icons";

const ProfileSettings = observer(() => {
  const {
    themeStore: { themeConfig, setThemeConfig }
  } = stores;

  const allSidebarItems = [...sidebarDatas, ...sidebarFooterData];



  const handleColorChange = (name: string, newColor: { light: string; dark: string }) => {
    console.log("handleColorChange called for Name:", name, "New Color:", newColor);
    setThemeConfig(`sidebarColors.${name}`, newColor);
    console.log("Updated themeConfig:", stores.themeStore.themeConfig.sidebarColors);
  };

  const handleResetColor = (name: string) => {
    const currentColors = themeConfig.sidebarColors || {};
    const newColors = { ...currentColors };
    delete newColors[name];
    setThemeConfig("sidebarColors", newColors);
  };

  const traverseSidebarItems = (items: any[]) => {
    return items.map((item) => (
      <Box
        key={item.id}
        py={5}
        px={4}
        borderBottomWidth="1px"
        borderColor={useColorModeValue("gray.100", "gray.700")}
        _hover={{ bg: useColorModeValue("gray.50", "gray.800") }}
        transition="background 0.2s"
      >
        <Flex align="flex-start" justify="space-between" width="100%" gap={6}>
          <Box flex={1}>
            <Text fontWeight="600" fontSize="md" color={useColorModeValue("gray.700", "white")}>
              {item.name}
            </Text>
            {item.children && (
              <Text fontSize="xs" color="gray.500" mt={1}>Sub-items available</Text>
            )}
            {themeConfig.sidebarColors?.[item.name] && (
              <Button
                variant="link"
                size="xs"
                colorScheme="red"
                leftIcon={<DeleteIcon />}
                onClick={() => handleResetColor(item.name)}
                mt={2}
                fontWeight="normal"
              >
                Reset to Default
              </Button>
            )}
          </Box>
          <Box w="320px">
            <ColorPickerComponent
              label={item.name}
              color={
                themeConfig.sidebarColors?.[item.name] || {
                  light: "#ffffff",
                  dark: "#1a202c",
                }
              }
              onChangeComplete={(color: { light: string; dark: string }) =>
                handleColorChange(item.name, color)
              }
            />
          </Box>
        </Flex>
        {item.children && (
          <Box pl={6} mt={4} borderLeftWidth="2px" borderColor={useColorModeValue("blue.100", "gray.600")}>
            <VStack align="stretch" spacing={0} width="100%">
              {traverseSidebarItems(item.children)}
            </VStack>
          </Box>
        )}
      </Box>
    ));
  };

  return (
    <Box w="100%" p={4} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
      <Flex justify="space-between" align="center" mb={4} pb={4} borderBottomWidth="1px" borderColor="gray.100">
        <Box>
          <Heading size="md" color="gray.700">Sidebar Customization</Heading>
          <Text fontSize="sm" color="gray.500">
            Set custom background colors for sidebar items.
          </Text>
        </Box>
      </Flex>
      <VStack align="stretch" spacing={0}>
        {traverseSidebarItems(allSidebarItems)}
      </VStack>
    </Box>
  );
});

export default ProfileSettings;