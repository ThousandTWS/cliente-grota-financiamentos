"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../../../application/core/context/SidebarContext";
import { ChevronDownIcon, LucideGripHorizontal } from "lucide-react";
import { useTheme } from "@/application/core/context/ThemeContext";
import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import { useAuthorization } from "@/application/core/authorization/AuthorizationProvider";
import { navItems as defaultNavItems } from "./links/NavItems";
import { othersItems as defaultOthersItems } from "./links/OthersItems";
import { gestorNavItems, gestorOthersItems } from "./links/GestorNavItems";
import { operadorNavItems, operadorOthersItems } from "./links/OperadorNavItems";

interface AppSidebarProps {
  customNavItems?: NavItem[];
  customOthersItems?: NavItem[];
}

const AppSidebar = ({ customNavItems, customOthersItems }: AppSidebarProps) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { filterNavItems } = useAuthorization();

  // Determine which items to show: props > path detection > default
  const isGestor = pathname.includes("/gestao");
  const isOperador = pathname.includes("/operacao");

  const currentNavItems = filterNavItems(
    customNavItems
      || (isGestor ? gestorNavItems : isOperador ? operadorNavItems : defaultNavItems),
  );

  const currentOthersItems = filterNavItems(
    customOthersItems
      || (isGestor ? gestorOthersItems : isOperador ? operadorOthersItems : defaultOthersItems),
  );

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`text-white group-hover:text-[#E0F2FF] ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 text-white group-hover:text-[#E0F2FF] transition-transform duration-200  ${openSubmenu?.type === menuType &&
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
                className={`menu-item group text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`text-white group-hover:text-[#E0F2FF] ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
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
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {subItem.icon && <span className="text-white">{subItem.icon}</span>}
                        <span>{subItem.name}</span>
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
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

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? currentNavItems : currentOthersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          //@ts-ignore
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
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

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 dealer-sidebar text-white h-screen transition-all duration-300 ease-in-out z-50 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden filter brightness-0 invert"
                src="/images/logo/grota-logo-horizontal-positive.png"
                alt="Logo"
                width={150}
                height={40}
                style={{ height: "auto" }}
              />
              <Image
                className="hidden dark:block filter brightness-0 invert"
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
              src={
                theme === "dark"
                  ? "/images/logo/grota-symbol-negative.png"
                  : "/images/logo/grota-symbol-positive.png"
              }
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-white/80 ${!isExpanded && !isHovered
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

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-white/80 ${!isExpanded && !isHovered
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
        <div className="mt-auto py-4 text-xs text-white/80 space-y-2 border-t border-white/10">
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
        <div className="pb-4 flex justify-center">
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
