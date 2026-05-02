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
  className?: string;
}

export function SiteLogo({ variant = "icon", className }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const src =
    variant === "full"
      ? isDark
        ? fullLogoDark
        : fullLogoWhite
      : isDark
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
