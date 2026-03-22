import type { ThemeConfig } from "antd";

export const dealerPortalTheme: ThemeConfig = {
  token: {
    colorPrimary: "#134B73",
    colorInfo: "#0288D1",
    colorSuccess: "#2E7D32",
    colorWarning: "#ED6C02",
    colorError: "#D32F2F",
    colorTextBase: "#212121",
    colorTextSecondary: "rgba(33, 33, 33, 0.6)",
    colorBgBase: "#FAFAFA",
    colorBgContainer: "#FFFFFF",
    colorBgLayout: "#F5F5F5",
    colorBorder: "#E0E0E0",
    colorBorderSecondary: "#EEEEEE",
    colorPrimaryBg: "#E3F2FD",
    colorPrimaryBgHover: "#BBDEFB",
    colorPrimaryBorder: "#90CAF9",
    colorPrimaryHover: "#0F3D5F",
    colorPrimaryActive: "#0F3D5F",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: 4,
    borderRadiusSM: 2,
    borderRadiusLG: 6,
    boxShadow:
      "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
    boxShadowSecondary:
      "0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)",
  },
  components: {
    Button: {
      controlHeight: 38,
      borderRadius: 4,
      fontWeight: 500,
      colorPrimary: "#134B73",
      primaryColor: "#FFFFFF",
      defaultBg: "#134B73",
      defaultBorderColor: "#134B73",
      defaultColor: "#FFFFFF",
      defaultHoverBg: "#0F3D5F",
      defaultHoverBorderColor: "#0F3D5F",
      defaultHoverColor: "#FFFFFF",
      primaryShadow:
        "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
    },
    Card: {
      borderRadiusLG: 6,
      paddingLG: 20,
    },
    Input: {
      controlHeight: 38,
      borderRadius: 4,
    },
    Select: {
      controlHeight: 38,
      borderRadius: 4,
    },
    Tag: {
      borderRadiusSM: 999,
      fontSizeSM: 12,
      paddingXS: 8,
    },
    Layout: {
      headerBg: "#134B73",
      siderBg: "#134B73",
      bodyBg: "#F5F5F5",
    },
  },
};
