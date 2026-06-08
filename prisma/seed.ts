/**
 * Seed script — datos de prueba para demo / entrega TPO
 * Uso: npx tsx prisma/seed.ts
 *
 * Usuarios:
 *   alice@auction.test   / alice1234!   → oro, aprobado
 *   bob@auction.test     / bob12345!    → comun, aprobado
 *   diana@auction.test   / diana123!    → platino, aprobado (tarjeta internacional)
 *   charlie@auction.test / charlie123!  → comun, multado (multa pendiente)
 *   eva@auction.test     / eva12345!    → comun, pendiente_verificacion
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ── IDs fijos ───────────────────────────────────────────────────────────────
const PM_ALICE_ID        = 'dddddddd-dddd-4ddd-addd-dddddddddddd'
const PM_BOB_ID          = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee'
const PM_DIANA_ID        = 'fd100000-0000-4000-8000-000000000001'
const PM_CHARLIE_ID      = 'fd100000-0000-4000-8000-000000000002'

const AUCTION_ACTIVA_ID     = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const AUCTION_PROGRAMADA_ID = 'a1111111-1111-4111-a111-111111111111'
const AUCTION_FINALIZADA_ID = 'a2222222-2222-4222-a222-222222222222'

// Items de la subasta activa
const ITEM_001_ID = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb' // P-001 en_subasta (bids activos)
const ITEM_002_ID = 'b1111111-1111-4111-b111-111111111111' // P-002 en_subasta (obra de arte)
const ITEM_003_ID = 'cccccccc-cccc-4ccc-accc-cccccccccccc' // P-003 pendiente
// Items de la subasta finalizada
const ITEM_004_ID = 'b2222222-2222-4222-b222-222222222222' // P-004 vendido → alice compró
const ITEM_005_ID = 'b3333333-3333-4333-b333-333333333333' // P-005 vendido → charlie compró (y no pagó)

const BID_BOB_001_ID     = 'bd100000-0000-4000-8000-000000000001' // bob pujó P-001 → superada
const BID_ALICE_001_ID   = 'bd100000-0000-4000-8000-000000000002' // alice pujó P-001 → actual ganadora
const BID_ALICE_004_ID   = 'bd100000-0000-4000-8000-000000000003' // alice ganó P-004
const BID_CHARLIE_005_ID = 'bd100000-0000-4000-8000-000000000004' // charlie ganó P-005

const PURCHASE_ALICE_ID   = 'pc100000-0000-4000-8000-000000000001'
const PURCHASE_CHARLIE_ID = 'pc100000-0000-4000-8000-000000000002'

const PENALTY_CHARLIE_ID = 'pe100000-0000-4000-8000-000000000001'

const DEPOSIT_ID   = 'de100000-0000-4000-8000-000000000001'
const INSURANCE_ID = 'in100000-0000-4000-8000-000000000001'

// Consignaciones — una por cada estado del ciclo de vida
const CON_EVALUACION_ID  = 'ca100000-0000-4000-8000-000000000001' // bob  → en_evaluacion
const CON_PEND_RESP_ID   = 'ca100000-0000-4000-8000-000000000002' // alice → aceptado, userAcepta null
const CON_ACEPTADO_ID    = 'ffffffff-ffff-4fff-afff-ffffffffffff' // alice → aceptado, userAcepta true
const CON_RECHAZADO_ID   = 'ca100000-0000-4000-8000-000000000004' // bob  → rechazado
const CON_DEPOSITO_ID    = 'ca100000-0000-4000-8000-000000000005' // alice → en_deposito + seguro + cuenta
const CON_SUBASTADO_ID   = 'ca100000-0000-4000-8000-000000000006' // alice → subastado (ligado a P-002)

const ALL_PM_IDS          = [PM_ALICE_ID, PM_BOB_ID, PM_DIANA_ID, PM_CHARLIE_ID]
const ALL_AUCTION_IDS     = [AUCTION_ACTIVA_ID, AUCTION_PROGRAMADA_ID, AUCTION_FINALIZADA_ID]
const ALL_ITEM_IDS        = [ITEM_001_ID, ITEM_002_ID, ITEM_003_ID, ITEM_004_ID, ITEM_005_ID]
const ALL_CONSIGNMENT_IDS = [CON_EVALUACION_ID, CON_PEND_RESP_ID, CON_ACEPTADO_ID, CON_RECHAZADO_ID, CON_DEPOSITO_ID, CON_SUBASTADO_ID]

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter } as any)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  console.log('🌱 Iniciando seed...\n')

  // ── 1. Limpiar seed anterior ─────────────────────────────────────────────
  // Usamos $executeRawUnsafe con IDs embebidos como literales SQL para evitar
  // que el driver pg infiera OID uuid en columnas TEXT y genere "text = uuid".
  console.log('🧹 Limpiando seed anterior...')

  const lit  = (id: string)    => `'${id}'`
  const inSq = (ids: string[]) => ids.map(lit).join(', ')

  // Respetar orden de FKs: de hijos a padres
  await prisma.$executeRawUnsafe(`DELETE FROM penalties                   WHERE id                 = ${lit(PENALTY_CHARLIE_ID)}`)
  await prisma.$executeRawUnsafe(`DELETE FROM purchases                   WHERE "subastaId"        IN (${inSq(ALL_AUCTION_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM bids                        WHERE "itemId"           IN (${inSq(ALL_ITEM_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM auction_sessions            WHERE "auctionId"        IN (${inSq(ALL_AUCTION_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM insurance_policy_consignments WHERE "consignmentId" IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM consignment_items           WHERE "consignmentId"    IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM consignment_locations       WHERE "consignmentId"    IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM consignment_inspections     WHERE "consignmentId"    IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM consignment_photos          WHERE "consignmentId"    IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM consignment_specs           WHERE "consignmentId"    IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM payout_accounts             WHERE "consignmentId"    IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM consignments                WHERE id                IN (${inSq(ALL_CONSIGNMENT_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM item_images                 WHERE "itemId"           IN (${inSq(ALL_ITEM_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM items                       WHERE id                IN (${inSq(ALL_ITEM_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM insurance_policies          WHERE id                 = ${lit(INSURANCE_ID)}`)
  await prisma.$executeRawUnsafe(`DELETE FROM deposits                    WHERE id                 = ${lit(DEPOSIT_ID)}`)
  await prisma.$executeRawUnsafe(`DELETE FROM auctions                    WHERE id                IN (${inSq(ALL_AUCTION_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM bank_accounts               WHERE "paymentMethodId" IN (${inSq(ALL_PM_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM credit_cards                WHERE "paymentMethodId" IN (${inSq(ALL_PM_IDS)})`)
  await prisma.$executeRawUnsafe(`DELETE FROM payment_methods             WHERE id                IN (${inSq(ALL_PM_IDS)})`)

  console.log('   ✓ Listo\n')

  // ── 2. Países ────────────────────────────────────────────────────────────
  console.log('🌍 Upsert países...')
  const paisesData = [
    { numero: 54,   nombre: 'Argentina',           nombreCorto: 'AR', capital: 'Buenos Aires',     nacionalidad: 'Argentino/a',    idiomas: 'Español' },
    { numero: 591,  nombre: 'Bolivia',              nombreCorto: 'BO', capital: 'Sucre',            nacionalidad: 'Boliviano/a',    idiomas: 'Español' },
    { numero: 55,   nombre: 'Brasil',               nombreCorto: 'BR', capital: 'Brasilia',         nacionalidad: 'Brasileño/a',    idiomas: 'Portugués' },
    { numero: 56,   nombre: 'Chile',                nombreCorto: 'CL', capital: 'Santiago',         nacionalidad: 'Chileno/a',      idiomas: 'Español' },
    { numero: 57,   nombre: 'Colombia',             nombreCorto: 'CO', capital: 'Bogotá',           nacionalidad: 'Colombiano/a',   idiomas: 'Español' },
    { numero: 506,  nombre: 'Costa Rica',           nombreCorto: 'CR', capital: 'San José',         nacionalidad: 'Costarricense',  idiomas: 'Español' },
    { numero: 53,   nombre: 'Cuba',                 nombreCorto: 'CU', capital: 'La Habana',        nacionalidad: 'Cubano/a',       idiomas: 'Español' },
    { numero: 593,  nombre: 'Ecuador',              nombreCorto: 'EC', capital: 'Quito',            nacionalidad: 'Ecuatoriano/a',  idiomas: 'Español' },
    { numero: 503,  nombre: 'El Salvador',          nombreCorto: 'SV', capital: 'San Salvador',     nacionalidad: 'Salvadoreño/a',  idiomas: 'Español' },
    { numero: 34,   nombre: 'España',               nombreCorto: 'ES', capital: 'Madrid',           nacionalidad: 'Español/a',      idiomas: 'Español' },
    { numero: 1,    nombre: 'Estados Unidos',       nombreCorto: 'US', capital: 'Washington D.C.',  nacionalidad: 'Estadounidense', idiomas: 'Inglés' },
    { numero: 33,   nombre: 'Francia',              nombreCorto: 'FR', capital: 'París',            nacionalidad: 'Francés/a',      idiomas: 'Francés' },
    { numero: 502,  nombre: 'Guatemala',            nombreCorto: 'GT', capital: 'Guatemala',        nacionalidad: 'Guatemalteco/a', idiomas: 'Español' },
    { numero: 504,  nombre: 'Honduras',             nombreCorto: 'HN', capital: 'Tegucigalpa',      nacionalidad: 'Hondureño/a',    idiomas: 'Español' },
    { numero: 39,   nombre: 'Italia',               nombreCorto: 'IT', capital: 'Roma',             nacionalidad: 'Italiano/a',     idiomas: 'Italiano' },
    { numero: 52,   nombre: 'México',               nombreCorto: 'MX', capital: 'Ciudad de México', nacionalidad: 'Mexicano/a',     idiomas: 'Español' },
    { numero: 505,  nombre: 'Nicaragua',            nombreCorto: 'NI', capital: 'Managua',          nacionalidad: 'Nicaragüense',   idiomas: 'Español' },
    { numero: 507,  nombre: 'Panamá',               nombreCorto: 'PA', capital: 'Ciudad de Panamá', nacionalidad: 'Panameño/a',     idiomas: 'Español' },
    { numero: 595,  nombre: 'Paraguay',             nombreCorto: 'PY', capital: 'Asunción',         nacionalidad: 'Paraguayo/a',    idiomas: 'Español' },
    { numero: 51,   nombre: 'Perú',                 nombreCorto: 'PE', capital: 'Lima',             nacionalidad: 'Peruano/a',      idiomas: 'Español' },
    { numero: 351,  nombre: 'Portugal',             nombreCorto: 'PT', capital: 'Lisboa',           nacionalidad: 'Portugués/a',    idiomas: 'Portugués' },
    { numero: 44,   nombre: 'Reino Unido',          nombreCorto: 'GB', capital: 'Londres',          nacionalidad: 'Británico/a',    idiomas: 'Inglés' },
    { numero: 1809, nombre: 'República Dominicana', nombreCorto: 'DO', capital: 'Santo Domingo',    nacionalidad: 'Dominicano/a',   idiomas: 'Español' },
    { numero: 598,  nombre: 'Uruguay',              nombreCorto: 'UY', capital: 'Montevideo',       nacionalidad: 'Uruguayo/a',     idiomas: 'Español' },
    { numero: 58,   nombre: 'Venezuela',            nombreCorto: 'VE', capital: 'Caracas',          nacionalidad: 'Venezolano/a',   idiomas: 'Español' },
  ]
  for (const p of paisesData) {
    await prisma.pais.upsert({ where: { numero: p.numero }, update: {}, create: p })
  }
  console.log(`   ✓ ${paisesData.length} países\n`)

  // ── 3. Usuarios (Supabase Auth + DB) ─────────────────────────────────────
  console.log('👤 Creando usuarios...')

  const seedUsers = [
    { email: 'alice@auction.test',   password: 'alice1234!',  nombre: 'Alice',   apellido: 'García',    categoria: 'oro'     as const, estado: 'aprobado'               as const, registroCompletado: true  },
    { email: 'bob@auction.test',     password: 'bob12345!',   nombre: 'Bob',     apellido: 'Martínez',  categoria: 'comun'   as const, estado: 'aprobado'               as const, registroCompletado: true  },
    { email: 'diana@auction.test',   password: 'diana123!',   nombre: 'Diana',   apellido: 'Rodríguez', categoria: 'platino' as const, estado: 'aprobado'               as const, registroCompletado: true  },
    { email: 'charlie@auction.test', password: 'charlie123!', nombre: 'Charlie', apellido: 'López',     categoria: 'comun'   as const, estado: 'multado'                as const, registroCompletado: true  },
    { email: 'eva@auction.test',     password: 'eva12345!',   nombre: 'Eva',     apellido: 'Fernández', categoria: null,                estado: 'pendiente_verificacion' as const, registroCompletado: false },
  ]

  const userIds: Record<string, string> = {}
  const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
  const authByEmail = new Map((existingAuthUsers?.users ?? []).map(u => [u.email!, u.id]))

  for (const u of seedUsers) {
    let authId = authByEmail.get(u.email)
    if (authId) {
      await supabase.auth.admin.updateUserById(authId, { password: u.password, email_confirm: true })
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email, password: u.password, email_confirm: true,
      })
      if (error || !data.user) throw new Error(`Auth create falló para ${u.email}: ${error?.message}`)
      authId = data.user.id
    }
    userIds[u.email] = authId
    await prisma.user.upsert({
      where: { id: authId },
      update: { estado: u.estado, categoria: u.categoria, registroCompletado: u.registroCompletado },
      create: {
        id: authId, email: u.email, nombre: u.nombre, apellido: u.apellido,
        domicilio: 'Av. Corrientes 1234, CABA',
        estado: u.estado, categoria: u.categoria,
        registroCompletado: u.registroCompletado, numeroPais: 54,
        documento: '2000000' + String(seedUsers.indexOf(u) + 1),
      },
    })
    console.log(`   ✓ ${u.email}  [${u.estado}]`)
  }

  const ALICE_ID   = userIds['alice@auction.test']
  const BOB_ID     = userIds['bob@auction.test']
  const DIANA_ID   = userIds['diana@auction.test']
  const CHARLIE_ID = userIds['charlie@auction.test']

  // ── 4. Métodos de pago ────────────────────────────────────────────────────
  console.log('\n💳 Creando métodos de pago...')

  await prisma.paymentMethod.create({
    data: {
      id: PM_ALICE_ID, userId: ALICE_ID, tipo: 'cuenta_bancaria', estado: 'verificado',
      bankAccount: { create: { banco: 'Banco Nación Argentina', numeroCuenta: '0110000000000000001', titular: 'Alice García', moneda: 'ARS', numeroPaisId: 54 } },
    },
  })

  await prisma.paymentMethod.create({
    data: {
      id: PM_BOB_ID, userId: BOB_ID, tipo: 'cuenta_bancaria', estado: 'verificado',
      bankAccount: { create: { banco: 'Banco Santander', numeroCuenta: '0720000000000000002', titular: 'Bob Martínez', moneda: 'ARS', numeroPaisId: 54 } },
    },
  })

  await prisma.paymentMethod.create({
    data: {
      id: PM_DIANA_ID, userId: DIANA_ID, tipo: 'tarjeta_credito', estado: 'verificado', esInternacional: true,
      creditCard: { create: { ultimosCuatro: '4242', marca: 'Visa', titular: 'Diana Rodríguez', mesVencimiento: 12, anioVencimiento: 2028 } },
    },
  })

  await prisma.paymentMethod.create({
    data: {
      id: PM_CHARLIE_ID, userId: CHARLIE_ID, tipo: 'cuenta_bancaria', estado: 'verificado',
      bankAccount: { create: { banco: 'Banco Provincia', numeroCuenta: '0140000000000000003', titular: 'Charlie López', moneda: 'ARS', numeroPaisId: 54 } },
    },
  })

  console.log('   ✓ PM alice   (cuenta_bancaria, verificado)')
  console.log('   ✓ PM bob     (cuenta_bancaria, verificado)')
  console.log('   ✓ PM diana   (tarjeta_credito, internacional, verificado)')
  console.log('   ✓ PM charlie (cuenta_bancaria, verificado)')

  // ── 5. Subastas ───────────────────────────────────────────────────────────
  console.log('\n🔨 Creando subastas...')

  const now = new Date()
  const in48h    = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.auction.create({
    data: {
      id: AUCTION_ACTIVA_ID,
      nombre: 'Gran Subasta de Arte — Temporada 2026',
      descripcion: 'Selección especial de arte latinoamericano, antigüedades europeas y reliquias de coleccionistas. Categoría oro: sin límite máximo de oferta.',
      fechaInicio: twoDaysAgo,
      fechaFin: in48h,
      categoria: 'oro',
      estado: 'activa',
      moneda: 'pesos',
      ubicacion: 'Palacio de Congresos — Av. Entre Ríos 100, CABA',
      specs: {
        create: [
          { clave: 'Modalidad', valor: 'Online + Presencial' },
          { clave: 'Comisión casa', valor: '15%' },
          { clave: 'Categoría mínima', valor: 'Oro' },
        ],
      },
    },
  })

  await prisma.auction.create({
    data: {
      id: AUCTION_PROGRAMADA_ID,
      nombre: 'Subasta de Invierno 2026 — Colección General',
      descripcion: 'Subasta abierta para todas las categorías de clientes. Incluye joyería, relojes y mobiliario de época.',
      fechaInicio: in30days,
      categoria: 'comun',
      estado: 'programada',
      moneda: 'pesos',
      ubicacion: 'Sala Borghese — Palermo, CABA',
    },
  })

  await prisma.auction.create({
    data: {
      id: AUCTION_FINALIZADA_ID,
      nombre: 'Subasta Otoño 2026 — Joyas y Antigüedades',
      descripcion: 'Subasta finalizada. Resultados disponibles en el historial de participaciones.',
      fechaInicio: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      fechaFin: yesterday,
      categoria: 'comun',
      estado: 'finalizada',
      moneda: 'pesos',
    },
  })

  console.log(`   ✓ Activa      (${AUCTION_ACTIVA_ID})  → cierra en 48 h`)
  console.log(`   ✓ Programada  (${AUCTION_PROGRAMADA_ID})`)
  console.log(`   ✓ Finalizada  (${AUCTION_FINALIZADA_ID})  → cerrada ayer`)

  // ── 6. Ítems de la subasta activa ─────────────────────────────────────────
  console.log('\n📦 Creando ítems...')

  await prisma.item.create({
    data: {
      id: ITEM_001_ID,
      numeroPieza: 'P-001',
      descripcion: 'Reloj de bolsillo Longines — Acero dorado, circa 1920',
      precioBase: 15000,
      duenUserId: ALICE_ID,
      subastaId: AUCTION_ACTIVA_ID,
      estado: 'en_subasta',
      images: {
        create: [
          { url: 'https://dcdn-us.mitiendanube.com/stores/004/734/252/products/rolex-black-diseno-7a04e72be4b88cd0a317241731322646-1024-1024.webp', orden: 0 },
        ],
      },
    },
  })

  await prisma.item.create({
    data: {
      id: ITEM_002_ID,
      numeroPieza: 'P-002',
      descripcion: 'Bodegón con flores — Óleo sobre tela (1958)',
      precioBase: 80000,
      duenUserId: ALICE_ID,
      subastaId: AUCTION_ACTIVA_ID,
      estado: 'en_subasta',
      esObraArte: true,
      artistaDisenador: 'Raquel Forner',
      fechaCreacionObra: new Date('1958-01-01'),
      historia: 'Obra adquirida en Christie\'s Buenos Aires, 2001. Certificado de autenticidad incluido.',
      images: {
        create: [
          { url: 'https://http2.mlstatic.com/D_NQ_NP_830058-MLA82770497234_032025-O.webp', orden: 0 },
          { url: 'https://www.pompeiimuseumshop.it/cdn/shop/files/APOLLO.jpg?v=1777995211&width=2000', orden: 1 },
        ],
      },
    },
  })

  await prisma.item.create({
    data: {
      id: ITEM_003_ID,
      numeroPieza: 'P-003',
      descripcion: 'Escultura de bronce "Equilibrio" — Edición limitada 3/25',
      precioBase: 45000,
      duenUserId: BOB_ID,
      subastaId: AUCTION_ACTIVA_ID,
      estado: 'pendiente',
      esObraArte: true,
      artistaDisenador: 'Julio Le Parc',
      images: {
        create: [
          { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1_6nAQH-nT8tS-2-CY0AL1sNkxY2dwfsM_A&s', orden: 0 },
          { url: 'https://mla-s1-p.mlstatic.com/659080-MLA31019343156_062019-F.jpg', orden: 1 },
        ],
      },
    },
  })

  // ítems de la subasta finalizada
  await prisma.item.create({
    data: {
      id: ITEM_004_ID,
      numeroPieza: 'P-004',
      descripcion: 'Collar de perlas naturales con broche en oro blanco 18k',
      precioBase: 85000,
      duenUserId: BOB_ID,
      subastaId: AUCTION_FINALIZADA_ID,
      estado: 'vendido',
      images: {
        create: [
          { url: 'https://picsum.photos/seed/collar1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/collar2/640/480', orden: 1 },
        ],
      },
    },
  })

  await prisma.item.create({
    data: {
      id: ITEM_005_ID,
      numeroPieza: 'P-005',
      descripcion: 'Armónica Hohner Marine Band — Circa 1940, en estuche original',
      precioBase: 18000,
      duenUserId: BOB_ID,
      subastaId: AUCTION_FINALIZADA_ID,
      estado: 'vendido',
      images: {
        create: [
          { url: 'https://picsum.photos/seed/armonica1/640/480', orden: 0 },
        ],
      },
    },
  })

  console.log('   ✓ P-001 en_subasta  (reloj, activa)')
  console.log('   ✓ P-002 en_subasta  (óleo, activa)')
  console.log('   ✓ P-003 pendiente   (escultura, activa)')
  console.log('   ✓ P-004 vendido     (collar, finalizada → alice)')
  console.log('   ✓ P-005 vendido     (armónica, finalizada → charlie + multa)')

  // ── 7. Pujas ─────────────────────────────────────────────────────────────
  console.log('\n🏷️  Creando pujas...')

  // P-001: Bob pujó 16.000 (superada) → Alice pujó 18.150 (actual ganadora)
  await prisma.bid.create({
    data: {
      id: BID_BOB_001_ID,
      subastaId: AUCTION_ACTIVA_ID,
      itemId: ITEM_001_ID,
      userId: BOB_ID,
      paymentMethodId: PM_BOB_ID,
      monto: 16000,
      estado: 'superada',
      ganador: false,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  })

  await prisma.bid.create({
    data: {
      id: BID_ALICE_001_ID,
      subastaId: AUCTION_ACTIVA_ID,
      itemId: ITEM_001_ID,
      userId: ALICE_ID,
      paymentMethodId: PM_ALICE_ID,
      monto: 18150,
      estado: 'confirmada',
      ganador: false, // todavía no termina la subasta
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
  })

  // P-004: Alice ganó en la subasta finalizada
  await prisma.bid.create({
    data: {
      id: BID_ALICE_004_ID,
      subastaId: AUCTION_FINALIZADA_ID,
      itemId: ITEM_004_ID,
      userId: ALICE_ID,
      paymentMethodId: PM_ALICE_ID,
      monto: 102000,
      estado: 'confirmada',
      ganador: true,
      createdAt: new Date(now.getTime() - 50 * 60 * 60 * 1000),
    },
  })

  // P-005: Charlie ganó pero no pagó → multa
  await prisma.bid.create({
    data: {
      id: BID_CHARLIE_005_ID,
      subastaId: AUCTION_FINALIZADA_ID,
      itemId: ITEM_005_ID,
      userId: CHARLIE_ID,
      paymentMethodId: PM_CHARLIE_ID,
      monto: 22000,
      estado: 'confirmada',
      ganador: true,
      createdAt: new Date(now.getTime() - 49 * 60 * 60 * 1000),
    },
  })

  console.log('   ✓ Bob puja P-001 → $16.000 (superada)')
  console.log('   ✓ Alice puja P-001 → $18.150 (actual ganadora)')
  console.log('   ✓ Alice gana P-004 → $102.000')
  console.log('   ✓ Charlie gana P-005 → $22.000')

  // ── 8. Compras ────────────────────────────────────────────────────────────
  console.log('\n🛒 Creando compras...')

  // Alice pagó su compra
  await prisma.purchase.create({
    data: {
      id: PURCHASE_ALICE_ID,
      itemId: ITEM_004_ID,
      subastaId: AUCTION_FINALIZADA_ID,
      compradorUserId: ALICE_ID,
      bidId: BID_ALICE_004_ID,
      paymentMethodId: PM_ALICE_ID,
      montoFinal: 102000,
      comision: 15300,   // 15%
      costoEnvio: 2500,
      retiroPersonal: false,
      estadoPago: 'pagado',
    },
  })

  // Charlie no pagó → generará multa
  await prisma.purchase.create({
    data: {
      id: PURCHASE_CHARLIE_ID,
      itemId: ITEM_005_ID,
      subastaId: AUCTION_FINALIZADA_ID,
      compradorUserId: CHARLIE_ID,
      bidId: BID_CHARLIE_005_ID,
      paymentMethodId: PM_CHARLIE_ID,
      montoFinal: 22000,
      comision: 3300,    // 15%
      costoEnvio: 0,
      retiroPersonal: true,
      estadoPago: 'vencido',
    },
  })

  console.log('   ✓ Purchase alice/P-004  → $102.000 [pagado]')
  console.log('   ✓ Purchase charlie/P-005 → $22.000 [vencido]')

  // ── 9. Multa de Charlie ───────────────────────────────────────────────────
  console.log('\n⚠️  Creando multa de Charlie...')

  const fechaLimiteMulta = new Date(now.getTime() - 24 * 60 * 60 * 1000) // ya vencida
  await prisma.penalty.create({
    data: {
      id: PENALTY_CHARLIE_ID,
      userId: CHARLIE_ID,
      purchaseId: PURCHASE_CHARLIE_ID,
      monto: 2200, // 10% de 22.000
      estado: 'pendiente',
      fechaLimite: fechaLimiteMulta,
    },
  })

  console.log('   ✓ Multa charlie → $2.200 [pendiente, vencida]')

  // ── 10. Depósito ──────────────────────────────────────────────────────────
  console.log('\n🏛️  Creando depósito...')

  await prisma.deposit.create({
    data: {
      id: DEPOSIT_ID,
      nombre: 'Depósito Central Aucty',
      direccion: 'Av. del Libertador 7500, Piso 2',
      ciudad: 'Buenos Aires',
      pais: 'Argentina',
      numeroPaisId: 54,
    },
  })

  console.log('   ✓ Depósito Central Aucty (Av. del Libertador 7500)')

  // ── 11. Póliza de seguro ──────────────────────────────────────────────────
  console.log('\n🛡️  Creando póliza de seguro...')

  await prisma.insurancePolicy.create({
    data: {
      id: INSURANCE_ID,
      numeroPoliza: 'POL-2026-00441',
      compania: 'La Meridional Compañía Argentina de Seguros',
      telefonoCompania: '0800-333-3333',
      emailCompania: 'siniestros@meridional.com.ar',
      beneficiarioUserId: ALICE_ID,
      valorAsegurado: 320000,
      fechaInicio: new Date('2026-01-01'),
      fechaVencimiento: new Date('2026-12-31'),
    },
  })

  console.log('   ✓ POL-2026-00441 → La Meridional ($320.000)')

  // ── 12. Consignaciones ────────────────────────────────────────────────────
  console.log('\n📋 Creando consignaciones...')

  // Estado 1: en_evaluacion (Bob envió su armario colonial)
  await prisma.consignment.create({
    data: {
      id: CON_EVALUACION_ID,
      userId: BOB_ID,
      descripcion: 'Armario colonial tallado en cedro — finales siglo XIX',
      categoria: 'especial',
      valorEstimado: 95000,
      esCompuesto: false,
      esObraArte: false,
      historia: 'Perteneciente a familia de la zona norte de Córdoba. Talla original en perfecto estado.',
      estado: 'en_evaluacion',
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
      photos: {
        create: [
          { url: 'https://picsum.photos/seed/armario1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/armario2/640/480', orden: 1 },
          { url: 'https://picsum.photos/seed/armario3/640/480', orden: 2 },
          { url: 'https://picsum.photos/seed/armario4/640/480', orden: 3 },
          { url: 'https://picsum.photos/seed/armario5/640/480', orden: 4 },
          { url: 'https://picsum.photos/seed/armario6/640/480', orden: 5 },
        ],
      },
      specs: {
        create: [
          { clave: 'Material', valor: 'Cedro tallado' },
          { clave: 'Dimensiones', valor: '210 × 90 × 60 cm' },
          { clave: 'Origen', valor: 'Córdoba, Argentina' },
          { clave: 'Período', valor: 'Finales siglo XIX' },
        ],
      },
    },
  })

  // Estado 2: aceptado, esperando respuesta de Alice
  await prisma.consignment.create({
    data: {
      id: CON_PEND_RESP_ID,
      userId: ALICE_ID,
      descripcion: 'Pareja de candelabros de plata Sterling — Imperio Ruso, 1890',
      categoria: 'platino',
      valorEstimado: 180000,
      esObraArte: false,
      historia: 'Adquiridos en subasta Sotheby\'s Londres, 2015. Incluye certificado de autenticidad y tasación.',
      estado: 'aceptado',
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
      photos: {
        create: [
          { url: 'https://picsum.photos/seed/plata1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/plata2/640/480', orden: 1 },
          { url: 'https://picsum.photos/seed/plata3/640/480', orden: 2 },
          { url: 'https://picsum.photos/seed/plata4/640/480', orden: 3 },
          { url: 'https://picsum.photos/seed/plata5/640/480', orden: 4 },
          { url: 'https://picsum.photos/seed/plata6/640/480', orden: 5 },
        ],
      },
      inspection: {
        create: {
          resultado: 'aceptado',
          valorBaseAsignado: 160000,
          comisionPorcentaje: 12,
          fechaSubastaEstimada: in30days,
          userAcepta: null,
        },
      },
    },
  })

  // Estado 3: aceptado + userAcepta true (jarrón de porcelana — ID existente)
  await prisma.consignment.create({
    data: {
      id: CON_ACEPTADO_ID,
      userId: ALICE_ID,
      descripcion: 'Jarrón de porcelana china — Dinastía Qing, circa 1780',
      categoria: 'oro',
      valorEstimado: 50000,
      esObraArte: true,
      historia: 'Adquirido en Christie\'s Londres, 1998. Procedencia documentada.',
      estado: 'aceptado',
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
      photos: {
        create: [
          { url: 'https://picsum.photos/seed/jarron1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/jarron2/640/480', orden: 1 },
          { url: 'https://picsum.photos/seed/jarron3/640/480', orden: 2 },
          { url: 'https://picsum.photos/seed/jarron4/640/480', orden: 3 },
          { url: 'https://picsum.photos/seed/jarron5/640/480', orden: 4 },
          { url: 'https://picsum.photos/seed/jarron6/640/480', orden: 5 },
        ],
      },
      inspection: {
        create: {
          resultado: 'aceptado',
          valorBaseAsignado: 45000,
          comisionPorcentaje: 15,
          userAcepta: true,
          respondidoEn: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Estado 4: rechazado (Bob → muñeca de porcelana con daño estructural)
  await prisma.consignment.create({
    data: {
      id: CON_RECHAZADO_ID,
      userId: BOB_ID,
      descripcion: 'Muñeca de porcelana Jumeau — Francia, 1885',
      categoria: 'especial',
      valorEstimado: 12000,
      estado: 'rechazado',
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
      photos: {
        create: [
          { url: 'https://picsum.photos/seed/muneca1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/muneca2/640/480', orden: 1 },
          { url: 'https://picsum.photos/seed/muneca3/640/480', orden: 2 },
          { url: 'https://picsum.photos/seed/muneca4/640/480', orden: 3 },
          { url: 'https://picsum.photos/seed/muneca5/640/480', orden: 4 },
          { url: 'https://picsum.photos/seed/muneca6/640/480', orden: 5 },
        ],
      },
      inspection: {
        create: {
          resultado: 'rechazado',
          motivoRechazo: 'La pieza presenta fractura visible en la base del cuello y pérdida de pintura original en el 40% del rostro. No cumple los estándares mínimos para subasta.',
          costoDevolucion: 3500,
          userAcepta: null,
        },
      },
    },
  })

  // Estado 5: en_deposito — con póliza de seguro y cuenta de cobro
  await prisma.consignment.create({
    data: {
      id: CON_DEPOSITO_ID,
      userId: ALICE_ID,
      descripcion: 'Tapiz flamenco — "Caza Real", lana y seda, circa 1720',
      categoria: 'platino',
      valorEstimado: 320000,
      esObraArte: true,
      historia: 'Proveniente de colección privada belga. Presentado en la Exposición Europea de Arte Textil de 2019.',
      estado: 'en_deposito',
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
      photos: {
        create: [
          { url: 'https://picsum.photos/seed/tapiz1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/tapiz2/640/480', orden: 1 },
          { url: 'https://picsum.photos/seed/tapiz3/640/480', orden: 2 },
          { url: 'https://picsum.photos/seed/tapiz4/640/480', orden: 3 },
          { url: 'https://picsum.photos/seed/tapiz5/640/480', orden: 4 },
          { url: 'https://picsum.photos/seed/tapiz6/640/480', orden: 5 },
        ],
      },
      specs: {
        create: [
          { clave: 'Dimensiones',  valor: '380 × 265 cm' },
          { clave: 'Materiales',   valor: 'Lana, seda e hilo de oro' },
          { clave: 'Procedencia',  valor: 'Bruselas, Bélgica' },
          { clave: 'Estado',       valor: 'Excelente, restaurado 2018' },
        ],
      },
      inspection: {
        create: {
          resultado: 'aceptado',
          valorBaseAsignado: 290000,
          comisionPorcentaje: 12,
          userAcepta: true,
          respondidoEn: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      },
      location: {
        create: {
          depositId: DEPOSIT_ID,
          sector: 'Sector B — Textiles y Arte Decorativo',
          fechaIngreso: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      },
      payoutAccounts: {
        create: {
          userId: ALICE_ID,
          banco: 'Banco Galicia',
          numeroCuenta: '4080000000000000012',
          titular: 'Alice García',
          moneda: 'ARS',
          numeroPaisId: 54,
        },
      },
    },
  })

  // Vincular póliza de seguro a la consignación en depósito
  await prisma.insurancePolicyConsignment.create({
    data: {
      policyId: INSURANCE_ID,
      consignmentId: CON_DEPOSITO_ID,
    },
  })

  // Estado 6: subastado — vinculado al ítem P-002 (óleo) en la subasta activa
  await prisma.consignment.create({
    data: {
      id: CON_SUBASTADO_ID,
      userId: ALICE_ID,
      descripcion: 'Bodegón con flores — Óleo sobre tela (1958)',
      categoria: 'oro',
      valorEstimado: 90000,
      esObraArte: true,
      artistaDisenador: 'Raquel Forner',
      fechaCreacionObra: new Date('1958-01-01'),
      estado: 'subastado',
      declaraTitularidad: true,
      declaraOrigenLicito: true,
      aceptaDevolucionConCargo: true,
      photos: {
        create: [
          { url: 'https://picsum.photos/seed/oleo1/640/480', orden: 0 },
          { url: 'https://picsum.photos/seed/oleo2/640/480', orden: 1 },
          { url: 'https://picsum.photos/seed/oleo3/640/480', orden: 2 },
          { url: 'https://picsum.photos/seed/oleo4/640/480', orden: 3 },
          { url: 'https://picsum.photos/seed/oleo5/640/480', orden: 4 },
          { url: 'https://picsum.photos/seed/oleo6/640/480', orden: 5 },
        ],
      },
      inspection: {
        create: {
          resultado: 'aceptado',
          valorBaseAsignado: 80000,
          comisionPorcentaje: 15,
          userAcepta: true,
          respondidoEn: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        },
      },
      consignmentItems: {
        create: { itemId: ITEM_002_ID },
      },
    },
  })

  console.log('   ✓ en_evaluacion → Bob / armario colonial')
  console.log('   ✓ aceptado (pendiente resp.) → Alice / candelabros')
  console.log('   ✓ aceptado (aceptó) → Alice / jarrón Qing')
  console.log('   ✓ rechazado → Bob / muñeca Jumeau')
  console.log('   ✓ en_deposito → Alice / tapiz flamenco  [seguro + cuenta]')
  console.log('   ✓ subastado → Alice / óleo Forner  [vinculado a P-002]')

  // ── Resumen final ─────────────────────────────────────────────────────────
  console.log('\n✅ Seed completado.\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 CREDENCIALES')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  alice@auction.test   / alice1234!   → oro, aprobado`)
  console.log(`  bob@auction.test     / bob12345!    → comun, aprobado`)
  console.log(`  diana@auction.test   / diana123!    → platino, aprobado`)
  console.log(`  charlie@auction.test / charlie123!  → comun, MULTADO`)
  console.log(`  eva@auction.test     / eva12345!    → pendiente_verificacion`)
  console.log('\n📋 IDs FIJOS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n  USUARIOS`)
  console.log(`    alice    ${ALICE_ID}`)
  console.log(`    bob      ${BOB_ID}`)
  console.log(`    diana    ${DIANA_ID}`)
  console.log(`    charlie  ${CHARLIE_ID}`)
  console.log(`\n  SUBASTAS`)
  console.log(`    activa      ${AUCTION_ACTIVA_ID}  → cierra en 48 h`)
  console.log(`    programada  ${AUCTION_PROGRAMADA_ID}`)
  console.log(`    finalizada  ${AUCTION_FINALIZADA_ID}`)
  console.log(`\n  ÍTEMS`)
  console.log(`    P-001 en_subasta  ${ITEM_001_ID}  → alice lidera $18.150`)
  console.log(`    P-002 en_subasta  ${ITEM_002_ID}  → óleo Forner`)
  console.log(`    P-003 pendiente   ${ITEM_003_ID}`)
  console.log(`    P-004 vendido     ${ITEM_004_ID}  → alice pagó`)
  console.log(`    P-005 vendido     ${ITEM_005_ID}  → charlie no pagó`)
  console.log(`\n  COMPRAS`)
  console.log(`    alice   ${PURCHASE_ALICE_ID}`)
  console.log(`    charlie ${PURCHASE_CHARLIE_ID}`)
  console.log(`\n  CONSIGNACIONES`)
  console.log(`    en_evaluacion   ${CON_EVALUACION_ID}`)
  console.log(`    pend. respuesta ${CON_PEND_RESP_ID}`)
  console.log(`    aceptada        ${CON_ACEPTADO_ID}`)
  console.log(`    rechazada       ${CON_RECHAZADO_ID}`)
  console.log(`    en_deposito     ${CON_DEPOSITO_ID}   [seguro + cuenta]`)
  console.log(`    subastada       ${CON_SUBASTADO_ID}  [P-002]`)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
