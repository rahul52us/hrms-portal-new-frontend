"use client";
import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  VStack,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  useBreakpointValue,
  Tooltip,
  useTheme,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { getSidebarDataByRole, sidebarFooterData } from "./utils/SidebarItems";
import { observer } from "mobx-react-lite";
import { useRouter, usePathname } from "next/navigation";
import SidebarLogo from "./component/SidebarLogo";
import stores from "../../../store/stores";
import { FaCircle } from "react-icons/fa";
import {
  mediumSidebarWidth,
  sidebarWidth,
} from "../../../component/config/utils/variable";
import { hasPermission } from "@/app/config/utils/permissions";

export interface SidebarItem {
  id: number;
  name: string;
  icon: React.ReactElement;
  url: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onItemClick: any;
  onLeafItemClick: any;
  openMobileSideDrawer: boolean;
  setOpenMobileSideDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

const ACTIVE_BG = "rgba(255,255,255,0.1)";
const HOVER_BG = "rgba(255,255,255,0.06)";
const ACTIVE_TEXT = "rgba(255,255,255,0.95)"; // soft white (not harsh)
const INACTIVE_TEXT = "rgba(255,255,255,0.65)"; // better readability
const BORDER_COLOR = "rgba(255,255,255,0.07)";
const ICON_ACTIVE = "#FFFFFF";
const ICON_INACTIVE = "rgba(255,255,255,0.4)";

const renderIcon = (depth: number, icon: any, isActive: boolean) => {
  const active_color = "rgba(255,255,255,0.95)";
  const inactive_color = "rgba(255,255,255,0.55)";

  // Small dot icons (sub items)
  if (depth === 1) {
    return (
      <Icon
        as={FaCircle}
        boxSize={1.5}
        color={isActive ? active_color : inactive_color}
        opacity={isActive ? 1 : 0.7}
      />
    );
  }

  if (depth > 1) {
    return (
      <Icon
        as={FaCircle}
        boxSize={1}
        color={isActive ? active_color : inactive_color}
        opacity={isActive ? 1 : 0.6}
      />
    );
  }

  // MAIN ICON (top-level items)
  return (
    <Icon
      as={icon.type}
      boxSize={4}
      color={isActive ? active_color : inactive_color}
      transition="all 0.2s ease"
      transform={isActive ? "scale(1.1)" : "scale(1)"}
      filter={isActive ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none"}
    />
  );
};

const findPathToActiveItem = (
  items: SidebarItem[],
  activeItemId: number,
): number[] => {
  const path: number[] = [];
  const findPath = (
    items: SidebarItem[],
    id: number,
    currentPath: number[],
  ): boolean => {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.id === id) {
        path.push(...currentPath, index);
        return true;
      }
      if (item.children && findPath(item.children, id, [...currentPath, index]))
        return true;
    }
    return false;
  };
  findPath(items, activeItemId, []);
  return path;
};

const checkIsActive = (
  item: SidebarItem,
  activeItemId: number | null,
): boolean => {
  if (item.id === activeItemId) return true;
  if (item.children)
    return item.children.some((child) => checkIsActive(child, activeItemId));
  return false;
};

const findItemIdByUrl = (
  items: SidebarItem[],
  url: string,
): number | null => {
  for (let item of items) {
    if (item.url === url) return item.id;
    if (item.children) {
      const found = findItemIdByUrl(item.children, url);
      if (found !== null) return found;
    }
  }
  return null;
};

