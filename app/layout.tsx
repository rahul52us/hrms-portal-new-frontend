"use client";

import { observer } from "mobx-react-lite";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { buildAppTheme, lato, shouldUseCompanyDashboardBranding } from "./theme/theme";
import "./globals.css";
import MainLayout from "./layouts/mainLayout/MainLayout";
import AuthenticationLayout from "./layouts/authenticationLayout/AuthenticationLayout";
import DashboardLayout from "./layouts/dashboardLayout/DashboardLayout";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import stores from "./store/stores";
import Notification from "./component/common/Notification/Notification";
import { Montserrat } from "next/font/google";
import { getMetadataForPath, PageMetadata } from "./metadata";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const RootLayout = observer(({ children }: { children: React.ReactNode }) => {
  const {
    companyStore: { getCompanyDetails },
    auth: { user, company },
    themeStore: { themeConfig },
  } = stores;
  const pathname = usePathname();
  const [metadata, setMetadata] = useState<PageMetadata>({
    title: "CRAFT",
    description:
      "LMS",
  });

  useEffect(() => {
    if (user && company) {
      getCompanyDetails();
    }
  }, [company, getCompanyDetails, user]);

  useEffect(() => {
    if (pathname) {
      const pageMetadata = getMetadataForPath(pathname);
      setMetadata(pageMetadata);
      if (typeof window !== "undefined") {
        document.title = pageMetadata.title;
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // // // console.log('RootLayout hydrated, body classes:', document.body.className);
    }
  }, []);

  const getLayout = () => {
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password"
    ) {
      return AuthenticationLayout;
    } else if (pathname?.startsWith("/dashboard")) {
      return DashboardLayout;
    }
    return MainLayout;
  };

  const LayoutComponent = getLayout();
  const isDashboardPath = pathname?.startsWith("/dashboard");
  const isLearnerThemeEnabled = !isDashboardPath;
  const isDashboardThemeEnabled = isDashboardPath && shouldUseCompanyDashboardBranding(user);
  const themeConfigSnapshot = isLearnerThemeEnabled
    ? "{}"
    : JSON.stringify(themeConfig || {});

  const isCreatedByAdmin = Boolean(user?.createdBy);
  const activeLearnerPrimaryColor = isCreatedByAdmin ? user?.companyDetails?.primaryThemeColor : undefined;

  const activeTheme = useMemo(
    () =>
      buildAppTheme({
        enableLearnerBranding: isLearnerThemeEnabled,
        enableDashboardBranding: isDashboardThemeEnabled,
        learnerPrimaryColor: activeLearnerPrimaryColor,
        dashboardPrimaryColor: user?.companyDetails?.primaryThemeColor,
        themeConfig: isLearnerThemeEnabled ? {} : JSON.parse(themeConfigSnapshot),
      }),
    [
      isLearnerThemeEnabled,
      isDashboardThemeEnabled,
      themeConfigSnapshot,
      activeLearnerPrimaryColor,
      user?.companyDetails?.primaryThemeColor,
    ]
  );

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta
          property="og:image"
          content="https://www.Dentalhealth.com/images/logo.png"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <ColorModeScript initialColorMode="light" />
      </head>
      <body className={`${lato.className} ${montserrat.className}`}>
        <ChakraProvider theme={activeTheme}>
          <Notification />
          <Suspense fallback={null}>
            <LayoutComponent>{children}</LayoutComponent>
          </Suspense>
        </ChakraProvider>
      </body>
    </html>
  );
});

export default RootLayout;
