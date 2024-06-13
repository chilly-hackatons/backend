import { Hono } from 'hono'
import { prisma } from '..'
import { transformStringsToObjects } from '../helpers'

export const post = new Hono()

post.get('/comments', async (c) => {
  const retPostWithComms = await prisma.post.findMany({
    include: {
      comments: true,
    },
  })
  return c.json(retPostWithComms)
})

post.get('/search', async (c) => {
  const searchQuery = c.req.query('searchQuery')

  if (!searchQuery) {
    return c.json(400)
  }

  try {
    const post = await prisma.post.findMany({
      where: {
        title: {
          search: searchQuery,
        },
        content: {
          search: searchQuery,
        },
      },
    })

    return c.json(post)
  } catch (error) {
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

//return post
post.get('/:id', async (c) => {
  const postId = c.req.param('id')
  
  try {
    const getPost = await prisma.post.findUniqueOrThrow({
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

  return c.json({...getPost, tags: transformStringsToObjects(getPost.tags)})
  } catch (error) {
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

//add post
post.post('/', async (c) => {
  const { userId, title, content, tags } = await c.req.json()
  const post = await prisma.post.create({
    data: {
      title,
      content,
      tags,
      user: {
        connect: {
          id: userId,
        },
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  const retunData = getAllPosts.map((post) => {
    return {
      ...post,
      tags: transformStringsToObjects(post.tags),
    }
  })

  return c.json(retunData)
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
         has: `${tagQuery[0].toUpperCase()}${tagQuery.slice(1)}`,
       }
     }
    })

    return c.json(posts)
  } catch (error) {
    return c.json(400)
  }
})
