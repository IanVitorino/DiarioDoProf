"use client";
import React from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store";

const MobileMenuHandler = () => {
  const { mobileMenu, setMobileMenu } = useSidebar();
  return (
    <div>
      <Button
        onClick={() => setMobileMenu(!mobileMenu)}
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 hover:bg-primary-100 dark:hover:bg-default-300 hover:text-primary text-default-500 dark:text-default-800 rounded-full"
      >
        <span className="relative h-5 w-5 block">
          <Menu
            className={`absolute inset-0 h-5 w-5 transition-all duration-300 ease-in-out ${
              mobileMenu
                ? "opacity-0 rotate-90 scale-75"
                : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            className={`absolute inset-0 h-5 w-5 transition-all duration-300 ease-in-out ${
              mobileMenu
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-75"
            }`}
          />
        </span>
      </Button>
    </div>
  );
};

export default MobileMenuHandler;
