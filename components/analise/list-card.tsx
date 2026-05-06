import { Card } from "@/components/ui/card";

interface ListCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ListCard({ title, subtitle, children }: ListCardProps) {
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-default-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-default-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

interface ListItemProps {
  position: number;
  nome: string;
  right: React.ReactNode;
  inativo?: boolean;
}

export function ListItem({ position, nome, right, inativo }: ListItemProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 text-sm ${
        inativo ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-default-500 font-medium w-6 text-right">
          {position}.
        </span>
        <span className="truncate">{nome}</span>
        {inativo && (
          <span className="inline-flex items-center rounded bg-default-200 text-default-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide shrink-0">
            Inativo
          </span>
        )}
      </div>
      <div className="text-default-700 font-semibold shrink-0">{right}</div>
    </div>
  );
}

export function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-default-500 italic">{children}</p>
  );
}
