"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, LucideGripHorizontal } from "lucide-react";
import { useSidebar } from "../../../application/core/context/SidebarContext";
import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import { useAuthorization } from "@/application/core/authorization/AuthorizationProvider";
import { navItems as defaultNavItems } from "./links/NavItems";
import { othersItems as defaultOthersItems } from "./links/OthersItems";

interface AppSidebarProps {
  customNavItems?: NavItem[];
  customOthersItems?: NavItem[];
}

const AppSidebar = ({
  customNavItems,
  customOthersItems,
}: AppSidebarProps) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { filterNavItems } = useAuthorization();

  const currentNavItems = useMemo(
    () => filterNavItems(customNavItems || defaultNavItems),
    [customNavItems, filterNavItems],
  );
  const currentOthersItems = useMemo(
    () => filterNavItems(customOthersItems || defaultOthersItems),
    [customOthersItems, filterNavItems],
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let nextOpenSubmenu: {
      type: "main" | "others";
      index: number;
    } | null = null;

    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? currentNavItems : currentOthersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (!nextOpenSubmenu && isActive(subItem.path)) {
              nextOpenSubmenu = {
                type: menuType as "main" | "others",
                index,
              };
            }
          });
        }
      });
    });

    setOpenSubmenu((current) => {
      if (
        current?.type === nextOpenSubmenu?.type &&
        current?.index === nextOpenSubmenu?.index
      ) {
        return current;
      }

      return nextOpenSubmenu;
    });
  }, [currentNavItems, currentOthersItems, pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others",
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group !text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`!text-white group-hover:text-[#E0F2FF] ${
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 text-white transition-transform duration-200 group-hover:text-[#E0F2FF] ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-[#E0F2FF]"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group !text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${
                  isActive(nav.path)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                }`}
              >
                <span
                  className={`!text-white group-hover:text-[#E0F2FF] ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ml-9 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item !text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {subItem.icon && (
                          <span className="text-white">{subItem.icon}</span>
                        )}
                        <span>{subItem.name}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-1">
                        {subItem.new && (
                          <span
                            className={`menu-dropdown-badge ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            }`}
                          >
                            new
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-[#0f3c5a] bg-[#134B73] px-5 text-white transition-all duration-300 ease-in-out lg:mt-0 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" className="flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="filter brightness-0 invert dark:hidden"
                src="/images/logo/grota-logo-horizontal-positive.png"
                alt="Logo"
                width={150}
                height={40}
                style={{ height: "auto" }}
              />
              <Image
                className="hidden filter brightness-0 invert dark:block"
                src="/images/logo/grota-logo-horizontal-negative.png"
                alt="Logo"
                width={150}
                height={40}
                style={{ height: "auto" }}
              />
            </>
          ) : (
            <Image
              className="filter brightness-0 invert"
              src="/images/logo/grota-symbol-positive.png"
              alt="Logo"
              width={40}
              height={40}
              style={{ height: "auto" }}
            />
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-[20px] uppercase text-[#E0F2FF]/80 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <LucideGripHorizontal />
                )}
              </h2>
              {renderMenuItems(currentNavItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 flex text-xs leading-[20px] uppercase text-[#E0F2FF]/80 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Outros"
                ) : (
                  <LucideGripHorizontal />
                )}
              </h2>
              {renderMenuItems(currentOthersItems, "others")}
            </div>
          </div>
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/10 py-4 text-xs text-white/80">
          <div className="flex items-center justify-between">
            <span>Versão</span>
            <span className="font-semibold">2.0.2</span>
          </div>
          <div className="flex items-center justify-between">
            <span>LGPD</span>
            <span className="font-semibold text-[#E0F2FF]">Conforme</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="font-semibold text-emerald-200">Online</span>
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <Image
            className="rounded-md object-contain"
            src="https://res.cloudinary.com/dqxcs3pwx/image/upload/v1752426023/hxbuvabufyen655hcvyi.png"
            alt="Selo LGPD"
            width={120}
            height={120}
            style={{ height: "auto" }}
            unoptimized
          />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
