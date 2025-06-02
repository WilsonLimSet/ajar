"use client";

import Navigation from "./Navigation";
import Link from "next/link";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-500">
                Ajar
              </Link>
            </div>
            <div className="flex space-x-2">
              <Navigation href="/review">Review</Navigation>
              <Navigation href="/listen">Listen</Navigation>
              <Navigation href="/speak">Speak</Navigation>
              <Navigation href="/manage">Manage</Navigation>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow bg-fl-gray">
        {children}
      </main>
    </div>
  );
} 