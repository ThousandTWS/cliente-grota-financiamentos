import { Outfit } from "next/font/google";
import "./globals.css";

import { AuthorizationProvider } from "@/application/core/authorization/AuthorizationProvider";
import { SidebarProvider } from "@/application/core/context/SidebarContext";
import { ThemeProvider } from "@/application/core/context/ThemeContext";
import { Toaster } from "sonner";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdProvider } from "@/presentation/layout/common/AntdProvider";
import { RefineRealtimeProvider } from "@/application/core/realtime/refine-realtime-provider";

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
        <RefineRealtimeProvider>
          <AuthorizationProvider>
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
          </AuthorizationProvider>
        </RefineRealtimeProvider>
      </body>
    </html>
  );
}
