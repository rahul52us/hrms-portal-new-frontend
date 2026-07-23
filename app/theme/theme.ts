import { extendTheme, StyleFunctionProps } from "@chakra-ui/react";
import { Lato } from "next/font/google";

export const DEFAULT_LEARNER_PRIMARY_COLOR = "#2563EB";
export const DASHBOARD_DEFAULT_PRIMARY_COLOR = DEFAULT_LEARNER_PRIMARY_COLOR;

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const breakpoints = {
  sm: "30em",
  md: "48em",
  lg: "62em",
  xl: "80em",
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: "bold",
    },
    sizes: {
      xl: {
        h: "56px",
        fontSize: "lg",
        px: "32px",
      },
    },
    variants: {
      solid: (props: StyleFunctionProps) => {
        const colorScheme = props.colorScheme || "brand";

        return {
          bg: `${colorScheme}.500`,
          color: "white",
          _hover: {
            bg: `${colorScheme}.600`,
            _disabled: {
              bg: `${colorScheme}.500`,
            },
          },
          _active: {
            bg: `${colorScheme}.700`,
          },
        };
      },
    },
  },
  Text: {
    baseStyle: {
      fontWeight: "300",
    },
  },
};

const styles = {
  global: (props: StyleFunctionProps) => ({
    body: {
      bg: props.colorMode === "dark" ? "gray.900" : "#FFFFFA",
      fontFamily: "var(--font-lato), sans-serif",
      color: props.colorMode === "dark" ? "white" : "brand.900",
    },
  }),
};

const baseColors = {
  brand: {
    50: "#f5f7ff",
    100: "#045B64",
    200: "#c5c9ff",
    300: "#a4a9ff",
    400: "#8389ff",
    500: "#6269ff",
    600: "#4a51cc",
    700: "#333999",
    800: "#1b2166",
    900: "#040933",
    1000: "#475467",
    1100: "#434343",
  },
  darkBrand: {
    50: "#1b1f2d",
    100: "#2f3342",
    200: "#4a5066",
    300: "#5e6882",
    400: "#78829c",
    500: "#92a1b3",
    600: "#b1b8ca",
    700: "#c4ccd9",
    800: "#d7e1e8",
    900: "#eaf3f9",
  },
  light: {
    primary: {
      50: "#FFEBEE",
      100: "#FFCDD2",
      200: "#EF9A9A",
      300: "#E57373",
      400: "#EF5350",
      500: "#F44336",
      600: "#E53935",
      700: "#D32F2F",
      800: "#C62828",
      900: "#B71C1C",
    },
    secondary: "#ffffff",
  },
  dark: {
    primary: {
      50: "#FFEBEE",
      100: "#FFCDD2",
      200: "#EF9A9A",
      300: "#E57373",
      400: "#EF5350",
      500: "#F44336",
      600: "#E53935",
      700: "#D32F2F",
      800: "#C62828",
      900: "#B71C1C",
    },
    secondary: "#000000",
  },
  custom: {
    light: {
      primary: "#1E90FF",
      secondary: "#ffffff",
    },
    dark: {
      primary: "#1A202C",
      secondary: "#000000",
    },
  },
};

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const fonts = {
  heading: "Montserrat, sans-serif",
  body: "var(--font-lato), sans-serif",
};

type BrandScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

const BRAND_SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type BrandShadeKey = (typeof BRAND_SHADE_KEYS)[number];

type ThemeBuildOptions = {
  enableLearnerBranding?: boolean;
  enableDashboardBranding?: boolean;
  learnerPrimaryColor?: string;
  dashboardPrimaryColor?: string;
  themeConfig?: Record<string, any>;
};

const SHADE_MIX_MAP: Record<BrandShadeKey, { mode: "light" | "dark"; amount: number }> = {
  50: { mode: "light", amount: 0.94 },
  100: { mode: "light", amount: 0.86 },
  200: { mode: "light", amount: 0.72 },
  300: { mode: "light", amount: 0.54 },
  400: { mode: "light", amount: 0.24 },
  500: { mode: "light", amount: 0 },
  600: { mode: "dark", amount: 0.12 },
  700: { mode: "dark", amount: 0.24 },
  800: { mode: "dark", amount: 0.38 },
  900: { mode: "dark", amount: 0.52 },
};

function normalizeHexColor(value?: string, fallback = DEFAULT_LEARNER_PRIMARY_COLOR) {
  const trimmedValue = String(value || "").trim();
  return /^#(?:[0-9A-Fa-f]{3}){1,2}$/.test(trimmedValue)
    ? expandHexColor(trimmedValue).toUpperCase()
    : fallback;
}

function expandHexColor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length === 3) {
    return `#${value
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  return `#${value}`;
}

function hexToRgb(hex: string) {
  const value = expandHexColor(hex).replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function mixHexColors(baseHex: string, targetHex: string, amount: number) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);

  return rgbToHex(
    base.r + (target.r - base.r) * amount,
    base.g + (target.g - base.g) * amount,
    base.b + (target.b - base.b) * amount
  );
}

export function createLearnerBrandScale(primaryColor?: string): BrandScale {
  const baseColor = normalizeHexColor(primaryColor);

  return BRAND_SHADE_KEYS.reduce((acc, key) => {
    const shade = SHADE_MIX_MAP[key];
    if (shade.amount === 0) {
      acc[key] = baseColor;
      return acc;
    }

    const targetColor = shade.mode === "light" ? "#FFFFFF" : "#0F172A";
    acc[key] = mixHexColors(baseColor, targetColor, shade.amount);
    return acc;
  }, {} as BrandScale);
}

export function shouldUseCompanyDashboardBranding(user?: Record<string, any> | null) {
  const role = String(user?.userType || user?.role || "").trim().toLowerCase();
  return ["admin", "departmenthead", "department head", "department_head", "hradmin", "hr"].includes(role);
}

function createAccentBrandScale(primaryColor?: string, targetHex = "#312E81", amount = 0.18) {
  const baseColor = normalizeHexColor(primaryColor);
  return createLearnerBrandScale(mixHexColors(baseColor, targetHex, amount));
}

export function buildAppTheme(options: ThemeBuildOptions = {}) {
  const {
    enableLearnerBranding = false,
    enableDashboardBranding = false,
    learnerPrimaryColor,
    dashboardPrimaryColor,
    themeConfig = {},
  } = options;
  const resolvedPrimaryColor = enableDashboardBranding ? dashboardPrimaryColor : learnerPrimaryColor;
  const learnerBrandScale = createLearnerBrandScale(resolvedPrimaryColor);
  const accentBrandScale = createAccentBrandScale(resolvedPrimaryColor);
  const { colors: _themeColors, ...restThemeConfig } = themeConfig;
  const shouldApplyBranding = enableLearnerBranding || enableDashboardBranding;

  const mergedColors = {
    ...baseColors,
    ...(shouldApplyBranding
      ? {
          blue: learnerBrandScale,
          brand: learnerBrandScale,
          purple: accentBrandScale,
          indigo: accentBrandScale,
          pink: accentBrandScale,
          custom: {
            light: {
              primary: learnerBrandScale[500],
              secondary: "#ffffff",
            },
            dark: {
              primary: learnerBrandScale[400],
              secondary: "#000000",
            },
          },
        }
      : {}),
    ...(themeConfig.colors || {}),
  };

  return extendTheme({
    config,
    colors: mergedColors,
    fonts,
    breakpoints,
    components,
    styles,
    ...restThemeConfig,
  });
}

const theme = buildAppTheme();

export { theme, lato, normalizeHexColor, mixHexColors };
export default theme;
