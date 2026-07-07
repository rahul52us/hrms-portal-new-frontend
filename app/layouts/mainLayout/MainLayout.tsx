"use client";

import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";
import Loader from "../../component/common/Loader/Loader";
import Header from "../../layouts/mainLayout/component/Header/Header";
import stores from "../../store/stores";
import { Footer } from "./component/Footer/Footer";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const shellBg = useColorModeValue("#F6F8FB", "gray.950");

  const {
    auth: { user },
  } = stores;

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!user && pathname.startsWith("/dashboard")) {
        router.replace("/login");
      }

      setIsChecking(false);
    }
  }, [pathname, router, user]);

  if (isChecking) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Loader />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={shellBg} overflowX="hidden">
      <Header />

      <Box as="main" pb={{ base: "92px", md: 0 }}>
        {children}
      </Box>

      <Footer />
    </Box>
  );
};

export default MainLayout;
