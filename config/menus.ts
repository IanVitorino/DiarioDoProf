import { Users, ClipboardList, BarChart3, UserCircle } from "lucide-react";


export interface MenuItemProps {
  title: string;
  icon?: any;
  href?: string;
  child?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[];
  nested?: MenuItemProps[];
  onClick?: () => void;
  isHeader?: boolean;
}

export const menusConfig = {
  mainNav: [
    { title: "Turmas", icon: Users, href: "/turmas" },
    { title: "Notas", icon: ClipboardList, href: "/notas" },
    { title: "Análise da turma", icon: BarChart3, href: "/analise-turma" },
    { title: "Dashboard aluno", icon: UserCircle, href: "/dashboard-aluno" },
  ] as MenuItemProps[],
  sidebarNav: {
    modern: [
      { title: "Turmas", icon: Users, href: "/turmas" },
      { title: "Notas", icon: ClipboardList, href: "/notas" },
      { title: "Análise da turma", icon: BarChart3, href: "/analise-turma" },
      { title: "Dashboard aluno", icon: UserCircle, href: "/dashboard-aluno" },
    ] as MenuItemProps[],
    classic: [
      { isHeader: true, title: "Cadastros" },
      { title: "Turmas", icon: Users, href: "/turmas" },
      { title: "Notas", icon: ClipboardList, href: "/notas" },
      { isHeader: true, title: "Dados" },
      { title: "Análise da turma", icon: BarChart3, href: "/analise-turma" },
      { title: "Dashboard aluno", icon: UserCircle, href: "/dashboard-aluno" },
    ] as MenuItemProps[],
  },
};


export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number]
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number]
export type MainNavType = (typeof menusConfig.mainNav)[number]
