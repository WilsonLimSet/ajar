"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  children: React.ReactNode;
  href: string;
}

export default function Navigation({ children, href }: NavigationProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <span className="text-sm sm:text-base font-medium">{children}</span>
    </Link>
  );
} 