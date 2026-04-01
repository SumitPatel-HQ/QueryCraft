"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DynamicNavigation } from "@/components/lightswind/dynamic-navigation";
import ShinyText from "@/components/ui/ShinyText";
import { NAV_LINKS } from "../constants";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuthContext } from "@/components/providers/auth-provider";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useLenis } from "@studio-freight/react-lenis";

interface NavigationProps {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function Navigation({ isAuthenticated, isLoading }: NavigationProps) {
  const router = useRouter();
  const { user, signIn, signOut } = useAuthContext();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const lenis = useLenis();

  // Transform NAV_LINKS to include id for DynamicNavigation
  const dynamics = NAV_LINKS.map((link, index) => ({
    id: link.href.replace("#", "") || `link-${index}`,
    label: link.label,
    href: link.href,
  }));

  // Track active section and handle hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const sections = NAV_LINKS.map((link) => link.href.replace("#", ""));
      const scrollPosition = currentScrollY + 100;

      // Update active section
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }

      // Hide/show navbar based on scroll direction
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // Scrolling up or near top - show navbar
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold - hide navbar
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleClick = (id: string) => {
    setActiveSection(id);
    if (lenis) {
      lenis.scrollTo(`#${id}`, { offset: -80 });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
      router.push("/dashboard");
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <nav
      className={`sticky top-6 sm:top-8 z-50 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-[120%]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image
              src="/logo2.svg"
              alt="Logo"
              width={32}
              height={32}
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              QueryCraft
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <DynamicNavigation
              links={dynamics}
              activeLink={activeSection}
              onLinkClick={handleClick}
              showLabelsOnMobile={false}
              enableRipple={true}
              glowIntensity={0}
              backgroundColor="transparent"
              highlightColor="rgba(255, 255, 255, 0.1)"
              className="px-2 backdrop-blur-xs  bg-white/10 "
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-full px-4 py-1.5 border border-white/10 shadow-lg">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 focus:outline-none">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.photoURL || undefined}
                              alt={user.displayName || "User"}
                            />
                            <AvatarFallback>
                              {user.email?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-white hidden sm:inline">
                            {user.displayName || user.email}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => router.push("/dashboard/settings")}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={handleSignIn}
                      className="shadow-md rounded-full font-semibold h-10 sm:h-12 px-3 sm:px-4 text-sm sm:text-base text-white hover:bg-white/30 hover:backdrop-blur-xs"
                    >
                      Sign up
                    </Button>
                    <Button
                      onClick={handleSignIn}
                      className="shadow-md rounded-full backdrop-blur-md bg-white/20 font-semibold h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base hover:bg-white/30"
                    >
                      <ShinyText text="Log in" speed={2} intensity="high" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
