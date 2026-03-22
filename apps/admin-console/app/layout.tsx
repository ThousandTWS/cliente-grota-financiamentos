import { Outfit } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/application/core/context/SidebarContext";
import { ThemeProvider } from "@/application/core/context/ThemeContext";
import { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { RefineNotificationProvider } from "@/application/core/notifications/refine-notification-provider";
import { RefineRealtimeProvider } from "@/application/core/realtime/refine-realtime-provider";
import { MuiThemeProvider } from "@/application/theme/MuiThemeProvider";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painel Administrativo | Grota - Gestão de Financiamentos de Veículos",
  description: "Painel de administração da Grota para gerenciar financiamentos, clientes, veículos e aprovações de forma eficiente.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className}`}>
        {/* Loader Global */}
        <ThemeProvider>
          <SidebarProvider>
            <AntdRegistry>
              <MuiThemeProvider>
                <RefineRealtimeProvider>
                  <RefineNotificationProvider>{children}</RefineNotificationProvider>
                </RefineRealtimeProvider>
              </MuiThemeProvider>
            </AntdRegistry>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
