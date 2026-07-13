import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function generateWOCode(n: number): string {
  return `OT-${String(n).padStart(6, '0')}`;
}

async function main() {
  console.log('🌱 Seeding ObraFlow demo data...\n');

  // ─── Organization ───────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'constructora-demo' },
    update: {},
    create: {
      name: 'Constructora Demo SA',
      slug: 'constructora-demo',
      plan: 'STARTER',
      timezone: 'America/Santiago',
      currency: 'CLP',
      isActive: true,
    },
  });
  console.log(`Organization: ${org.name} (${org.id})`);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const plannerHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { id: 'seed-user-admin-001' },
    update: {},
    create: {
      id: 'seed-user-admin-001',
      name: 'Admin Demo',
      email: 'admin@demo.com',
      passwordHash: adminHash,
      role: 'ORG_ADMIN',
      isActive: true,
      orgId: org.id,
    },
  });

  const planner = await prisma.user.upsert({
    where: { id: 'seed-user-planner-001' },
    update: {},
    create: {
      id: 'seed-user-planner-001',
      name: 'Carlos Planner',
      email: 'planner@demo.com',
      passwordHash: plannerHash,
      role: 'PLANNER',
      isActive: true,
      orgId: org.id,
    },
  });
  console.log(`Users: ${admin.name}, ${planner.name}`);

  // ─── Clients ─────────────────────────────────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { id: 'seed-client-001' },
    update: {},
    create: {
      id: 'seed-client-001',
      name: 'Minera Atacama',
      taxId: '76.123.456-7',
      email: 'contacto@minera-atacama.cl',
      phone: '+56222345678',
      address: 'Av. Minera 1000, Calama',
      notes: 'Cliente prioritario – operaciones 24/7',
      isActive: true,
      orgId: org.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'seed-client-002' },
    update: {},
    create: {
      id: 'seed-client-002',
      name: 'Inmobiliaria del Sur',
      taxId: '77.654.321-K',
      email: 'admin@inmsur.cl',
      phone: '+56233456789',
      address: 'Paseo Arauco 500, Concepción',
      isActive: true,
      orgId: org.id,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: 'seed-client-003' },
    update: {},
    create: {
      id: 'seed-client-003',
      name: 'Puerto Norte SA',
      taxId: '78.111.222-3',
      email: 'ops@puertonorte.cl',
      phone: '+56244567890',
      address: 'Molo Sur s/n, Iquique',
      isActive: true,
      orgId: org.id,
    },
  });
  console.log(`Clients: ${client1.name}, ${client2.name}, ${client3.name}`);

  // ─── Crews ───────────────────────────────────────────────────────────────────
  const crew1 = await prisma.crew.upsert({
    where: { id: 'seed-crew-001' },
    update: {},
    create: {
      id: 'seed-crew-001',
      name: 'Cuadrilla Alpha',
      code: 'CRW-001',
      type: 'OWN',
      status: 'AVAILABLE',
      leaderId: admin.id,
      orgId: org.id,
    },
  });

  const crew2 = await prisma.crew.upsert({
    where: { id: 'seed-crew-002' },
    update: {},
    create: {
      id: 'seed-crew-002',
      name: 'Subcontrato Eléctrico',
      code: 'CRW-002',
      type: 'SUBCONTRACTED',
      status: 'AVAILABLE',
      orgId: org.id,
    },
  });
  console.log(`Crews: ${crew1.name}, ${crew2.name}`);

  // ─── Workers ─────────────────────────────────────────────────────────────────
  const workers = [
    { id: 'seed-worker-001', name: 'Roberto Soto', rut: '12.345.678-9', role: 'Electricista', phone: '+56911111111', hourlyRate: 18000, crewId: crew1.id },
    { id: 'seed-worker-002', name: 'Patricia Vega', rut: '13.456.789-0', role: 'Técnica Eléctrica', phone: '+56922222222', hourlyRate: 16000, crewId: crew1.id },
    { id: 'seed-worker-003', name: 'Miguel Araya', rut: '14.567.890-1', role: 'Ayudante', phone: '+56933333333', hourlyRate: 10000, crewId: crew1.id },
    { id: 'seed-worker-004', name: 'Carmen López', rut: '15.678.901-2', role: 'Soldadora', phone: '+56944444444', hourlyRate: 20000, crewId: crew2.id },
    { id: 'seed-worker-005', name: 'Andrés Muñoz', rut: '16.789.012-3', role: 'Instrumentista', phone: '+56955555555', hourlyRate: 22000, crewId: crew2.id },
  ];

  for (const w of workers) {
    await prisma.worker.upsert({
      where: { id: w.id },
      update: { hourlyRate: w.hourlyRate },
      create: {
        id: w.id,
        name: w.name,
        rut: w.rut,
        role: w.role,
        phone: w.phone,
        hourlyRate: w.hourlyRate,
        status: 'ACTIVE',
        crewId: w.crewId,
        orgId: org.id,
      },
    });
  }
  console.log(`Workers: ${workers.length} workers seeded`);

  // ─── Materials ────────────────────────────────────────────────────────────────
  const materials = [
    { id: 'seed-mat-001', name: 'Cable eléctrico 2.5mm Cu', code: 'CAB-2.5-CU', unit: 'M', unitCost: 850, stockTotal: 500, stockMin: 100 },
    { id: 'seed-mat-002', name: 'Tubo conduit PVC 3/4"', code: 'TUB-PVC-34', unit: 'M', unitCost: 1200, stockTotal: 200, stockMin: 50 },
    { id: 'seed-mat-003', name: 'Interruptor termomagnético 16A', code: 'TERM-16A', unit: 'UN', unitCost: 8500, stockTotal: 30, stockMin: 10 },
    { id: 'seed-mat-004', name: 'Caja tablero metálico 30x40', code: 'TABL-30x40', unit: 'UN', unitCost: 15000, stockTotal: 8, stockMin: 3 },
    { id: 'seed-mat-005', name: 'Soldadura celulósica E6011 3/32"', code: 'SOL-E6011', unit: 'KG', unitCost: 4200, stockTotal: 25, stockMin: 5 },
    { id: 'seed-mat-006', name: 'Pintura anticorrosiva gris', code: 'PINT-ANTI-GR', unit: 'LT', unitCost: 6800, stockTotal: 15, stockMin: 4 },
    { id: 'seed-mat-007', name: 'Perno hexagonal M12x50', code: 'PER-M12-50', unit: 'UN', unitCost: 320, stockTotal: 200, stockMin: 50 },
    { id: 'seed-mat-008', name: 'Lubricante industrial SAE 30', code: 'LUB-SAE30', unit: 'LT', unitCost: 3500, stockTotal: 10, stockMin: 2 },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        name: m.name,
        code: m.code,
        unit: m.unit,
        unitCost: m.unitCost,
        stockTotal: m.stockTotal,
        stockMin: m.stockMin,
        orgId: org.id,
      },
    });
  }
  console.log(`Materials: ${materials.length} materials seeded`);

  // ─── Work Orders ─────────────────────────────────────────────────────────────
  const now = new Date();
  const d = (offsetDays: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offsetDays);
    return date;
  };

  const workOrders = [
    {
      id: 'seed-wo-001',
      code: generateWOCode(1),
      title: 'Revisión eléctrica anual instalaciones',
      description: 'Inspección y mantenimiento preventivo del sistema eléctrico.',
      status: 'PENDING',
      priority: 'MEDIUM',
      type: 'PREVENTIVE',
      clientId: client1.id,
      crewId: null,
      plannedStart: d(3),
      plannedEnd: d(4),
      estimatedHours: 8,
    },
    {
      id: 'seed-wo-002',
      code: generateWOCode(2),
      title: 'Instalación cámara frigorífica',
      description: 'Montaje e instalación completa de cámara frigorífica industrial.',
      status: 'ASSIGNED',
      priority: 'HIGH',
      type: 'INSTALLATION',
      clientId: client2.id,
      crewId: crew1.id,
      plannedStart: d(1),
      plannedEnd: d(2),
      estimatedHours: 16,
    },
    {
      id: 'seed-wo-003',
      code: generateWOCode(3),
      title: 'Reparación bomba de agua principal',
      description: 'Falla detectada en bomba principal sector norte.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      type: 'CORRECTIVE',
      clientId: client1.id,
      crewId: crew1.id,
      plannedStart: d(-1),
      plannedEnd: d(1),
      estimatedHours: 12,
    },
    {
      id: 'seed-wo-004',
      code: generateWOCode(4),
      title: 'Inspección estructural muelle',
      description: 'Inspección técnica estructural del muelle de carga.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      type: 'INSPECTION',
      clientId: client3.id,
      crewId: crew2.id,
      plannedStart: d(-10),
      plannedEnd: d(-8),
      estimatedHours: 24,
    },
    {
      id: 'seed-wo-005',
      code: generateWOCode(5),
      title: 'Instalación generador emergencia',
      description: 'Trabajo cancelado por cambio de proveedor por parte del cliente.',
      status: 'CANCELLED',
      priority: 'LOW',
      type: 'INSTALLATION',
      clientId: client2.id,
      crewId: null,
      plannedStart: d(-5),
      plannedEnd: d(-3),
      estimatedHours: 20,
    },
  ];

  for (const wo of workOrders) {
    const created = await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: {},
      create: {
        id: wo.id,
        code: wo.code,
        title: wo.title,
        description: wo.description,
        status: wo.status,
        priority: wo.priority,
        type: wo.type,
        clientId: wo.clientId,
        ...(wo.crewId && { crewId: wo.crewId }),
        plannedStart: wo.plannedStart,
        plannedEnd: wo.plannedEnd,
        estimatedHours: wo.estimatedHours,
        costTotal: 0,
        orgId: org.id,
        createdById: admin.id,
      },
    });

    // Create an initial status log entry
    await prisma.wOStatusLog.upsert({
      where: { id: `seed-wolog-${wo.id}` },
      update: {},
      create: {
        id: `seed-wolog-${wo.id}`,
        workOrderId: created.id,
        toStatus: wo.status,
        changedById: admin.id,
        changedAt: new Date(),
      },
    });
  }
  console.log(`Work Orders: ${workOrders.length} work orders created`);

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!\n');
  console.log('─────────────────────────────────────────────');
  console.log(`  Organization : ${org.name}`);
  console.log(`  Slug         : ${org.slug}`);
  console.log(`  Admin email  : admin@demo.com`);
  console.log(`  Admin pass   : Admin123!`);
  console.log(`  Planner email: planner@demo.com`);
  console.log(`  Clients      : 3`);
  console.log(`  Crews        : 2 (1 OWN + 1 SUBCONTRACTED)`);
  console.log(`  Workers      : ${workers.length}`);
  console.log(`  Materials    : ${materials.length}`);
  console.log(`  Work Orders  : ${workOrders.map(w => w.status).join(', ')}`);
  console.log('─────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
