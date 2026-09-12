"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react";
import { BellIcon, CheckIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { observer } from "mobx-react-lite";
import stores from "../../../../../../store/stores";
import { formatDate } from "../../../../../../component/config/utils/dateUtils";
import { paginationLimit } from "../../../../../../component/config/utils/variable";

interface Notification {
  _id: string;
  title?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type?: string;
  category?: string;
  eventType?: string;
  actionUrl?: string;
}

const notificationLabel = (item: Notification) =>
  String(item.category || item.eventType || item.type || "Update")
    .split(".")
    .pop()
    ?.replace(/_/g, " ") || "Update";

const NotificationComponent = observer(() => {
  const {
    dashboardStore: {
      getNotifications,
      notification,
      markAsReadNotifications,
      markAllNotificationsAsRead,
    },
  } = stores;
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState("All");
  const [page, setPage] = useState(1);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (pageNumber: number, reset = false) => {
    const filters: Record<string, boolean | string> = {
      Unread: false,
      Read: true,
      All: "All",
    };
    const result = await getNotifications(filters[selectedItem], pageNumber, paginationLimit);
    if (reset) {
      setNotificationsList(result?.data || []);
      setPage(1);
      return;
    }
    setNotificationsList((previous) => [...previous, ...(result?.data || [])]);
    setPage(pageNumber);
  }, [getNotifications, selectedItem]);

  useEffect(() => {
    void fetchNotifications(1, true);
  }, [fetchNotifications]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchNotifications(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setLoadingId(id);
    try {
      await markAsReadNotifications(id);
      await fetchNotifications(1, true);
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications(1, true);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationOpen = async (item: Notification) => {
    if (!item.isRead) await handleMarkAsRead(item._id);
    if (item.actionUrl) {
      setDropdownOpen(false);
      router.push(item.actionUrl);
    }
  };

  const unreadCount = Number(notification?.unreadCount || 0);

  return (
    <Flex position="relative" justifyContent="center" alignItems="center" mr={1} zIndex={9999}>
      <Menu isOpen={dropdownOpen} onClose={() => setDropdownOpen(false)}>
        <MenuButton
          as={IconButton}
          icon={<BellIcon />}
          isRound
          bg="gray.700"
          fontSize="xl"
          color="white"
          w="40px"
          h="40px"
          minW="40px"
          _hover={{ bg: "blue.500", transform: "scale(1.05)" }}
          _active={{ bg: "blue.600", transform: "scale(0.97)" }}
          transition="all 0.2s ease"
          aria-label="Notifications"
          onClick={() => setDropdownOpen((open) => !open)}
        />
        {unreadCount > 0 ? (
          <Badge
            colorScheme="red"
            borderRadius="full"
            position="absolute"
            top="2"
            right="0"
            transform="translate(50%, -50%)"
            px={1.5}
            fontSize="xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
        <Portal>
          <MenuList
            py={0}
            borderRadius="8px"
            mx={1}
            width={{ base: "22rem", md: "24rem" }}
            maxW="calc(100vw - 1rem)"
            zIndex={99999}
            boxShadow="xl"
            overflow="hidden"
          >
            <Flex
              p={3}
              gap={3}
              align="center"
              justify="space-between"
              borderBottom="1px solid"
              borderColor="gray.200"
              bg="gray.100"
            >
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Notifications
                </Text>
                {unreadCount > 0 ? (
                  <Text fontSize="xs" color="gray.600">
                    {unreadCount} unread
                  </Text>
                ) : null}
              </Box>
              <Flex align="center" gap={2}>
                {unreadCount > 0 ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => void handleMarkAllAsRead()}
                    isLoading={markingAll}
                  >
                    Mark all read
                  </Button>
                ) : null}
                <Menu>
                  <MenuButton fontSize="sm">
                    {selectedItem} <ChevronDownIcon />
                  </MenuButton>
                  <MenuList minW="8rem" fontSize="sm">
                    {["All", "Unread", "Read"].map((item) => (
                      <MenuItem
                        key={item}
                        justifyContent="space-between"
                        onClick={() => setSelectedItem(item)}
                        gap={6}
                      >
                        {item}
                        {selectedItem === item ? <CheckIcon fontSize="sm" /> : null}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </Flex>
            </Flex>

            <Box maxH="22rem" overflowY="auto" className="customScrollBar">
              {notificationsList.length ? (
                <>
                  {notificationsList.map((item) => (
                    <MenuItem
                      key={item._id}
                      display="flex"
                      flexDirection="column"
                      alignItems="start"
                      gap={2}
                      py={3}
                      px={{ base: 4, md: 5 }}
                      borderBottom="1px solid"
                      borderColor="gray.200"
                      bg={item.isRead ? "white" : "blue.50"}
                      _hover={{ bg: "gray.100" }}
                      cursor={item.actionUrl ? "pointer" : "default"}
                      onClick={() => void handleNotificationOpen(item)}
                    >
                      <Box width="100%">
                        {item.title ? (
                          <Text fontSize="sm" fontWeight="800" color="gray.800">
                            {item.title}
                          </Text>
                        ) : null}
                        <Text mt={item.title ? 1 : 0} fontSize="sm" color="gray.700">
                          {item.message}
                        </Text>
                        <Flex gap={2} fontSize="xs" color="gray.500" mt={1}>
                          <Text>{formatDate(new Date(item.createdAt))}</Text>
                          <Text>-</Text>
                          <Text textTransform="capitalize">{notificationLabel(item)}</Text>
                        </Flex>
                        {!item.isRead ? (
                          <Button
                            size="xs"
                            mt={2}
                            colorScheme="blue"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleMarkAsRead(item._id);
                            }}
                            isLoading={loadingId === item._id}
                          >
                            Mark as read
                          </Button>
                        ) : null}
                      </Box>
                    </MenuItem>
                  ))}
                  {notification?.totalPages > page ? (
                    <Flex justify="center" my={3}>
                      <Button size="sm" onClick={() => void handleLoadMore()} isLoading={loadingMore} variant="outline">
                        Load more
                      </Button>
                    </Flex>
                  ) : null}
                </>
              ) : (
                <Flex alignItems="center" justifyContent="center" py={10} px={4}>
                  <Text fontSize="sm" fontWeight="600" color="gray.500">
                    No notifications
                  </Text>
                </Flex>
              )}
            </Box>
          </MenuList>
        </Portal>
      </Menu>
    </Flex>
  );
});

export default NotificationComponent;
