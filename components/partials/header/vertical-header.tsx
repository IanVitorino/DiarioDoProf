import React from "react";
import { useSidebar, useThemeStore } from "@/store";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileMenuHandler from "./mobile-menu-handler";

const MenuBar = ({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (value: boolean) => void; }) => {
  return (
    <button
      className="relative group  disabled:cursor-not-allowed opacity-50"
      onClick={() => setCollapsed(!collapsed)}
    >
      <div>
        <div
          className={cn(
            "flex flex-col justify-between w-[20px] h-[16px] transform transition-all duration-300 origin-center overflow-hidden",
            {
              "-translate-x-1.5 rotate-180": collapsed,
            }
          )}
        >
          <div
            className={cn(
              "bg-card-foreground h-[2px] transform transition-all duration-300 origin-left delay-150",
              {
                "rotate-[42deg] w-[11px]": collapsed,
                "w-7": !collapsed,
              }
            )}
          ></div>
          <div
            className={cn(
              "bg-card-foreground h-[2px] w-7 rounded transform transition-all duration-300",
              {
                "translate-x-10": collapsed,
              }
            )}
          ></div>
          <div
            className={cn(
              "bg-card-foreground h-[2px] transform transition-all duration-300 origin-left delay-150",
              {
                "-rotate-[43deg] w-[11px]": collapsed,
                "w-7": !collapsed,
              }
            )}
          ></div>
        </div>
      </div>
    </button>
  );
};

type VerticalHeaderProps = {
  handleOpenSearch: () => void;
};
const VerticalHeader: React.FC<VerticalHeaderProps> = ({ handleOpenSearch }) => {
  const { collapsed, setCollapsed, subMenu, sidebarType } = useSidebar();
  const { layout } = useThemeStore();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  let menuBarContent = null;

  // menu bar content condition
  if (isDesktop && sidebarType !== "module") {
    menuBarContent = (
      <MenuBar collapsed={collapsed} setCollapsed={setCollapsed} />
    );
  }
  if (sidebarType === "module") {
    menuBarContent = (
      <MenuBar collapsed={collapsed} setCollapsed={setCollapsed} />
    );
  }
  if (sidebarType === "classic") {
    menuBarContent = null;
  }
  if (subMenu && isDesktop) {
    menuBarContent = null;
  }

  // No mobile/tablet sem layout module, mostra o hamburger à esquerda
  const showMobileHamburger = !isDesktop && sidebarType !== "module";

  return (
    <>
      <div className="flex items-center md:gap-6 gap-3">
        {showMobileHamburger && <MobileMenuHandler />}
        {menuBarContent}
      </div>
    </>
  );
};

export default VerticalHeader;
