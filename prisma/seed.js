import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const offices = [
  { id: '100', abrev: 'PRESIDENCIA', name: 'Presidencia' },
  { id: '101', abrev: 'VICEPRESIDENCIA', name: 'Vicepresidencia' },
  { id: '102', abrev: 'OAI', name: 'Oficina de Auditoría Interna' },
  { id: '103', abrev: 'OCJ', name: 'Oficina de Consultoría Jurídica' },
  {
    id: '104',
    abrev: 'OPPO',
    name: 'Oficina de Planificación, Presupuesto y Organización',
  },
  { id: '105', abrev: 'OGH', name: 'Oficina de Gestión Humana' },
  {
    id: '106',
    abrev: 'GGPDM',
    name: 'Gerencia General de Proyectos de Desarrollo Minero',
  },
  { id: '107', abrev: 'OSI', name: 'Oficina de Seguridad Integral' },
  { id: '108', abrev: 'OAC', name: 'Oficina de Atención al Ciudadano' },
  { id: '109', abrev: 'OAF', name: 'Oficina de Administración y Finanzas' },
  { id: '110', abrev: 'OSC', name: 'Oficina de Seguimiento y Control' },
  { id: '111', abrev: 'OGC', name: 'Oficina de Gestión Comunicacional' },
  { id: '112', abrev: 'OTI', name: 'Oficina de Tecnología de la Información' },
  {
    id: '113',
    abrev: 'GSMC',
    name: 'Gerencia General de Sistematización del Catastro Minero',
  },
  {
    id: '114',
    abrev: 'GGE',
    name: 'Gerencia General de Gestión Ecosocialista',
  },
  {
    id: '115',
    abrev: 'GGPIM',
    name: 'Gerencia General de Producción e Industrialización Minera',
  },
  { id: '116', abrev: 'GGC', name: 'Gerencia General de Comercialización' },
];

async function main() {
  console.log('Start seeding ...');

  try {
    // Clear existing offices
    await prisma.office.deleteMany();
    console.log('Cleared existing offices');

    // Insert offices
    const createdOffices = await prisma.office.createMany({
      data: offices,
    });

    console.log(`Created ${createdOffices.count} offices`);
    console.log('Seeding finished.');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
