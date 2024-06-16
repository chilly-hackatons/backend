import { Hono } from 'hono'
import { prisma } from '..'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

export const comments = new OpenAPIHono()

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
  const {
    userId: userIdComment,
    postId: postIdComment,
    ...commentWithoutUserId
  } = comment
  return c.json(commentWithoutUserId)
})

const commentRoute = createRoute({
  method: 'post',
  path: '/comment/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.any(),
            userId: z.number(),
            postId: z.number()
          }),
        },
      },
      description:"В блоке data указывается текст комментария, а также связь с пользователем и постом через их идентификаторы (userId и postId). Метод connect позволяет установить связь с уже существующими записями в базе данных.Также в запросе указано, что необходимо включить информацию о пользователе, который создал комментарий."
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.any(),
            userId: z.number(),
            postId: z.number()

          }),
        },
      },
      description: 'search candidates response',
    },
  },
  tags: ['comments'], // <- Add tag here
})

comments.openapi(commentRoute, (c) => {
  return c.json(
    {
    content: 'explain feratures',
    userId: 1,
    postId: 1
    },
    200
  )
})
