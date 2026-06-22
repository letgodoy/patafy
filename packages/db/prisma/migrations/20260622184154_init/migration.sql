-- CreateEnum
CREATE TYPE "AgendamentoStatus" AS ENUM ('AguardandoConfirmacao', 'Confirmado', 'Cancelado', 'EmAndamento', 'Atrasado', 'Pronto', 'Finalizado', 'NaoCompareceu');

-- CreateEnum
CREATE TYPE "AgendamentoOrigem" AS ENUM ('tutor', 'atendente');

-- CreateEnum
CREATE TYPE "PetTutorTipo" AS ENUM ('responsavel', 'autorizado');

-- CreateEnum
CREATE TYPE "ConviteStatus" AS ENUM ('pendente', 'aceito', 'expirado', 'revogado');

-- CreateEnum
CREATE TYPE "PetshopUserRole" AS ENUM ('owner', 'atendente', 'banhista');

-- CreateEnum
CREATE TYPE "NotificacaoCanal" AS ENUM ('email', 'push');

-- CreateEnum
CREATE TYPE "NotificacaoTipo" AS ENUM ('agendado', 'confirmado', 'cancelado', 'alterado');

-- CreateEnum
CREATE TYPE "NotificacaoStatus" AS ENUM ('pendente', 'enviado', 'falha');

