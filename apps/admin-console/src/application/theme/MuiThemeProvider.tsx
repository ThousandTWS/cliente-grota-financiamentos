"use client";

import React from 'react';
import { ConfigProvider } from 'antd';
import useMuiTheme from './muiTheme';

export const MuiThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const configProps = useMuiTheme();

  return <ConfigProvider {...configProps}>{children}</ConfigProvider>;
};
