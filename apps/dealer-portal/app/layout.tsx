import { Outfit } from "next/font/google";
import "./globals.css";

import { NotificationProvider } from "@grota/realtime-client";
import { SidebarProvider } from "@/application/core/context/SidebarContext";
import { ThemeProvider } from "@/application/core/context/ThemeContext";
import { Toaster } from "sonner";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdProvider } from "@/presentation/layout/common/AntdProvider";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        {/* Loader Global */}
      
        <NotificationProvider identity="logista">
          <ThemeProvider>
            <SidebarProvider>
              <AntdRegistry>
                <AntdProvider>
                  {children}
                  <Toaster richColors position="top-right" />
                </AntdProvider>
              </AntdRegistry>
            </SidebarProvider>
          </ThemeProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
