"use client";

import { usePathname } from "next/navigation";

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/turmas")) return "Turmas";
  if (pathname.startsWith("/notas")) return "Notas";
  if (pathname.startsWith("/analise-turma")) return "Análise da turma";
  if (pathname.startsWith("/dashboard-atividades")) return "Dashboard atividades";
  if (pathname.startsWith("/dashboard-aluno")) return "Dashboard aluno";
  if (pathname.startsWith("/perfil")) return "Meu perfil";
  return "";
}

export function PageTitle() {
  const pathname = usePathname() ?? "";
  const title = getPageTitle(pathname);
  if (!title) return null;
  return (
    <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-lg text-default-900 hidden md:block pointer-events-none">
      {title}
    </span>
  );
}
