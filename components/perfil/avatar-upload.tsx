"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { uploadAvatar } from "@/actions/perfil";
import avatarPlaceholder from "@/public/images/avatar/avatar-5.jpg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AvatarUpload({ initialUrl }: { initialUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { update } = useSession();

  const handlePick = () => {
    if (pending) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.ok) {
        setCurrentUrl(result.avatarUrl);
        await update();
      } else {
        setError(result.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const src = currentUrl ?? avatarPlaceholder;

  return (
    <>
      <div className="relative shrink-0 group">
        <div className="h-[120px] w-[120px] rounded-full overflow-hidden ring-1 ring-default-200">
          <Image
            src={src}
            alt="Foto do perfil"
            width={120}
            height={120}
            className="h-full w-full object-cover"
            unoptimized={typeof src === "string"}
          />
        </div>
        <button
          type="button"
          onClick={handlePick}
          disabled={pending}
          className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-60"
          aria-label="Alterar foto"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      <AlertDialog open={!!error} onOpenChange={(o) => !o && setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Não foi possível enviar</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
