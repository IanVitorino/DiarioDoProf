"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  value: "grupo" | "individual";
}

export function VisaoToggle({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (v: "grupo" | "individual") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center bg-default-100 dark:bg-default-100/50 rounded-md p-1">
      <button
        type="button"
        onClick={() => setView("grupo")}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded transition-colors",
          value === "grupo"
            ? "bg-card text-default-900 shadow-sm"
            : "text-default-600 hover:text-default-900",
        )}
      >
        Visão grupo
      </button>
      <button
        type="button"
        onClick={() => setView("individual")}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded transition-colors",
          value === "individual"
            ? "bg-card text-default-900 shadow-sm"
            : "text-default-600 hover:text-default-900",
        )}
      >
        Visão individual
      </button>
    </div>
  );
}
