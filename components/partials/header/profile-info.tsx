"use client";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

const ProfileInfo = () => {
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex items-center">
        <div className="h-9 w-9 rounded-full bg-primary/30 animate-pulse" />
      </div>
    );
  }

  const nome = session.user.name ?? "Professor";
  const email = session.user.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <div className="flex items-center">
          <InitialsAvatar name={nome} className="h-9 w-9 text-sm" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-0" align="end">
        <DropdownMenuLabel className="flex gap-3 items-center p-3">
          <InitialsAvatar name={nome} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-default-800 truncate">
              {nome}
            </div>
            <div className="text-xs text-default-600 truncate">
              {email}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0 dark:bg-background" />
        <DropdownMenuItem
          asChild
          className="flex items-center gap-2 text-sm font-medium text-default-600 my-1 px-3 py-2 dark:hover:bg-background cursor-pointer"
        >
          <Link href="/perfil">
            <Icon icon="heroicons:user" className="w-4 h-4" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-0 dark:bg-background" />
        <DropdownMenuItem
          onSelect={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm font-medium text-default-600 my-1 px-3 py-2 dark:hover:bg-background cursor-pointer"
        >
          <Icon icon="heroicons:power" className="w-4 h-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileInfo;
