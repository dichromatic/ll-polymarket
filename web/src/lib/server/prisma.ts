import { PrismaClient } from '@prisma/client';

// Best practice: Reuse the Prisma client across HMR reloads in Vite dev mode
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