-- CreateEnum
CREATE TYPE "AtendimentoServicoOrigem" AS ENUM ('agendamento', 'balcao');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tutor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petshop_user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "petshop_id" TEXT NOT NULL,
    "roles" "PetshopUserRole"[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "petshop_user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_animal" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racas" (
    "id" TEXT NOT NULL,
    "tipo_animal_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "racas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pelagens" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pelagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "tipo_animal_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raca_id" TEXT,
    "porte_id" TEXT,
    "pelagem_id" TEXT,
    "idade" INTEGER,
    "peso" DECIMAL(5,2),
    "agressivo" BOOLEAN NOT NULL DEFAULT false,
    "cuidados_especiais" TEXT,
    "obs_internas" JSONB NOT NULL DEFAULT '{}',
    "obs_compartilhadas" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_tutores" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "tutor_profile_id" TEXT NOT NULL,
    "tipo" "PetTutorTipo" NOT NULL DEFAULT 'responsavel',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_tutor_convites" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "convitador_tutor_profile_id" TEXT NOT NULL,
    "convidado_email" TEXT NOT NULL,
    "convidado_tutor_profile_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "status" "ConviteStatus" NOT NULL DEFAULT 'pendente',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ,

    CONSTRAINT "pet_tutor_convites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petshops" (
    "id" TEXT NOT NULL,
    "nome_exibicao" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "telefone" TEXT,
    "email" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "config_json" JSONB NOT NULL DEFAULT '{"schema_version": 2}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "petshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_servico" (
    "id" TEXT NOT NULL,
    "petshop_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "petshop_id" TEXT NOT NULL,
    "categoria_id" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico_variantes" (
    "id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "porte_id" TEXT,
    "raca_id" TEXT,
    "pelagem_id" TEXT,
    "duracao_minutos" INTEGER NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servico_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacotes" (
    "id" TEXT NOT NULL,
    "petshop_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "travado" BOOLEAN NOT NULL DEFAULT true,
    "desconto_percentual" DECIMAL(5,2),
    "validade" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pacotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacote_variantes" (
    "id" TEXT NOT NULL,
    "pacote_id" TEXT NOT NULL,
    "porte_id" TEXT,
    "pelagem_id" TEXT,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacote_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacote_items" (
    "id" TEXT NOT NULL,
    "pacote_id" TEXT NOT NULL,
    "servico_variante_id" TEXT NOT NULL,
    "quantidade_total" INTEGER NOT NULL,
    "quantidade_usada" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacote_item_debitos" (
    "id" TEXT NOT NULL,
    "agendamento_id" TEXT NOT NULL,
    "pacote_pet_id" TEXT NOT NULL,
    "pacote_item_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacote_item_debitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacote_pets" (
    "id" TEXT NOT NULL,
    "pacote_id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "data_ativacao" DATE NOT NULL,
    "data_expiracao" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacote_pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "petshop_id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "tutor_profile_id" TEXT NOT NULL,
    "data_hora_inicio" TIMESTAMPTZ NOT NULL,
    "duracao_total_minutos" INTEGER NOT NULL,
    "banhista_id" TEXT,
    "banhista_fixado_pelo_tutor" BOOLEAN NOT NULL DEFAULT false,
    "status" "AgendamentoStatus" NOT NULL DEFAULT 'AguardandoConfirmacao',
    "origem" "AgendamentoOrigem" NOT NULL DEFAULT 'tutor',
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "precisa_transporte" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamento_servicos" (
    "id" TEXT NOT NULL,
    "agendamento_id" TEXT NOT NULL,
    "servico_variante_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamento_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "agendamento_id" TEXT NOT NULL,
    "banhista_id" TEXT NOT NULL,
    "observacoes_internas" TEXT,
    "observacoes_gerais" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimento_servicos" (
    "id" TEXT NOT NULL,
    "atendimento_id" TEXT NOT NULL,
    "servico_variante_id" TEXT NOT NULL,
    "origem" "AtendimentoServicoOrigem" NOT NULL DEFAULT 'agendamento',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atendimento_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios_agenda" (
    "id" TEXT NOT NULL,
    "petshop_id" TEXT NOT NULL,
    "banhista_id" TEXT,
    "data_inicio" TIMESTAMPTZ NOT NULL,
    "data_fim" TIMESTAMPTZ NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes_outbox" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agendamento_id" TEXT,
    "canal" "NotificacaoCanal" NOT NULL DEFAULT 'email',
    "tipo" "NotificacaoTipo" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificacaoStatus" NOT NULL DEFAULT 'pendente',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "data_envio" TIMESTAMPTZ,
    "erro" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notificacoes_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_operacionais" (
    "id" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_user_id" TEXT,
    "petshop_id" TEXT,
    "agendamento_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "registros_operacionais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_profiles_user_id_key" ON "tutor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "petshop_user_profiles_user_id_petshop_id_key" ON "petshop_user_profiles"("user_id", "petshop_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_animal_nome_key" ON "tipos_animal"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "racas_tipo_animal_id_nome_key" ON "racas"("tipo_animal_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "portes_nome_key" ON "portes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "pelagens_nome_key" ON "pelagens"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "pet_tutores_pet_id_tutor_profile_id_key" ON "pet_tutores"("pet_id", "tutor_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "pet_tutor_convites_token_hash_key" ON "pet_tutor_convites"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "petshops_cnpj_key" ON "petshops"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "pacote_item_debitos_agendamento_id_pacote_item_id_key" ON "pacote_item_debitos"("agendamento_id", "pacote_item_id");

-- CreateIndex
CREATE INDEX "agendamentos_petshop_id_data_hora_inicio_idx" ON "agendamentos"("petshop_id", "data_hora_inicio");

-- CreateIndex
CREATE INDEX "agendamentos_banhista_id_data_hora_inicio_idx" ON "agendamentos"("banhista_id", "data_hora_inicio");

-- CreateIndex
CREATE INDEX "agendamentos_pet_id_idx" ON "agendamentos"("pet_id");

-- CreateIndex
CREATE INDEX "agendamentos_tutor_profile_id_idx" ON "agendamentos"("tutor_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_agendamento_id_key" ON "atendimentos"("agendamento_id");

-- CreateIndex
CREATE INDEX "bloqueios_agenda_petshop_id_data_inicio_idx" ON "bloqueios_agenda"("petshop_id", "data_inicio");

-- CreateIndex
CREATE INDEX "notificacoes_outbox_status_created_at_idx" ON "notificacoes_outbox"("status", "created_at");

-- CreateIndex
CREATE INDEX "registros_operacionais_petshop_id_occurred_at_idx" ON "registros_operacionais"("petshop_id", "occurred_at");

-- CreateIndex
CREATE INDEX "registros_operacionais_entity_type_entity_id_idx" ON "registros_operacionais"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "tutor_profiles" ADD CONSTRAINT "tutor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petshop_user_profiles" ADD CONSTRAINT "petshop_user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petshop_user_profiles" ADD CONSTRAINT "petshop_user_profiles_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racas" ADD CONSTRAINT "racas_tipo_animal_id_fkey" FOREIGN KEY ("tipo_animal_id") REFERENCES "tipos_animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_tipo_animal_id_fkey" FOREIGN KEY ("tipo_animal_id") REFERENCES "tipos_animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_porte_id_fkey" FOREIGN KEY ("porte_id") REFERENCES "portes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_pelagem_id_fkey" FOREIGN KEY ("pelagem_id") REFERENCES "pelagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_tutores" ADD CONSTRAINT "pet_tutores_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_tutores" ADD CONSTRAINT "pet_tutores_tutor_profile_id_fkey" FOREIGN KEY ("tutor_profile_id") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_tutor_convites" ADD CONSTRAINT "pet_tutor_convites_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_tutor_convites" ADD CONSTRAINT "pet_tutor_convites_convitador_tutor_profile_id_fkey" FOREIGN KEY ("convitador_tutor_profile_id") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_servico" ADD CONSTRAINT "categorias_servico_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_variantes" ADD CONSTRAINT "servico_variantes_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_variantes" ADD CONSTRAINT "servico_variantes_porte_id_fkey" FOREIGN KEY ("porte_id") REFERENCES "portes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_variantes" ADD CONSTRAINT "servico_variantes_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_variantes" ADD CONSTRAINT "servico_variantes_pelagem_id_fkey" FOREIGN KEY ("pelagem_id") REFERENCES "pelagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacotes" ADD CONSTRAINT "pacotes_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_variantes" ADD CONSTRAINT "pacote_variantes_pacote_id_fkey" FOREIGN KEY ("pacote_id") REFERENCES "pacotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_variantes" ADD CONSTRAINT "pacote_variantes_porte_id_fkey" FOREIGN KEY ("porte_id") REFERENCES "portes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_variantes" ADD CONSTRAINT "pacote_variantes_pelagem_id_fkey" FOREIGN KEY ("pelagem_id") REFERENCES "pelagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_items" ADD CONSTRAINT "pacote_items_pacote_id_fkey" FOREIGN KEY ("pacote_id") REFERENCES "pacotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_items" ADD CONSTRAINT "pacote_items_servico_variante_id_fkey" FOREIGN KEY ("servico_variante_id") REFERENCES "servico_variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_item_debitos" ADD CONSTRAINT "pacote_item_debitos_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_item_debitos" ADD CONSTRAINT "pacote_item_debitos_pacote_pet_id_fkey" FOREIGN KEY ("pacote_pet_id") REFERENCES "pacote_pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_item_debitos" ADD CONSTRAINT "pacote_item_debitos_pacote_item_id_fkey" FOREIGN KEY ("pacote_item_id") REFERENCES "pacote_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_pets" ADD CONSTRAINT "pacote_pets_pacote_id_fkey" FOREIGN KEY ("pacote_id") REFERENCES "pacotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_pets" ADD CONSTRAINT "pacote_pets_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_tutor_profile_id_fkey" FOREIGN KEY ("tutor_profile_id") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_banhista_id_fkey" FOREIGN KEY ("banhista_id") REFERENCES "petshop_user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento_servicos" ADD CONSTRAINT "agendamento_servicos_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento_servicos" ADD CONSTRAINT "agendamento_servicos_servico_variante_id_fkey" FOREIGN KEY ("servico_variante_id") REFERENCES "servico_variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_banhista_id_fkey" FOREIGN KEY ("banhista_id") REFERENCES "petshop_user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_servicos" ADD CONSTRAINT "atendimento_servicos_atendimento_id_fkey" FOREIGN KEY ("atendimento_id") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_servicos" ADD CONSTRAINT "atendimento_servicos_servico_variante_id_fkey" FOREIGN KEY ("servico_variante_id") REFERENCES "servico_variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_agenda" ADD CONSTRAINT "bloqueios_agenda_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_outbox" ADD CONSTRAINT "notificacoes_outbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_outbox" ADD CONSTRAINT "notificacoes_outbox_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_operacionais" ADD CONSTRAINT "registros_operacionais_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_operacionais" ADD CONSTRAINT "registros_operacionais_petshop_id_fkey" FOREIGN KEY ("petshop_id") REFERENCES "petshops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_operacionais" ADD CONSTRAINT "registros_operacionais_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
