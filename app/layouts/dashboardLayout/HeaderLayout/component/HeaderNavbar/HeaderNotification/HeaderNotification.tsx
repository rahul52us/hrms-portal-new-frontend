"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Button,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Image,
  Portal,
} from "@chakra-ui/react";
import { BellIcon, CheckIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { observer } from "mobx-react-lite";
import stores from "../../../../../../store/stores";
import { formatDate } from "../../../../../../component/config/utils/dateUtils";
import { paginationLimit } from "../../../../../../component/config/utils/variable";

interface Notification {
  _id: any;
  userName: string;
  userAvatar: string;
  message: string;
  target: string;
  createdAt: Date;
  designation: string;
  isRead: boolean;
  type: string;
}

const NotificationComponent = observer(() => {
  const {
    dashboardStore: { getNotifications, notification, markAsReadNotifications },
  } = stores;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState("All");
  const [page, setPage] = useState(1);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [loadingId, setLoadingId] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (pageNumber: number, reset: boolean = false) => {
    const lists = {
      Unread: false,
      Read: true,
      All: "All",
    };

    const result = await getNotifications(lists[selectedItem], pageNumber, paginationLimit);

    if (reset) {
      setNotificationsList(result?.data || []);
      setPage(1);
    } else {
      setNotificationsList((prev) => [...prev, ...(result?.data || [])]);
      setPage(pageNumber);
    }
  }, [getNotifications]);

  useEffect(() => {
    fetchNotifications(1, true);
  }, [selectedItem, fetchNotifications]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchNotifications(page + 1);
    setLoadingMore(false);
  };

  const filteredNotifications = notificationsList;
  const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;

  const handleModalClose = () => {
    setDropdownOpen(false);
  };

  const handleMarkAsRead = async (id: any) => {
    try {
      setLoadingId(id);
      await markAsReadNotifications(id);
      await fetchNotifications(1, true);
    } finally {
      setLoadingId(null);
    }
  };

  const renderNotificationItem = (notification: Notification, index: number) => (
    <MenuItem
      key={index}
      display="flex"
      flexDirection="column"
      alignItems="start"
      gap={2}
      py={3}
      px={{ base: 4, md: 5 }}
      borderBottom="1px solid"
      borderColor="gray.200"
      bg={notification.isRead ? "white" : "gray.50"}
      _hover={{ bg: "gray.100" }}
    >
      <Box width="100%">
        <Text fontSize="sm" color="gray.800">
          {notification?.userName && (
            <Text as="span" fontWeight="bold">
              {`${notification.userName} - `}
            </Text>
          )}
          {notification.message && (
            <Text as="span" fontWeight="bold" color="gray.700">
              {notification.message}
            </Text>
          )}
          .
        </Text>
        <Flex gap={2} fontSize="xs" color="gray.500" mt={1}>
          <Text>{formatDate(notification.createdAt)}</Text>•<Text>{notification.type}</Text>
        </Flex>

        {!notification.isRead && (
          <Button
            size="xs"
            mt={2}
            colorScheme="blue"
            variant="solid"
            onClick={() => handleMarkAsRead(notification._id)}
            isLoading={loadingId === notification._id}
            loadingText="Marking..."
          >
            Mark as Read
          </Button>
        )}
      </Box>
    </MenuItem>
  );

  return (
    <Flex position="relative" justifyContent="center" alignItems="center" mr={1} zIndex={9999}>
      <Menu isOpen={dropdownOpen} onClose={handleModalClose}>
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
          aria-label="notifications"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        />
        {unreadCount > 0 && (
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
            {unreadCount}
          </Badge>
        )}
        <Portal>
          <MenuList
            py={0}
            borderRadius="10px"
            mx={1}
            width={{ base: "22rem", md: "24rem" }}
            zIndex={99999}
            boxShadow="xl"
            overflow="hidden"
          >
            <Flex
              p={3}
              gap={4}
              align="center"
              justify="space-between"
              borderBottom="1px solid"
              borderColor="gray.200"
              bg="gray.100"
            >
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Notifications
              </Text>
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
                      {selectedItem === item && <CheckIcon fontSize="sm" />}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Flex>

            <Box
              py={3}
              borderTop="1px solid"
              borderColor="gray.200"
              maxH="18rem"
              overflowY="auto"
              className="customScrollBar"
            >
              {filteredNotifications.length > 0 ? (
                <>
                  {filteredNotifications.map((notification, index) =>
                    renderNotificationItem(notification, index)
                  )}

                  {notification?.totalPages > page && (
                    <Flex justify="center" my={2}>
                      <Button
                        size="sm"
                        onClick={handleLoadMore}
                        isLoading={loadingMore}
                        loadingText="Loading..."
                        variant="outline"
                      >
                        Load More
                      </Button>
                    </Flex>
                  )}
                </>
              ) : (
                <Flex flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                  <Image
                    src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                    alt="No notifications"
                    width="120px"
                    mb={3}
                  />
                  <Text fontSize="md" fontWeight="600" color="gray.500">
                    No Notifications
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