"use client";

import Link from "next/link";

const LOGISTA_PANEL_URL = (
  process.env.NEXT_PUBLIC_LOGISTA_PANEL_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

interface MobileMenuProps {
  isOpen: boolean;
}

interface NavItem {
  name: string;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { name: "Inicio", href: "/" },
  {
    name: "Nossa Historia",
    href: "/nossa-historia",
    children: [],
  },
  { name: "Lojas", href: "/lojas" },
  { name: "Solucoes", href: "/solucoes" },
  { name: "Financiamento", href: "#" },
  { name: "Blog", href: "#" },
  { name: "Contato", href: "/contato" },
];

export const MobileMenu = ({ isOpen }: MobileMenuProps) => {
  if (!isOpen) return null;

  const renderNavItems = (items: NavItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.name} className={`pl-${level * 4}`}>
        <Link
          href={item.href}
          className="relative px-4 py-2 text-[#2C2C2C] text-[1.2rem] transition-colors cursor-pointer
          after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#1B4B7C]
          after:transition-all after:duration-300 hover:after:w-40"
        >
          <span className="relative z-20">{item.name}</span>
        </Link>
        {item.children && (
          <div className="flex flex-col ml-4 mt-1">
            {renderNavItems(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden">
      <div className="absolute top-20 left-4 right-4 mt-10 bg-[#F8FAFC] backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-6">
        <nav className="flex flex-col space-y-4">
          {renderNavItems(navItems)}
          <div className="border-t border-border/50 pt-4 mt-4 flex flex-col space-y-3">
            <a
              href={`${LOGISTA_PANEL_URL}/login`}
              className="relative flex items-center justify-center cursor-pointer w-full px-4 py-3 text-base font-semibold text-white bg-[#1B4B7C] rounded-xl shadow-md transition-colors duration-300 hover:bg-[#1b4b7ce1] hover:text-white border-2 border-white"
            >
              <span className="relative z-10">Area do Logista</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
};
