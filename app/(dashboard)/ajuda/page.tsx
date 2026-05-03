import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  HelpCircle,
  PlayCircle,
  Plus,
  Users,
} from "lucide-react";
import { FAQList, type FAQItem } from "@/components/ajuda/faq-list";

interface PassoCard {
  numero: number;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
}

const PASSOS: PassoCard[] = [
  {
    numero: 1,
    titulo: "Crie sua primeira turma",
    descricao:
      "Em Cadastros → Turmas, clique em Nova turma e preencha os dados (série, turno, escola, disciplina, ano).",
    icon: <Plus className="w-5 h-5" />,
  },
  {
    numero: 2,
    titulo: "Configure os bimestres",
    descricao:
      "Na turma criada, vá na aba Períodos e defina as datas de início e fim de cada bimestre.",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    numero: 3,
    titulo: "Cadastre os alunos",
    descricao:
      "Na aba Alunos, adicione os estudantes da turma. O número de chamada é automático (ordem alfabética).",
    icon: <Users className="w-5 h-5" />,
  },
  {
    numero: 4,
    titulo: "Crie atividades",
    descricao:
      "Na aba Atividades, registre provas, trabalhos e avaliações. Defina se é Individual ou em Grupo.",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    numero: 5,
    titulo: "Lance as notas",
    descricao:
      "Em Cadastros → Notas, escolha a turma e o bimestre, e digite as notas no grid. A média é calculada automaticamente.",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    numero: 6,
    titulo: "Acompanhe os resultados",
    descricao:
      "Use Análise da turma, Dashboard aluno e Dashboard atividades pra visualizar gráficos e indicadores.",
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

const FAQ: FAQItem[] = [
  {
    pergunta: "Como crio uma nova turma?",
    resposta:
      "Vá em Cadastros → Turmas e clique no botão Nova turma. Preencha série (1 a 9), letra da turma (A a Z), nível de ensino, turno, ano, disciplina e escola. Depois clique em Criar — os 4 bimestres já são criados automaticamente.",
  },
  {
    pergunta: "Qual a diferença entre os modos Média e Soma de um bimestre?",
    resposta:
      "No modo Média, todas as atividades valem 0–10 e a nota do bimestre é a média aritmética simples. No modo Soma, cada atividade tem um peso (valor máximo) e a nota do bimestre é a soma das notas, com teto em 10. Ao trocar de modo, as notas existentes são reescaladas proporcionalmente.",
  },
  {
    pergunta: "Como atribuo uma atividade só pra alguns alunos?",
    resposta:
      "Na aba Atividades da turma, na coluna Atribuição, clique no badge \"Para todos\". Abre um modal com checkboxes — desmarque os alunos que não devem fazer a atividade. Útil pra atividades de recuperação. Atividades não atribuídas a um aluno não pesam na média dele.",
  },
  {
    pergunta: "Como faço uma atividade em grupo?",
    resposta:
      "Ao criar (ou editar) a atividade, escolha Tipo: Em grupo. Aparece um botão Grupos na coluna Atribuição. Lá você cria grupos com nome, tema (opcional) e membros. O campo \"Nota do grupo\" preenche automaticamente as notas vazias dos membros.",
  },
  {
    pergunta: "Um aluno pode estar em mais de um grupo?",
    resposta:
      "Não. Em cada atividade em grupo, um aluno só pode pertencer a um grupo. Quando você adiciona um aluno num grupo, ele some da lista de candidatos dos outros grupos da mesma atividade.",
  },
  {
    pergunta: "Posso mudar o tipo de uma atividade depois de criar?",
    resposta:
      "Sim. Trocar de Individual pra Em grupo (ou vice-versa) preserva os grupos cadastrados — eles ficam dormentes se você voltar pra Individual e voltam quando trocar de novo pra Grupo. Notas individuais não são alteradas.",
  },
  {
    pergunta: "Como as notas se conectam entre as telas?",
    resposta:
      "A nota de um aluno em uma atividade é compartilhada entre o grid de Notas, o modal de Atribuição na aba Atividades e o modal de Grupos. Editar em qualquer lugar reflete instantaneamente nos outros.",
  },
  {
    pergunta: "O que acontece se eu desatribuir um aluno que está em um grupo?",
    resposta:
      "Ele é removido automaticamente do grupo. Se o grupo ficar vazio, ele continua existindo (vazio) — você decide se apaga ou adiciona outros membros depois.",
  },
  {
    pergunta: "Posso filtrar minhas turmas?",
    resposta:
      "Sim. Em Turmas, Notas e Análise da turma, há uma barra de filtros com Disciplina, Ensino, Turno, Ano e Escola. Os filtros ficam na URL — você pode salvar como favorito ou compartilhar.",
  },
  {
    pergunta: "Como funciona o Dashboard de atividades?",
    resposta:
      "Vá em Dados → Dashboard atividades. Escolha escola, turma e atividade nos filtros (drill-down). Aparecem KPIs (notas lançadas, média, maior/menor, % aprovados), histograma por faixa, donut de distribuição e lista de quem falta lançar. Pra atividade em grupo, há toggle Visão grupo / Visão individual.",
  },
  {
    pergunta: "Como concluo uma turma no fim do ano?",
    resposta:
      "Na página da turma, clique no menu de 3 pontinhos no canto superior direito e escolha Concluir turma. A turma vira read-only mas continua consultável. Você pode reativar a qualquer momento pelo mesmo menu.",
  },
  {
    pergunta: "Esqueci de lançar uma nota — ela conta como zero?",
    resposta:
      "Sim. Atividades atribuídas ao aluno sem nota lançada contam como 0 no cálculo da média do bimestre. É uma decisão consciente: o sistema não \"perdoa\" atividade não feita. Se a atividade não é pro aluno (ex: recuperação dos outros), basta desatribuir.",
  },
  {
    pergunta: "Como mudo minha foto de perfil?",
    resposta:
      "O avatar é gerado automaticamente a partir das iniciais do seu nome, com fundo na cor padrão do sistema. Não é possível enviar uma foto.",
  },
];

export default function AjudaPage() {
  return (
    <div className="space-y-8">
      {/* Banner de boas-vindas */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="rounded-full bg-primary/10 p-3">
            <HelpCircle className="w-7 h-7 text-primary" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-default-900 mb-1">
              Bem-vindo à Central de ajuda do Diário Do Prof
            </h2>
            <p className="text-sm text-default-700">
              Aqui você encontra tutoriais, guias e respostas para usar o
              sistema da melhor forma.
            </p>
          </div>
        </div>
      </Card>

      {/* Guia rápido */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-default-900">
          Guia rápido — Primeiros passos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PASSOS.map((p) => (
            <Card key={p.numero} className="p-5 relative overflow-hidden">
              <span className="absolute top-2 right-4 text-5xl font-bold text-default-100 dark:text-default-200/30 leading-none select-none">
                {p.numero}
              </span>
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md bg-primary/10 text-primary p-2 shrink-0">
                    {p.icon}
                  </div>
                  <h3 className="font-semibold text-default-900">{p.titulo}</h3>
                </div>
                <p className="text-sm text-default-600 leading-relaxed">
                  {p.descricao}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Vídeos tutoriais */}
      <section>
        <h2 className="text-xl font-bold text-default-900 mb-4">
          Vídeos tutoriais
        </h2>
        <Card className="p-5 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="rounded-full bg-primary/10 p-3 shrink-0">
                <PlayCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-default-900">
                  Assista aos tutoriais
                </h3>
                <p className="text-sm text-default-600">
                  Aprenda a usar o sistema com vídeos passo a passo.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/ajuda/videos">Ver vídeos</Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section>
        <FAQList items={FAQ} />
      </section>
    </div>
  );
}
