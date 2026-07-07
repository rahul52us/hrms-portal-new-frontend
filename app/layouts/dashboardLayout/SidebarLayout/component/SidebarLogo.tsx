"use client";

import { observer } from "mobx-react-lite";
import styled, { keyframes } from "styled-components";
import { Avatar, useTheme } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import stores from "../../../../store/stores";
import { dashboard } from "../../../../config/utils/routes";
import { headerHeight } from "../../../../component/config/utils/variable";

/* ── animations ── */
const fadeSlide = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

/* ── component ── */
interface SidebarLogoProps {
  showBrand?: boolean;
}

const SidebarLogo: React.FC<SidebarLogoProps> = observer(({ showBrand = false }) => {
  const router = useRouter();
  const {
    layout: { isCallapse },
    auth: { user },
  } = stores;
  const theme = useTheme();
  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;
  const accentScale = (theme.colors?.purple || {}) as Record<number, string>;
  const ringBackground = `linear-gradient(135deg, ${brandScale[600] || "#7c3aed"} 0%, ${accentScale[500] || brandScale[500] || "#a855f7"} 50%, ${brandScale[400] || "#6366f1"} 100%)`;
  const ringShadow = `0 0 0 2px ${(brandScale[500] || "#7c3aed")}40, 0 4px 12px ${(accentScale[500] || brandScale[500] || "#a855f7")}4D`;
  const ringHoverShadow = `0 0 0 3px ${(accentScale[500] || brandScale[500] || "#a855f7")}66, 0 10px 24px ${(accentScale[500] || brandScale[500] || "#a855f7")}80`;
  const accentLineBackground = `linear-gradient(90deg, transparent, ${(accentScale[500] || brandScale[500] || "#a855f7")}99 30%, ${(brandScale[400] || "#6366f1")}99 70%, transparent)`;

  const companyName = user?.companyDetails?.company_name ?? "Dashboard";
  const logoUrl = user?.companyDetails?.logo?.url;

  const initials = companyName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join("");

  const shouldShowBrand = !isCallapse || showBrand;

  return (
    <LogoWrapper
      $height={headerHeight}
      onClick={() => router.push(dashboard.home)}
      role="button"
      aria-label="Go to home"
    >
      {/* Avatar / logo */}
      <AvatarRing
        $background={ringBackground}
        $boxShadow={ringShadow}
        $hoverBoxShadow={ringHoverShadow}
      >
        {logoUrl ? (
          <Avatar
            src={logoUrl}
            size="sm"
            borderRadius="10px"
            bg={brandScale[500] || "transparent"}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <Monogram>{initials}</Monogram>
        )}
      </AvatarRing>

      {/* Brand text */}
      {shouldShowBrand && (
        <BrandText>
          <CompanyName>{companyName}</CompanyName>
          <TagLine>Dashboard</TagLine>
        </BrandText>
      )}

      <AccentLine $background={accentLineBackground} />
    </LogoWrapper>
  );
});

export default SidebarLogo;

/* ─────────────── styled ─────────────── */

const LogoWrapper = styled.div<{ $height: string }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: ${({ $height }) => $height};
  padding: 0 18px;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;

  /* ✅ Better contrast background */
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.25) 0%,
    rgba(0, 0, 0, 0.1) 100%
  );

  backdrop-filter: blur(6px);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateX(2px);
  }

  transition: all 0.2s ease;
`;

const AvatarRing = styled.div<{
  $background: string;
  $boxShadow: string;
  $hoverBoxShadow: string;
}>`
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $background }) => $background};
  box-shadow: ${({ $boxShadow }) => $boxShadow};
  transition: all 0.25s ease;

  ${LogoWrapper}:hover & {
    transform: scale(1.08);
    box-shadow: ${({ $hoverBoxShadow }) => $hoverBoxShadow};
  }
`;

const Monogram = styled.span`
  font-family: "Sora", "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  animation: ${fadeSlide} 0.25s ease both;
`;

const CompanyName = styled.span`
  font-family: "Sora", "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;

  /* ✅ Premium readable white */
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
`;

const TagLine = styled.span`
  font-family: "DM Sans", sans-serif;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.8px;
  text-transform: uppercase;

  /* ✅ Fixed visibility */
  color: rgba(255, 255, 255, 0.6);
`;

const AccentLine = styled.div<{ $background: string }>`
  position: absolute;
  bottom: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: ${({ $background }) => $background};
`;
