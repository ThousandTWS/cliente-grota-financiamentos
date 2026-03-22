"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../../../application/core/context/SidebarContext";
import { ChevronDownIcon, LucideGripHorizontal } from "lucide-react";
import { navItems } from "./links/NavItem";
import { othersItems } from "./links/OthersItems";
import { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import { useAuthorization } from "@/application/core/authorization/use-authorization";

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { filterNavItems } = useAuthorization();
  const authorizedNavItems = useMemo(() => filterNavItems(navItems), [filterNavItems]);
  const authorizedOtherItems = useMemo(
    () => filterNavItems(othersItems),
    [filterNavItems],
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
              className={`menu-item group !text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                  className={`!text-white group-hover:text-[#E0F2FF] ${openSubmenu?.type === menuType && openSubmenu?.index === index
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
                className={`menu-item group !text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`!text-white group-hover:text-[#E0F2FF] ${isActive(nav.path)
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
                      className={`menu-dropdown-item !text-white hover:text-[#E0F2FF] !bg-transparent hover:!bg-white/10 active:!bg-white/15 ${isActive(subItem.path)
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
    let nextOpenSubmenu: {
      type: "main" | "others";
      index: number;
    } | null = null;

    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? authorizedNavItems : authorizedOtherItems;
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
  }, [authorizedNavItems, authorizedOtherItems, pathname, isActive]);

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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-[#134B73] text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-[#0f3c5a] 
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
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/" className="flex items-center">
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
              src="/images/logo/grota-symbol-positive.png"
              alt="Logo"
              width={40}
              height={40}
              style={{ height: "auto" }}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-[#E0F2FF]/80 ${!isExpanded && !isHovered
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
              {renderMenuItems(authorizedNavItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-[#E0F2FF]/80 ${!isExpanded && !isHovered
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
              {renderMenuItems(authorizedOtherItems, "others")}
            </div>
          </div>
        </nav>
        <div className="mt-auto py-4 text-xs text-white/80 space-y-2 border-t border-[#0f3c5a]">
          <div className="grid grid-cols-[1fr_auto] gap-y-1 items-center">
            <span>Versão</span>
            <span className="font-semibold">2.0.2</span>

            <span>LGPD</span>
            <span className="font-semibold text-[#E0F2FF]">Conforme</span>

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
