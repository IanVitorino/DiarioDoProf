import { getMapeamento } from "@/actions/mapeamento";
import { SetupForm } from "@/components/mapeamento/setup-form";
import { MapeamentoView } from "@/components/mapeamento/mapeamento-view";

export default async function MapeamentoTabPage({
  params,
}: {
  params: { id: string };
}) {
  const { mapeamento, alunos } = await getMapeamento(params.id);

  if (alunos.length === 0) {
    return (
      <div className="rounded-md border border-default-200 p-12 text-center">
        <p className="text-default-700 mb-2 text-lg font-medium">
          Cadastre alunos primeiro
        </p>
        <p className="text-sm text-default-500">
          Adicione alunos na aba <strong>Alunos</strong> antes de configurar o
          mapeamento da sala.
        </p>
      </div>
    );
  }

  if (!mapeamento) {
    return <SetupForm turmaId={params.id} totalAlunos={alunos.length} />;
  }

  return (
    <MapeamentoView
      turmaId={params.id}
      alunos={alunos}
      mapeamento={{
        id: mapeamento.id,
        linhas: mapeamento.linhas,
        colunas: mapeamento.colunas,
        refDireitaTopo: mapeamento.refDireitaTopo,
        refEsquerdaBase: mapeamento.refEsquerdaBase,
        carteiras: mapeamento.carteiras.map((c) => ({
          id: c.id,
          linha: c.linha,
          coluna: c.coluna,
          alunoId: c.alunoId,
        })),
      }}
    />
  );
}
