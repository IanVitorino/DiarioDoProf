"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { cn } from "@/lib/utils";

import logoDark from "@/public/logo/Logo_dark.png";
import logoWhite from "@/public/logo/Logo_white.png";
import fullLogoDark from "@/public/logo/Full_logo_dark.png";
import fullLogoWhite from "@/public/logo/Full_logo_white.png";

interface Props {
  variant?: "icon" | "full";
  /**
   * "auto" (default): adapta ao tema do sistema.
   * "dark": força a versão pra fundo escuro (cores claras).
   * "light": força a versão pra fundo claro (cores escuras).
   */
  mode?: "auto" | "dark" | "light";
  className?: string;
}

export function SiteLogo({
  variant = "icon",
  mode = "auto",
  className,
}: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkBg =
    mode === "dark"
      ? true
      : mode === "light"
      ? false
      : mounted && resolvedTheme === "dark";

  const src =
    variant === "full"
      ? isDarkBg
        ? fullLogoDark
        : fullLogoWhite
      : isDarkBg
      ? logoDark
      : logoWhite;

  return (
    <Image
      src={src}
      alt="Diário Do Prof"
      className={cn("object-contain", className)}
      priority
    />
  );
}
