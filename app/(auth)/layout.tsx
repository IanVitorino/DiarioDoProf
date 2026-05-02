import { CheckCircle2 } from "lucide-react";
import { SiteLogo } from "@/components/svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    "Organize turmas e atividades",
    "Lance notas em segundos",
    "Visualize o desempenho com gráficos",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="relative w-full max-w-5xl">
        {/* Card */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row lg:h-[580px]">
          {/* Painel branco com a logo + tagline + features */}
          <div className="lg:w-1/2 flex flex-col items-center pt-2 pb-6 lg:pt-2 lg:pb-8 px-6 lg:px-8 bg-white">
            {/* Logo */}
            <div className="relative w-full">
              <SiteLogo
                variant="full"
                mode="light"
                className="w-full h-auto"
              />
              {/* Máscara branca pra esconder o subtítulo "Gestão de Notas e Desempenho..." da PNG */}
              <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-white pointer-events-none" />
            </div>

            {/* Tagline + features */}
            <div className="w-full max-w-sm mt-1 lg:mt-2">
              <h3 className="text-lg lg:text-xl font-bold text-default-900 mb-4 text-center lg:text-left">
                Acompanhe seus alunos com clareza.
              </h3>
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-default-700"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#1d4ed8] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Painel azul com clip diagonal (desktop) — form */}
          <div className="flex-1 bg-[#0f766e] text-white p-8 lg:p-14 flex items-center justify-end lg:[clip-path:polygon(8%_0,100%_0,100%_100%,0_100%)]">
            <div className="w-full max-w-sm lg:mr-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
