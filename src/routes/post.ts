import { Hono } from 'hono'
import { prisma } from '..'

export const post = new Hono()

post.get('/comments', async (c) => {
  const retPostWithComms = await prisma.post.findMany({
    include: {
      comments: true,
    },
  })
  return c.json(retPostWithComms)
})

//return post
post.get('/:id', async (c) => {
  const postId = c.req.param('id')
  const getPost = await prisma.post.findUnique({
    where: {
      id: Number(postId),
    },
    include: {
      comments: {
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
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  return c.json(getPost)
})

//add post
post.post('/', async (c) => {
  const { userId, title, content, tags } = await c.req.json()
  const post = await prisma.post.create({
    data: {
      title,
      content,
      tags: {
        connectOrCreate: tags.map((tag: any) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
      user: {
        connect: {
          id: userId,
        },
        // include:{
        //   tags:true
        // }
      },
    },
  })

  return c.json(post)
})

//delete post
post.delete(`/:id`, async (c) => {
  const postId = c.req.param('id')
  const post = await prisma.post.delete({
    where: {
      id: Number(postId),
    },
  })
  return c.json(post)
})

//change post
post.put('/:id', async (c) => {
  const updatedPostId = c.req.param('id')
  const { title, content } = await c.req.json()
  try {
    const updatedPost = await prisma.post.update({
      where: { id: Number(updatedPostId) },
      data: {
        title: title,
        content: content,
      },
    })
    return c.json(updatedPost)
  } catch (error) {
    return c.json(404)
  }
})
//return all posts
post.get('/', async (c) => {
  const getAllPosts = await prisma.post.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: {
      tags: true,
    },
  })

  return c.json(getAllPosts)
})

//posts by tags
post.get('/posts', async (c) => {
  const tagQuery = c.req.query('tag')
  if (!tagQuery) {
    return c.json({ error: 'Invalid tag parameter' }, 400)
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        tags: {
          some: {
            name: {
              in: tagQuery.split(','),
            },
          },
        },
      },
      include: {
        tags: true,
      },
    })

    return c.json(posts)
  } catch (error) {
    return c.json(400)
  }
})
