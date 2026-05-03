import React from "react";
import { cn } from "@/lib/utils";
const FooterLayout = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <footer className={cn("relative py-6 px-6 bg-transparent", className)}>
      {children}
    </footer>
  );
};

export default FooterLayout;
