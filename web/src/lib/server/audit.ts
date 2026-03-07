import { PrismaClient, AdminActionType, type Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Creates an immutable audit log entry.
 * 
 * @param action The type of administrative action taken
 * @param entityId The ID of the affected Market, Event, or User
 * @param actorId The ID of the User who performed the action
 * @param details Flexible JSON object containing state snapshots
 * @param tx Optional interactive transaction client for atomic writes
 */
export async function createAuditLog(
    action: AdminActionType,
    entityId: string,
    actorId: string,
    details?: Prisma.InputJsonValue,
    tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
) {
    const dbClient = tx || prisma;

    return await dbClient.auditLog.create({
        data: {
            action,
            entityId,
            actorId,
            details: details ?? {}
        }
    });
}
