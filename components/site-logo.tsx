"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

import logoDark from "@/public/logo/Logo_dark.png";
import logoWhite from "@/public/logo/Logo_white.png";
import fullLogoDark from "@/public/logo/Full_logo_dark.png";
import fullLogoWhite from "@/public/logo/Full_logo_white.png";

interface Props {
  variant?: "icon" | "full";
  /**
   * "auto" (default): adapta ao tema do sistema via CSS.
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
  const lightSrc = variant === "full" ? fullLogoWhite : logoWhite;
  const darkSrc = variant === "full" ? fullLogoDark : logoDark;

  if (mode === "light") {
    return (
      <Image
        src={lightSrc}
        alt="Diário Do Prof"
        className={cn("object-contain", className)}
        priority
      />
    );
  }

  if (mode === "dark") {
    return (
      <Image
        src={darkSrc}
        alt="Diário Do Prof"
        className={cn("object-contain", className)}
        priority
      />
    );
  }

  return (
    <>
      <Image
        src={lightSrc}
        alt="Diário Do Prof"
        className={cn("object-contain dark:hidden", className)}
        priority
      />
      <Image
        src={darkSrc}
        alt="Diário Do Prof"
        className={cn("object-contain hidden dark:block", className)}
        priority
      />
    </>
  );
}
