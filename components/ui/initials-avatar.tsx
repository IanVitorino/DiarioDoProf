import { cn } from "@/lib/utils";

interface Props {
  name: string;
  className?: string;
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function InitialsAvatar({ name, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center select-none shrink-0",
        className,
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
