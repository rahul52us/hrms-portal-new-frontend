"use client";

import MyLeaveWorkspace from "@/app/component/leave/MyLeaveWorkspace";
import RemoteWorkWorkspace from "@/app/component/remote-work/RemoteWorkWorkspace";
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
} from "@chakra-ui/react";

export default function EmployeeRequestsWorkspace() {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
      <Tabs maxW="1400px" mx="auto" colorScheme="blue" isLazy>
        <TabList
          bg={surface}
          borderWidth="1px"
          borderColor={border}
          borderRadius="md"
          px={2}
          overflowX="auto"
          overflowY="hidden"
        >
          <Tab whiteSpace="nowrap">Leave</Tab>
          <Tab whiteSpace="nowrap">Work from home</Tab>
        </TabList>
        <TabPanels mt={5}>
          <TabPanel p={0}>
            <MyLeaveWorkspace embedded />
          </TabPanel>
          <TabPanel p={0}>
            <RemoteWorkWorkspace embedded />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
