require('dotenv').config()
import { PrismaClient } from '@prisma/client';

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { post } from './routes/post'
import { apiAuth, jwtAuth } from './middlewares'
import { auth } from './routes/auth';


export const prisma = new PrismaClient();


const app = new Hono()

app.use(etag(), logger(), apiAuth())


app.get('/users',jwtAuth() , async (c) => {
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
      applicant: true,
      recruiter: true,
    },
  })
  return c.json(allUsers)
})

app.route('/post', post)
app.route('/auth', auth)

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})