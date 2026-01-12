import type { ThemeConfig } from "antd";

export const dealerPortalTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0F456A",
    colorInfo: "#1B6EA8",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
    colorTextBase: "#0F172A",
    colorTextSecondary: "#475569",
    colorBgBase: "#F6F8FB",
    colorBgContainer: "#FFFFFF",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: 12,
  },
  components: {
    Button: {
      controlHeight: 38,
      borderRadius: 10,
      fontWeight: 600,
    },
    Card: {
      borderRadiusLG: 18,
      paddingLG: 20,
    },
    Input: {
      controlHeight: 38,
      borderRadius: 10,
    },
    Select: {
      controlHeight: 38,
      borderRadius: 10,
    },
    Tag: {
      borderRadiusSM: 999,
      fontSizeSM: 12,
      paddingXS: 8,
    },
  },
};
