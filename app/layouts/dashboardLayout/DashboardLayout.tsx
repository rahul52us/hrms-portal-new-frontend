'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { Box, Spinner, useBreakpointValue, useTheme, useColorModeValue } from '@chakra-ui/react';
import styled from 'styled-components';
import stores from '../../store/stores';
// import { authenticastion } from '../../config/utils/routes';
import SidebarLayout from './SidebarLayout/SidebarLayout';
import HeaderLayout from './HeaderLayout/HeaderLayout';
// import PermissionDeniedPage from '../../component/common/Loader/PermissionDeniedPage';
import { contentLargeBodyPadding, headerHeight, mediumSidebarWidth, sidebarWidth } from '../../component/config/utils/variable';
import ThemeChangeContainer from '../../component/common/ThemeChangeContainer/ThemeChangeContainer';
import PageLoader from '../../component/common/Loader/PageLoader';


const DashboardLayout = observer(({ children }: { children: React.ReactNode }) => {
  const {
    auth: { user, sessionReady },
    dashboardStore : {getMasterData},
    layout: { fullScreenMode, mediumScreenMode, isCallapse, openDashSidebarFun, openMobileSideDrawer, setOpenMobileSideDrawer },
    themeStore: { themeConfig },
  } = stores;
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useBreakpointValue({ base: true, xl: false }) ?? false;
  const sidebarOffset = isMobile ? '0px' : isCallapse ? mediumSidebarWidth : sidebarWidth;
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;

  const closeDrawerModel = () => {
    setOpenMobileSideDrawer(false);
  };

  const pageBgColor = useColorModeValue(
    "#FFFFFF",
    themeConfig.colors.custom.dark.primary || "gray.900"
  );

  const handleSidebarItemClick = (item: any) => {
    if (!item.children || item.url) {
      localStorage.setItem('activeComponentName', item.id);
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && sessionReady && !user) {
      router.replace('/login');
    }
  }, [hasMounted, router, sessionReady, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        openDashSidebarFun(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCallapse, openDashSidebarFun]);

  useEffect(() => {
    if(user){
    getMasterData()
    }
  },[user , getMasterData])

  if (!hasMounted || !sessionReady) {
    return (
      <PageLoader loading={true}>
        <Spinner />
      </PageLoader>
    );
  }

  return user ? (
    <Box bg={pageBgColor} minH="100dvh">
      <MainContainer $isMobile={isMobile}>
        <Box ref={sidebarRef}>
          <SidebarLayout
            onItemClick={handleSidebarItemClick}
            isCollapsed={isCallapse}
            onLeafItemClick={handleSidebarItemClick}
            openMobileSideDrawer={openMobileSideDrawer}
            setOpenMobileSideDrawer={closeDrawerModel}
          />
        </Box>
        <Container $isMobile={isMobile} $sidebarOffset={sidebarOffset}>
          <HeaderContainer
            $sidebarOffset={sidebarOffset}
            $backgroundColor={brandScale[500] || themeConfig.colors.custom.light.primary}
          >
            <HeaderLayout />
          </HeaderContainer>
          <ContentContainer
            $isMobile={isMobile}
            className={
              fullScreenMode ? 'fullscreen' : mediumScreenMode ? 'mediumScreen' : ''
            }
          >
            {children}
            <div className="block xl:hidden" style={{ height: '100px', width: '100%', flexShrink: 0 }} />
          </ContentContainer>
        </Container>
      </MainContainer>
      <ThemeChangeContainer />
    </Box>
  ) : (
    <PageLoader loading={true}>
      <Spinner />
    </PageLoader>
  );
});

export default DashboardLayout;

const MainContainer = styled.div<{ $isMobile: boolean }>`
  display: flex;
  width: 100%;
  min-height: 100dvh;
  transition: all 0.3s ease-in-out;
  overflow-x: hidden;
`;

const Container = styled.div<{
  $isMobile: boolean;
  $sidebarOffset: string;
}>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  width: ${({ $isMobile, $sidebarOffset }) =>
    $isMobile ? '100%' : `calc(100% - ${$sidebarOffset})`};
  margin-left: ${({ $isMobile, $sidebarOffset }) =>
    $isMobile ? '0px' : $sidebarOffset};
  transition: all 0.3s ease-in-out;
`;

/* ── Only this component changed ── */
const HeaderContainer = styled.div<{
  $backgroundColor: string;
  $sidebarOffset: string;
}>`
  z-index: 99;
  height: ${headerHeight};
  padding-top: 0;
  position: fixed;

  @media (max-width: 768px) {
    height: calc(${headerHeight} + max(env(safe-area-inset-top, 0px), 36px));
    padding-top: max(env(safe-area-inset-top, 0px), 36px);
  }
  top: 0;
  right: 0;
  left: ${({ $sidebarOffset }) => $sidebarOffset};
  transition: all 0.3s ease-in-out;
  background: transparent;

  animation: navbarSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

  @keyframes navbarSlideIn {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ContentContainer = styled.div<{ $isMobile: boolean }>`
  padding: ${({ $isMobile }) => ($isMobile ? '14px' : `${contentLargeBodyPadding}`)};
  padding-bottom: ${({ $isMobile }) =>
    $isMobile ? 'max(env(safe-area-inset-bottom, 0px), 48px)' : `${contentLargeBodyPadding}`};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  min-height: calc(100dvh - calc(${headerHeight} + var(--safe-area-top, env(safe-area-inset-top, 0px))));
  transition: all 0.3s ease-in-out;
  margin-top: calc(${headerHeight} + var(--safe-area-top, env(safe-area-inset-top, 0px)));
  box-sizing: border-box;
`;
