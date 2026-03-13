"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { HudeyLogo } from "@/components/hudey-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

interface FloatingHeaderProps {
  navItems: NavItem[];
  appUrl: string;
  onCtaClick?: () => void;
}

export function FloatingHeader({ navItems, appUrl, onCtaClick }: FloatingHeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="sticky top-5 z-50 w-full px-4 sm:px-6 pb-2">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-black/[0.08] bg-white/90 px-4 py-2.5 shadow-lg shadow-black/[0.03] backdrop-blur-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <HudeyLogo className="w-7 h-7" />
          <span className="font-semibold text-lg text-gray-900">Hudey</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isExternal = item.external || item.href.startsWith("#");
            if (isExternal) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className="px-3.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={`${appUrl}/login`}>Sign In</a>
          </Button>
          <Button size="sm" className="rounded-xl px-5" asChild>
            <a href={`${appUrl}/signup`} onClick={onCtaClick}>
              Get Started
            </a>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex flex-col gap-1 mt-8">
                {navItems.map((item) => {
                  const isExternal = item.external || item.href.startsWith("#");
                  if (isExternal) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        {item.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full justify-center" asChild>
                    <a
                      href={`${appUrl}/login`}
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </a>
                  </Button>
                  <Button className="w-full justify-center" asChild>
                    <a
                      href={`${appUrl}/signup`}
                      onClick={() => {
                        onCtaClick?.();
                        setIsOpen(false);
                      }}
                    >
                      Get Started
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
