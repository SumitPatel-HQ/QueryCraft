"use client";

import { Database, Globe, Lock } from "lucide-react";
import Image from "next/image";
import { FOOTER_LINKS } from "../constants";

export function Footer() {
  return (
    <footer
      className="py-8 sm:py-10 md:py-12 mt-6 sm:mt-7 px-4 max-w-[1600px] rounded-xl sm:rounded-2xl backdrop-blur-xs mx-auto"
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Image
                src="/logo2.svg"
                alt="Logo"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
              <span className="font-bold text-xl sm:text-2xl">QueryCraft</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Let AI write your SQL queries instantly
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Product
            </h3>
            <ul
              className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm"
              style={{ color: "rgba(255, 255, 255, 0.60)" }}
            >
              {FOOTER_LINKS.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Company
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              {FOOTER_LINKS.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Legal
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              {FOOTER_LINKS.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="border-t pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          <p
            className="text-xs sm:text-sm text-center sm:text-left"
            style={{ color: "rgba(255, 255, 255, 0.38)" }}
          >
            © {new Date().getFullYear()} QueryCraft. All rights reserved.
          </p>
          <div className="flex gap-3 sm:gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