const SidebarPopover = observer(
  ({
    item,
    depth,
    onClick,
    onLeafClick,
    isCollapsed,
    activeItemId,
  }: {
    item: SidebarItem;
    depth: number;
    onClick: any;
    onLeafClick: any;
    isCollapsed: boolean;
    activeItemId: number | null;
  }) => {
    const {
      themeStore: { themeConfig },
    } = stores;
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const theme = useTheme();
    const primaryColor = ((theme.colors?.brand || {}) as Record<number, string>)[500]
      || themeConfig.colors.custom.light.primary;
    const itemIsActive = checkIsActive(item, activeItemId);
    const isLeaf = !item.children || item.children.length === 0;

    const handleMouseEnter = () => {
      if (item.children && item.children.length > 0 && isCollapsed)
        setIsPopoverOpen(true);
    };

    const handleItemClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPopoverOpen(false);
      if (!item.children) onLeafClick(item);
      else onClick(item);
    };

    const ItemContent = (
      <Flex
        align="center"
        width="100%"
        onMouseEnter={handleMouseEnter}
        onClick={handleItemClick}
        position="relative"
      >
        <Flex
          align="center"
          justify={depth === 0 && isCollapsed ? "center" : "flex-start"}
          width="100%"
          cursor="pointer"
          py={depth === 0 ? 2.5 : 2}
          px={3}
          mx={1}
          bg={itemIsActive ? "rgba(255,255,255,0.18)" : "transparent"}
          boxShadow={itemIsActive ? "0 4px 12px rgba(0,0,0,0.25)" : "none"}
          color={itemIsActive ? ACTIVE_TEXT : INACTIVE_TEXT}
          fontWeight={itemIsActive ? "600" : "400"}
          fontSize="sm"
          transition="all 0.15s ease"
          borderRadius="12px"
          borderLeft={itemIsActive ? "3px solid" : "3px solid transparent"}
         borderColor={itemIsActive ? primaryColor : "transparent"}
          _hover={{
            bg: "rgba(255,255,255,0.12)",
            transform: "translateX(4px)",
          }}
        >
          <Box
            as="span"
            display="flex"
            alignItems="center"
            mr={depth === 0 && isCollapsed ? 0 : 2}
          >
            {renderIcon(depth, item.icon, itemIsActive)}
          </Box>
          {!(depth === 0 && isCollapsed) && (
            <Flex flex={1} align="center" justify="space-between">
              <Text
                fontSize="sm"
                fontWeight={itemIsActive ? "600" : "400"}
                color={itemIsActive ? ACTIVE_TEXT : INACTIVE_TEXT}
                bgGradient="linear(to-r, white, rgba(255,255,255,0.8))"
                bgClip="text"
                textShadow={
                  itemIsActive ? "0 0 8px rgba(255,255,255,0.4)" : "none"
                }
              >
                {item.name}
              </Text>
              {item.children && <ChevronRightIcon color={ICON_INACTIVE} />}
            </Flex>
          )}
        </Flex>
      </Flex>
    );

    if (depth > 0 && isLeaf) return ItemContent;

    return (
      <Popover
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        placement="right-start"
        closeOnBlur={false}
        trigger="hover"
        gutter={0}
      >
        <PopoverTrigger>
          <Box w="100%" display="inline-block">
            <Tooltip
              label={item.name}
              isDisabled={
                !isCollapsed ||
                (!!item.children && item.children.length > 0) ||
                depth > 0
              }
              placement="right"
              hasArrow
              bg="gray.700"
              color="white"
              px={3}
              py={2}
              borderRadius="md"
              fontSize="sm"
              zIndex={100}
            >
              {ItemContent}
            </Tooltip>
          </Box>
        </PopoverTrigger>
        {item.children && (
          <Portal>
            <PopoverContent
              zIndex={15}
              w="200px"
              onMouseEnter={handleMouseEnter}
              bg="#1A1D27"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              boxShadow="0 8px 32px rgba(0,0,0,0.4)"
              borderRadius="10px"
              overflow="hidden"
            >
              <PopoverHeader
                bg="#13151E"
                borderBottom="1px solid"
                borderColor="rgba(255,255,255,0.08)"
                px={4}
                py={3}
              >
                <Flex align="center" justify="space-between">
                  <Text fontSize="sm" fontWeight="600" color="white">
                    {item.name}
                  </Text>
                  <ChevronDownIcon color={ICON_INACTIVE} />
                </Flex>
              </PopoverHeader>
              <PopoverBody p={2}>
                <VStack align="start" spacing={0.5}>
                  {item.children.map((child) => (
                    <SidebarPopover
                      key={child.id}
                      item={child}
                      depth={depth + 1}
                      onClick={onClick}
                      onLeafClick={onLeafClick}
                      isCollapsed={isCollapsed}
                      activeItemId={activeItemId}
                    />
                  ))}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        )}
      </Popover>
    );
  },
);

