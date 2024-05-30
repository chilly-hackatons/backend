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

// const body = await c.req.json()
//   const payload ={
//     username:body.username,
//     exp:Math.floor(Date.now() / 1000) + 60 * 5
//   }
//   const secret = 'mySecretKey'
//   const token = await sign(payload, secret)

//   //secretkey return
//   return c.json({username:body.username, token})


// app.post('/login', async (c) => {
//   const { username, password } = await c.req.json()

//   const findedUser = users.find((u) => u.name === username)
//   if (!findedUser) {
//     throw new HTTPException(401, { message: 'not allowed' })
//   }
//   const isPasswordValid = await bcrypt.compare(password, findedUser.password)
//   if (!isPasswordValid) {
//     throw new HTTPException(401, { message: 'Incorrect data' })
//   }
//   const payload = {
//     sub: username,
//     exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
//   }
//   const secret = 'mySecretKey'
//   const token = await sign(payload, secret)
//   return c.json({ token })
// })