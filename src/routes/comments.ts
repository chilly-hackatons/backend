import { Hono } from 'hono'
import { prisma } from '..'

export const comments = new Hono()

comments.post('/', async (c) => {
  const { content, userId, postId } = await c.req.json()
  const comment = await prisma.comment.create({
    data: {
      content,
      user: {
        connect: {
          id: userId,
        },
      },
      post: {
        connect: {
          id: postId,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  })
  const { userId : userIdComment, postId : postIdComment, ...commentWithoutUserId } = comment
  return c.json(commentWithoutUserId)
})
