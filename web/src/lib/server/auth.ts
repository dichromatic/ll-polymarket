import { prisma } from './prisma';

export async function getOrCreateMockUser(id: string, username: string) {
  let user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    const isAdmin = id.startsWith('admin_');
    user = await prisma.user.create({
      data: {
        id,
        username,
        isAdmin
      }
    });
  }

  return user;
}
