import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const offices = [
  {
    id: '100',
    name: 'Presidencia',
    abrev: 'PRESIDENCIA',
  },
  {
    id: '101',
    name: 'Vicepresidencia',
    abrev: 'VICEPRESENCIA',
  },
  {
    id: '102',
    name: 'Oficina de Auditoría Interna',
    abrev: 'OAI',
  },
  {
    id: '103',
    name: 'Oficina de Consultoría Jurídica',
    abrev: 'OCJ',
  },
  {
    id: '104',
    name: 'Oficina de Planificación, Presupuesto y Organización',
    abrev: 'OPPO',
  },
  {
    id: '105',
    name: 'Oficina de Gestión Humana',
    abrev: 'OGH',
  },
  {
    id: '106',
    name: 'Gerencia General de Proyectos de Desarrollo Minero',
    abrev: 'GGPDM',
  },
  {
    id: '107',
    name: 'Oficina de Seguridad Integral',
    abrev: 'OSI',
  },
  {
    id: '108',
    name: 'Oficina de Atención al Ciudadano',
    abrev: 'OAC',
  },
  {
    id: '109',
    name: 'Oficina de Administración y Finanzas',
    abrev: 'OAF',
  },
  {
    id: '110',
    name: 'Oficina de Seguimiento y Control',
    abrev: 'OSC',
  },
  {
    id: '111',
    name: 'Oficina de Gestión Comunicacional',
    abrev: 'OGC',
  },
  {
    id: '112',
    name: 'Oficina de Tecnología de la Información',
    abrev: 'OTI',
  },
  {
    id: '113',
    name: 'Gerencia General de Sistematización del Catastro Minero',
    abrev: 'GSMC',
  },
  {
    id: '114',
    name: 'Gerencia General de Gestión Ecosocialista',
    abrev: 'GGE',
  },
  {
    id: '115',
    name: 'Gerencia General de Producción e Industrialización Minera',
    abrev: 'GGPIM',
  },
  {
    id: '116',
    name: 'Gerencia General de Comercialización',
    abrev: 'GGC',
  },
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
