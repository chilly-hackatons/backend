require('dotenv').config()
import { PrismaClient } from '@prisma/client'

import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { post } from './routes/post'
import { apiAuth, jwtAuth } from './middlewares'
import { auth } from './routes/auth'

import { comments } from './routes/comments'
import { vacancy } from './routes/vacancy'

import { cors } from 'hono/cors'
import { profile } from './routes/profile'
import { serve } from '@hono/node-server'
import { candidates } from './routes/candidates'

export const prisma = new PrismaClient()

export const app = new Hono()

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173', 'hackaton-404.ru', 'https://frontend-drab-one-85.vercel.app'],
    maxAge: 600,
    credentials: true,
  }),
  etag(),
  logger(),
  apiAuth(),
)


app.get('/', (c) => c.text('Hello World!'))

app.get('/users', jwtAuth(), async (c) => {
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
      applicant: true,
      recruiter: true,
    },
  })
  return c.json(allUsers)
})

app.get('/user/:id', jwtAuth(), async (c) => {
  const id = c.req.param('id')
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: Number(id),
      },
      include: {
        applicant: true,
        recruiter: true,
      },
    })

    const { password, ...userWithOutPassword } = user

    return c.json(userWithOutPassword)
  } catch (error) {
    return c.json({ message: 'User not found' }, 404)
  }
})

app.route('/vacancy', vacancy)

app.route('/comments', comments)

app.route('/post', post)

app.route('/auth', auth)

app.route('/profile', profile)

app.route('/candidates', candidates)

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
