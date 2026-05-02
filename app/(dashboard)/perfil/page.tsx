import { Card } from "@/components/ui/card";
import { getMeuPerfil } from "@/actions/perfil";
import { Mail, GraduationCap, User2 } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

export default async function PerfilPage() {
  const perfil = await getMeuPerfil();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <InitialsAvatar name={perfil.nome} className="h-[120px] w-[120px] text-3xl" />
          <div className="flex-1 space-y-4 w-full">
            <div>
              <div className="text-xs uppercase tracking-wide text-default-500 mb-1 flex items-center gap-1.5">
                <User2 className="h-3.5 w-3.5" /> Nome
              </div>
              <div className="text-lg font-semibold text-default-900">
                {perfil.nome}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-default-500 mb-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </div>
              <div className="text-default-800 break-all">{perfil.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-default-500 mb-1 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Turmas
              </div>
              <div className="text-default-800">
                <span className="text-2xl font-semibold text-primary">
                  {perfil.totalTurmas}
                </span>{" "}
                <span className="text-sm text-default-600">
                  {perfil.totalTurmas === 1 ? "turma cadastrada" : "turmas cadastradas"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
