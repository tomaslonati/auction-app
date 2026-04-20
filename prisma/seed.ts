/**
 * Seed script — datos de prueba para Postman / desarrollo local
 * Uso: npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ── IDs fijos (se usan en el documento TESTING.md) ─────────────────────────
const AUCTION_ACTIVA_ID     = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const AUCTION_PROGRAMADA_ID = 'a1111111-1111-4111-a111-111111111111'
const ITEM_EN_SUBASTA_ID    = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'
const ITEM_PENDIENTE_ID     = 'cccccccc-cccc-4ccc-accc-cccccccccccc'
const PM_ALICE_ID           = 'dddddddd-dddd-4ddd-addd-dddddddddddd'
const PM_BOB_ID             = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee'
const CONSIGNMENT_ALICE_ID  = 'ffffffff-ffff-4fff-afff-ffffffffffff'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter } as any)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🌱 Iniciando seed...\n')

  // ── 1. Limpiar datos anteriores del seed ────────────────────────────────
  console.log('🧹 Limpiando seed anterior...')
  // Borrar en orden respetando FKs
  await prisma.consignmentInspection.deleteMany({ where: { consignmentId: CONSIGNMENT_ALICE_ID } })
  await prisma.consignment.deleteMany({ where: { id: CONSIGNMENT_ALICE_ID } })
  await prisma.item.deleteMany({ where: { id: { in: [ITEM_EN_SUBASTA_ID, ITEM_PENDIENTE_ID] } } })
  await prisma.auction.deleteMany({ where: { id: { in: [AUCTION_ACTIVA_ID, AUCTION_PROGRAMADA_ID] } } })
  // bank_accounts tiene FK a payment_methods → borrar primero con raw SQL
  await prisma.$executeRaw`DELETE FROM bank_accounts WHERE "paymentMethodId" IN (${PM_ALICE_ID}, ${PM_BOB_ID})`
  await prisma.paymentMethod.deleteMany({ where: { id: { in: [PM_ALICE_ID, PM_BOB_ID] } } })

  // ── 2. Paises ───────────────────────────────────────────────────────────
  console.log('🌍 Creando países...')
  await prisma.pais.upsert({
    where: { numero: 54 },
    update: {},
    create: { numero: 54, nombre: 'Argentina', nombreCorto: 'AR', capital: 'Buenos Aires', nacionalidad: 'Argentino/a', idiomas: 'Español' },
  })
  await prisma.pais.upsert({
    where: { numero: 1 },
    update: {},
    create: { numero: 1, nombre: 'Estados Unidos', nombreCorto: 'US', capital: 'Washington D.C.', nacionalidad: 'Estadounidense', idiomas: 'Inglés' },
  })

  // ── 3. Usuarios en Supabase Auth + DB ───────────────────────────────────
  console.log('👤 Creando usuarios...')

  const seedUsers = [
    { email: 'alice@auction.test', password: 'alice1234!', nombre: 'Alice', apellido: 'García', categoria: 'oro' as const, estado: 'aprobado' as const, registroCompletado: true },
    { email: 'bob@auction.test',   password: 'bob12345!',  nombre: 'Bob',   apellido: 'Martínez', categoria: 'comun' as const, estado: 'aprobado' as const, registroCompletado: true },
    { email: 'charlie@auction.test', password: 'charlie123!', nombre: 'Charlie', apellido: 'López', categoria: null, estado: 'pendiente_verificacion' as const, registroCompletado: false },
  ]

  const userIds: Record<string, string> = {}

  // Fetch existing Supabase users once
  const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
  const authByEmail = new Map((existingAuthUsers?.users ?? []).map(u => [u.email!, u.id]))

  for (const u of seedUsers) {
    let authId = authByEmail.get(u.email)

    if (authId) {
      // Reset password so it matches seed
      await supabase.auth.admin.updateUserById(authId, { password: u.password, email_confirm: true })
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      })
      if (error || !data.user) throw new Error(`Auth user create failed for ${u.email}: ${error?.message}`)
      authId = data.user.id
    }

    userIds[u.email] = authId

    await prisma.user.upsert({
      where: { id: authId },
      update: { estado: u.estado, categoria: u.categoria, registroCompletado: u.registroCompletado },
      create: {
        id: authId,
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido,
        domicilio: 'Av. Corrientes 1234, CABA',
        estado: u.estado,
        categoria: u.categoria,
        registroCompletado: u.registroCompletado,
        numeroPais: 54,
      },
    })

    console.log(`   ✓ ${u.email}  id=${authId}`)
  }

  const ALICE_ID   = userIds['alice@auction.test']
  const BOB_ID     = userIds['bob@auction.test']
  const CHARLIE_ID = userIds['charlie@auction.test']

  // ── 4. Métodos de pago ──────────────────────────────────────────────────
  console.log('💳 Creando métodos de pago...')

  await prisma.paymentMethod.create({
    data: {
      id: PM_ALICE_ID,
      userId: ALICE_ID,
      tipo: 'cuenta_bancaria',
      estado: 'verificado',
      bankAccount: {
        create: { banco: 'Banco Nación', numeroCuenta: '0000000001', titular: 'Alice García', moneda: 'ARS', numeroPaisId: 54 },
      },
    },
  })

  await prisma.paymentMethod.create({
    data: {
      id: PM_BOB_ID,
      userId: BOB_ID,
      tipo: 'cuenta_bancaria',
      estado: 'verificado',
      bankAccount: {
        create: { banco: 'Banco Santander', numeroCuenta: '0000000002', titular: 'Bob Martínez', moneda: 'ARS', numeroPaisId: 54 },
      },
    },
  })

  console.log(`   ✓ PM Alice  id=${PM_ALICE_ID}`)
  console.log(`   ✓ PM Bob    id=${PM_BOB_ID}`)

  // ── 5. Subastas ─────────────────────────────────────────────────────────
  console.log('🔨 Creando subastas...')

  await prisma.auction.create({
    data: {
      id: AUCTION_ACTIVA_ID,
      nombre: 'Subasta Primavera 2026',
      descripcion: 'Arte y antigüedades — temporada primavera',
      fechaInicio: new Date('2026-04-01T18:00:00Z'),
      categoria: 'oro',
      estado: 'activa',
      moneda: 'pesos',
    },
  })

  await prisma.auction.create({
    data: {
      id: AUCTION_PROGRAMADA_ID,
      nombre: 'Subasta Invierno 2026',
      descripcion: 'Colección invierno — abierta a inscriptos',
      fechaInicio: new Date('2026-07-01T18:00:00Z'),
      categoria: 'comun',
      estado: 'programada',
      moneda: 'pesos',
    },
  })

  console.log(`   ✓ Activa      id=${AUCTION_ACTIVA_ID}`)
  console.log(`   ✓ Programada  id=${AUCTION_PROGRAMADA_ID}`)

  // ── 6. Ítems ────────────────────────────────────────────────────────────
  console.log('📦 Creando ítems...')

  await prisma.item.create({
    data: {
      id: ITEM_EN_SUBASTA_ID,
      numeroPieza: 'P-001',
      descripcion: 'Reloj de bolsillo Longines circa 1920',
      precioBase: 15000,
      duenUserId: ALICE_ID,
      subastaId: AUCTION_ACTIVA_ID,
      estado: 'en_subasta',
    },
  })

  await prisma.item.create({
    data: {
      id: ITEM_PENDIENTE_ID,
      numeroPieza: 'P-002',
      descripcion: 'Pintura al óleo "Paisaje Pampeano" (1950)',
      precioBase: 80000,
      duenUserId: ALICE_ID,
      subastaId: AUCTION_ACTIVA_ID,
      estado: 'pendiente',
      esObraArte: true,
      artistaDisenador: 'Carlos Victorica',
    },
  })

  console.log(`   ✓ P-001 en_subasta  id=${ITEM_EN_SUBASTA_ID}`)
  console.log(`   ✓ P-002 pendiente   id=${ITEM_PENDIENTE_ID}`)

  // ── 7. Consignación de Alice ─────────────────────────────────────────────
  console.log('📋 Creando consignación...')

  await prisma.consignment.create({
    data: {
      id: CONSIGNMENT_ALICE_ID,
      userId: ALICE_ID,
      descripcion: 'Jarrón de porcelana china, dinastía Qing',
      valorEstimado: 50000,
      esObraArte: true,
      historia: 'Adquirido en Christie\'s Londres, 1998',
      estado: 'aceptado',
      declaraTitularidad: true,
      aceptaDevolucionConCargo: true,
    },
  })

  await prisma.consignmentInspection.create({
    data: {
      consignmentId: CONSIGNMENT_ALICE_ID,
      resultado: 'aceptado',
      valorBaseAsignado: 45000,
      comisionPorcentaje: 15,
      userAcepta: true,
    },
  })

  console.log(`   ✓ Consignación Alice  id=${CONSIGNMENT_ALICE_ID}`)

  // ── Resumen final ────────────────────────────────────────────────────────
  console.log('\n✅ Seed completado.\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 RESUMEN DE IDs')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\nUSUARIOS`)
  console.log(`  alice   ${ALICE_ID}   alice@auction.test / alice1234!`)
  console.log(`  bob     ${BOB_ID}   bob@auction.test / bob12345!`)
  console.log(`  charlie ${CHARLIE_ID}   charlie@auction.test / charlie123!`)
  console.log(`\nMÉTODOS DE PAGO`)
  console.log(`  alice   ${PM_ALICE_ID}`)
  console.log(`  bob     ${PM_BOB_ID}`)
  console.log(`\nSUBASTAS`)
  console.log(`  activa      ${AUCTION_ACTIVA_ID}`)
  console.log(`  programada  ${AUCTION_PROGRAMADA_ID}`)
  console.log(`\nÍTEMS`)
  console.log(`  P-001 en_subasta  ${ITEM_EN_SUBASTA_ID}`)
  console.log(`  P-002 pendiente   ${ITEM_PENDIENTE_ID}`)
  console.log(`\nCONSIGNACIONES`)
  console.log(`  alice  ${CONSIGNMENT_ALICE_ID}`)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