const SidebarAccordion = observer(
  ({
    items,
    depth = 0,
    onClick,
    onLeafClick,
    activeItemId,
    expandedPath,
  }: {
    items: SidebarItem[];
    depth?: number;
    onClick: any;
    onLeafClick: any;
    activeItemId: number | null;
    expandedPath: number[];
  }) => {
    const {
      themeStore: { themeConfig },
    } = stores;
    const theme = useTheme();
    const primaryColor = ((theme.colors?.brand || {}) as Record<number, string>)[500]
      || themeConfig.colors.custom.light.primary;
    const expandedIndex =
      expandedPath.length > depth ? expandedPath[depth] : null;

    return (
      <Accordion
        width="100%"
        px={2}
        allowMultiple
        defaultIndex={expandedIndex !== null ? [expandedIndex] : []}
      >
        {items.map((item) => {
          const itemIsActive = checkIsActive(item, activeItemId);

          return (
            <AccordionItem key={item.id} border="none" width="100%">
              {() => (
                <>
                  <AccordionButton
                    my={0.5}
                    px={3}
                    py={2.5}
                    borderRadius="8px"
                    bg={itemIsActive ? ACTIVE_BG : "transparent"}
                    color={itemIsActive ? ACTIVE_TEXT : INACTIVE_TEXT}
                    fontWeight={itemIsActive ? "600" : "400"}
                    fontSize="sm"
                    transition="all 0.15s ease"
                    _focus={{ boxShadow: "none" }}
                    _hover={{ bg: HOVER_BG, color: ACTIVE_TEXT }}
                    borderLeft={
                      itemIsActive ? "3px solid" : "3px solid transparent"
                    }
                    borderColor={itemIsActive ? primaryColor : "transparent"}
                    borderRightRadius="8px"
                    borderLeftRadius={itemIsActive ? "0" : "8px"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!item.children) onLeafClick(item);
                      else onClick(item);
                    }}
                  >
                    <Flex
                      align="center"
                      justify="space-between"
                      width="100%"
                      cursor="pointer"
                    >
                      <Flex align="center" gap={3}>
                        <Box as="span" display="flex" alignItems="center">
                          {renderIcon(depth, item.icon, itemIsActive)}
                        </Box>
                        <Text
                          fontSize="sm"
                          fontWeight={itemIsActive ? "600" : "400"}
                          color={itemIsActive ? ACTIVE_TEXT : INACTIVE_TEXT}
                        >
                          {item.name}
                        </Text>
                      </Flex>
                      {item.children && (
                        <AccordionIcon color={ICON_INACTIVE} fontSize="14px" />
                      )}
                    </Flex>
                  </AccordionButton>
                  {item.children && (
                    <AccordionPanel pl={0} pr={0} pb={0} mt="-2px">
                      <VStack align="start" spacing={0}>
                        <SidebarAccordion
                          items={item.children}
                          depth={depth + 1}
                          onClick={onClick}
                          onLeafClick={onLeafClick}
                          activeItemId={activeItemId}
                          expandedPath={expandedPath}
                        />
                      </VStack>
                    </AccordionPanel>
                  )}
                </>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  },
);

const SidebarLayout: React.FC<SidebarProps> = observer(
  ({
    isCollapsed,
    onItemClick,
    onLeafItemClick,
    openMobileSideDrawer,
    setOpenMobileSideDrawer,
  }) => {
    const {
      auth: { user },
      themeStore: { themeConfig },
    } = stores;
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useBreakpointValue({ base: true, xl: false }) ?? false;
    const theme = useTheme();
    const brandScale = (theme.colors?.brand || {}) as Record<number, string>;
    const accentScale = (theme.colors?.purple || {}) as Record<number, string>;
    const sidebarGradient = `linear-gradient(180deg, ${brandScale[900] || "#1a0533"} 0%, ${accentScale[800] || brandScale[700] || "#2d1b69"} 45%, ${brandScale[600] || "#4a1d96"} 100%)`;
    const sidebarGradientDark = `linear-gradient(180deg, #12021f 0%, ${brandScale[900] || "#1e0a4a"} 52%, ${accentScale[800] || brandScale[800] || "#3b0764"} 100%)`;

    const [sidebarData, setSidebarData] = useState<SidebarItem[]>([]);
    const [footerItems, setFooterItems] = useState<SidebarItem[]>([]);
    const [activeItemId, setActiveItemId] = useState<number | null>(1);

    useEffect(() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("activeSidebarItemId");
        if (stored) setActiveItemId(parseInt(stored, 10));
      }
    }, []);

    useEffect(() => {
      if (user?.userType || user?.role) {
        const roles = Array.from(
          new Set(
            [user.userType, user.role]
              .filter(Boolean)
              .flatMap((item: string) => [item, String(item).toLowerCase()])
          )
        );
        setSidebarData(getSidebarDataByRole(roles, user));
        setFooterItems(
          sidebarFooterData.filter(
            (item: any) => !item.permissionKey || hasPermission(user, item.permissionKey)
          )
        );
      }

      const companyColors = user?.companyDetails?.sidebarColors;
      if (companyColors && Object.keys(companyColors).length > 0) {
        const currentStoreColors = themeConfig.sidebarColors || {};
        if (
          JSON.stringify(companyColors) !== JSON.stringify(currentStoreColors)
        ) {
          stores.themeStore.setThemeConfig("sidebarColors", companyColors);
        }
      }
    }, [user, themeConfig.sidebarColors]);

    // Update active item based on current URL pathname
    useEffect(() => {
      if (sidebarData.length > 0 && pathname) {
        const itemId = findItemIdByUrl(sidebarData, pathname);
        if (itemId !== null) {
          setActiveItemId(itemId);
        }
      }
    }, [pathname, sidebarData]);

    useEffect(() => {
      if (activeItemId !== null && typeof window !== "undefined") {
        localStorage.setItem("activeSidebarItemId", activeItemId.toString());
      }
    }, [activeItemId]);

    const handleLeafItemClick = (item: SidebarItem) => {
      setActiveItemId(item.id);
      onLeafItemClick(item);
      router.push(item.url);
    };

    useEffect(() => {
      if (!isMobile) setOpenMobileSideDrawer(false);
    }, [isMobile, setOpenMobileSideDrawer]);

    const expandedPath =
      activeItemId !== null
        ? findPathToActiveItem(sidebarData, activeItemId)
        : [];

    console.log(
      "SidebarLayout Rendered. ThemeConfig:",
      themeConfig.sidebarColors,
    );

    return (
      <>
        <Drawer
          isOpen={openMobileSideDrawer}
          placement="left"
          onClose={() => setOpenMobileSideDrawer(false)}
        >
          <DrawerOverlay />
          <DrawerContent
            bgGradient={sidebarGradient}
            maxW="320px"
            borderTopRightRadius="24px"
            borderBottomRightRadius="24px"
            overflow="hidden"
          >
            <DrawerCloseButton
              variant="ghost"
              fontSize="lg"
              color={INACTIVE_TEXT}
              _hover={{ color: "white", bg: HOVER_BG }}
              mt={2}
              _focus={{ boxShadow: "none" }}
            />
            <SidebarLogo showBrand />
            <DrawerBody px={3} pb={5} className="customScrollBar">
              <SidebarAccordion
                items={sidebarData}
                onClick={onItemClick}
                onLeafClick={handleLeafItemClick}
                activeItemId={activeItemId}
                expandedPath={expandedPath}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {!isMobile && (
          <Box
            pos="fixed"
            top={0}
            bottom={0}
            left={0}
            width={isCollapsed ? mediumSidebarWidth : sidebarWidth}
            minH="100vh"
            transition="width 0.3s ease"
            zIndex={1000}
            bgGradient={sidebarGradientDark}
            borderRight="1px solid"
            borderRightColor={BORDER_COLOR}
            boxShadow="4px 0 24px rgba(0,0,0,0.3)"
            className="customScrollBar"
          >
            <Box
              position="sticky"
              top={0}
              zIndex={200}
              bgGradient={sidebarGradientDark}
              borderBottom="1px solid"
              borderBottomColor={BORDER_COLOR}
            >
              <SidebarLogo />
            </Box>

            <Box
              overflowY="auto"
              overflowX="hidden"
              className="customScrollBar"
              height="calc(100vh - 165px)"
              pt={2}
            >
              {isCollapsed ? (
                <VStack align="start" spacing={0.5} px={1}>
                  {sidebarData.map((item) => (
                    <SidebarPopover
                      key={item.id}
                      item={item}
                      depth={0}
                      onClick={onItemClick}
                      onLeafClick={handleLeafItemClick}
                      isCollapsed={isCollapsed}
                      activeItemId={activeItemId}
                    />
                  ))}
                </VStack>
              ) : (
                <SidebarAccordion
                  items={sidebarData}
                  onClick={onItemClick}
                  onLeafClick={handleLeafItemClick}
                  activeItemId={activeItemId}
                  expandedPath={expandedPath}
                />
              )}
            </Box>

            <Box
              position="fixed"
              bottom={0}
              left={0}
              width={isCollapsed ? mediumSidebarWidth : sidebarWidth}
              transition="width 0.3s ease"
              py={3}
              zIndex={11}
              overflowX="hidden"
              bgGradient={sidebarGradientDark}
              borderTop="1px solid"
              borderTopColor={BORDER_COLOR}
            >
              {isCollapsed ? (
                <VStack align="start" spacing={0.5} px={1}>
                  {footerItems.map((item) => (
                    <SidebarPopover
                      key={item.id}
                      item={item}
                      depth={0}
                      onClick={onItemClick}
                      onLeafClick={handleLeafItemClick}
                      isCollapsed={isCollapsed}
                      activeItemId={activeItemId}
                    />
                  ))}
                </VStack>
              ) : (
                <SidebarAccordion
                  items={footerItems}
                  onClick={onItemClick}
                  onLeafClick={handleLeafItemClick}
                  activeItemId={activeItemId}
                  expandedPath={expandedPath}
                />
              )}
            </Box>
          </Box>
        )}
      </>
    );
  },
);

export default SidebarLayout;
