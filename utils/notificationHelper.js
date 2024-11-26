import prisma from '../db/prismaClient.js';

export const sendNotifications = async (
  users,
  message,
  forumId = null,
  memoId = null
) => {
  return Promise.all(
    users.map((user) =>
      prisma.notification.create({
        data: {
          user_id: user.id,
          forum_id: forumId,
          memo_id: memoId,
          message: message,
          read: false,
          deleted: false,
        },
      })
    )
  );
};

export const getSpecialUsers = async () => {
  return await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { office_id: '100' }, // PRESIDENCIA
        { office_id: '101' }, // VICEPRESIDENCIA
        { office_id: '110' }, // SEGUIMIENTO Y CONTROL
      ],
    },
  });
};
