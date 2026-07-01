-- AlterTable
ALTER TABLE "agendamento_servicos" ADD COLUMN     "duracao_snapshot_minutos" INTEGER,
ADD COLUMN     "preco_snapshot" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "atendimento_servicos_adicionais" (
    "id" TEXT NOT NULL,
    "atendimento_id" TEXT NOT NULL,
    "servico_variante_id" TEXT NOT NULL,
    "preco_cobrado" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atendimento_servicos_adicionais_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "atendimento_servicos_adicionais" ADD CONSTRAINT "atendimento_servicos_adicionais_atendimento_id_fkey" FOREIGN KEY ("atendimento_id") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_servicos_adicionais" ADD CONSTRAINT "atendimento_servicos_adicionais_servico_variante_id_fkey" FOREIGN KEY ("servico_variante_id") REFERENCES "servico_variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
