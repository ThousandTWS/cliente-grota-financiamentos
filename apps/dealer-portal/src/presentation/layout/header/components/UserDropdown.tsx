 
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "@/presentation/ui/dropdown/Dropdown";
import { DropdownItem } from "@/presentation/ui/dropdown/DropdownItem";
import { User } from "lucide-react";
import userServices, {
  type AuthenticatedUser,
} from "@/application/services/UserServices/UserServices";

const CLIENT_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

export default function UserDropdown() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      window.location.href = CLIENT_REDIRECT_URL;
    }
  };

  // Fetch do usuário
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const userData = await userServices.me();
        if (isMounted) {
          setUser(userData);
        }
      } catch (error: unknown) {
        console.error("Erro ao buscar usuário:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative">

      {/* BOTÃO */}
      <button
        onClick={toggleDropdown}
        className="flex items-center text-white dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden flex justify-center items-center rounded-full h-11 w-11 bg-white/15 text-white border border-white/30">
          <User size={24} />
        </span>

        {loading ? (
          <div className="w-28 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <span className="block mr-1 font-medium text-theme-sm text-white">{user?.fullName}</span>
        )}

        <svg
          className={`stroke-white transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* DROPDOWN */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          {loading ? (
            <>
              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-40 mt-2 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            </>
          ) : (
            <>
              <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                {user?.fullName}
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </span>
            </>
          )}
        </div>

        {/* opções */}
        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Perfil
            </DropdownItem>
          </li>
        </ul>

        {/* logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Sair da Conta
        </button>
      </Dropdown>
    </div>
  );
}
