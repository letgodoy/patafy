import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
process.loadEnvFile(resolve(__dirname, '../../../.env'))

import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const portes = [
  { nome: 'Miniatura', ordem: 1 }, // até 3kg
  { nome: 'Pequeno', ordem: 2 },   // 3–10kg
  { nome: 'Médio', ordem: 3 },     // 10–25kg
  { nome: 'Grande', ordem: 4 },    // 25–45kg
  { nome: 'Gigante', ordem: 5 },   // acima de 45kg
]

const pelagens = [
  { nome: 'Curta', ordem: 1 },
  { nome: 'Média', ordem: 2 },
  { nome: 'Longa', ordem: 3 },
  { nome: 'Dupla (undercoat)', ordem: 4 },
  { nome: 'Crespa / Encaracolada', ordem: 5 },
  { nome: 'Lisa', ordem: 6 },
  { nome: 'Áspera (wire)', ordem: 7 },
  { nome: 'Sem pelo', ordem: 8 },
]

const tiposEracas: { tipo: string; ordem: number; racas: string[] }[] = [
  {
    tipo: 'Cachorro',
    ordem: 1,
    racas: [
      'SRD (Sem Raça Definida)',
      'Golden Retriever',
      'Labrador Retriever',
      'Bulldog Francês',
      'Poodle',
      'Yorkshire Terrier',
      'Shih Tzu',
      'Dachshund (Salsicha)',
      'Beagle',
      'Lhasa Apso',
      'Maltês',
      'Pinscher',
      'Rottweiler',
      'Pastor Alemão',
      'Border Collie',
      'Husky Siberiano',
      'Cocker Spaniel Americano',
      'Cocker Spaniel Inglês',
      'Bichon Frisé',
      'Chow Chow',
      'Akita',
      'Spitz Alemão (Lulu da Pomerânia)',
      'Boxer',
      'Dobermann',
      'Schnauzer Miniatura',
      'Schnauzer Médio',
      'Schnauzer Gigante',
      'American Pit Bull Terrier',
      'American Bully',
      'Weimaraner',
      'Dálmata',
      'São Bernardo',
      'Basset Hound',
      'Cavalier King Charles Spaniel',
      'West Highland White Terrier',
      'Bulldog Inglês',
      'Chihuahua',
      'Jack Russell Terrier',
      'Shar Pei',
      'Bernese Mountain Dog',
      'Great Dane (Dogue Alemão)',
      'Mastiff Inglês',
      'Irish Setter',
      'Samoieda',
      'Malamute do Alasca',
      'Shiba Inu',
      'Fila Brasileiro',
      'Pastor Belga Malinois',
      'Whippet',
      'Basenji',
      'Pug',
      'Buldogue Americano',
      'Dogue de Bordeaux',
      'Cane Corso',
      'Braco Alemão',
      'Vizsla',
      'Setter Irlandês',
      'Pastor Australiano',
      'Boiadeiro Australiano',
      'Border Terrier',
      'Fox Terrier',
      'Airedale Terrier',
    ],
  },
  {
    tipo: 'Gato',
    ordem: 2,
    racas: [
      'SRD (Sem Raça Definida)',
      'Persa',
      'Siamês',
      'Maine Coon',
      'Ragdoll',
      'Bengal',
      'British Shorthair',
      'Scottish Fold',
      'Sphynx',
      'Abissínio',
      'Angorá Turco',
      'Birmanês',
      'Burmês',
      'Himalaio',
      'Norueguês da Floresta',
      'Munchkin',
      'Pelo Curto Brasileiro',
      'Savannah',
      'Exótico de Pelo Curto',
      'Devon Rex',
      'Cornish Rex',
      'Russio Azul',
    ],
  },
  {
    tipo: 'Pássaro',
    ordem: 3,
    racas: [
      'Calopsita',
      'Periquito Australiano',
      'Agapornis (Pássaro do Amor)',
      'Canário',
      'Papagaio Verdadeiro',
      'Papagaio Africano (Grey)',
      'Ararajuba',
      'Rosela',
      'Cacatua',
      'Ninfas',
      'Manon',
      'Diamante de Gould',
      'Pintassilgo',
      'Coleirinha',
    ],
  },
  {
    tipo: 'Roedor',
    ordem: 4,
    racas: [
      'Hamster Sírio',
      'Hamster Anão Russo',
      'Hamster Anão Campbell',
      'Porquinho da Índia (Cobaio)',
      'Chinchila',
      'Gerbil',
      'Rato Doméstico',
      'Camundongo',
      'Esquilo da Sibéria (Chipmunk)',
    ],
  },
  {
    tipo: 'Coelho',
    ordem: 5,
    racas: [
      'SRD (Sem Raça Definida)',
      'Mini Rex',
      'Holandês (Dutch)',
      'Angorá Inglês',
      'Angorá Francês',
      'Lion Head',
      'Mini Lop',
      'Holland Lop',
      'Lionhead',
      'Nova Zelândia',
    ],
  },
  {
    tipo: 'Réptil',
    ordem: 6,
    racas: [
      'Iguana Verde',
      'Gecko Leopardo',
      'Dragão Barbudo (Beardie)',
      'Jabuti Piranga',
      'Jabuti Tinga',
      'Tartaruga de Orelha Vermelha',
      'Cobra do Milho',
      'Cobra Real',
      'Camaleão Véu',
      'Blue Tongue Skink',
    ],
  },
  {
    tipo: 'Peixe',
    ordem: 7,
    racas: [
      'Betta',
      'Goldfish',
      'Guppy',
      'Neon Tetra',
      'Acará Disco',
      'Platy',
      'Molly',
      'Kinguio',
      'Oscar',
      'Acará Bandeira',
      'Corydora',
      'Pleco (Acari)',
      'Aruana',
    ],
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Iniciando seed do catálogo global...\n')

  // Portes
  console.log('→ Portes...')
  for (const p of portes) {
    await prisma.porte.upsert({ where: { nome: p.nome }, update: { ordem: p.ordem }, create: p })
  }
  console.log(`  ✓ ${portes.length} portes`)

  // Pelagens
  console.log('→ Pelagens...')
  for (const p of pelagens) {
    await prisma.pelagem.upsert({ where: { nome: p.nome }, update: { ordem: p.ordem }, create: p })
  }
  console.log(`  ✓ ${pelagens.length} pelagens`)

  // Tipos de animal + raças
  console.log('→ Tipos de animal e raças...')
  let totalRacas = 0
  for (const { tipo, ordem, racas } of tiposEracas) {
    const tipoRecord = await prisma.tipoAnimal.upsert({
      where: { nome: tipo },
      update: { ordem },
      create: { nome: tipo, ordem },
    })

    for (let i = 0; i < racas.length; i++) {
      await prisma.raca.upsert({
        where: { tipo_animal_id_nome: { tipo_animal_id: tipoRecord.id, nome: racas[i] } },
        update: { ordem: i + 1 },
        create: { tipo_animal_id: tipoRecord.id, nome: racas[i], ordem: i + 1 },
      })
    }

    console.log(`  ✓ ${tipo}: ${racas.length} raças`)
    totalRacas += racas.length
  }

  console.log(`\n✅ Seed concluído!`)
  console.log(`   ${tiposEracas.length} tipos de animal`)
  console.log(`   ${totalRacas} raças`)
  console.log(`   ${portes.length} portes`)
  console.log(`   ${pelagens.length} pelagens`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
