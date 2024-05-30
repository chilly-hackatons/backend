require('dotenv').config()

import { HTTPException } from 'hono/http-exception'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { post } from './routes/post'
import { apiAuth } from './middlewares'
import { sign } from 'hono/jwt'
const bcrypt = require('bcrypt')

const users = [{ name: 'username', password: '11111' }]
const app = new Hono()
app.use(etag(), logger(), apiAuth())

app.get('/', (c) => {
  return c.json({
    message: `Hello!`,
  })
})
//registration
app.post('/register', async (c) => {
  const { username, password } = await c.req.json()
  const hashPassword = await bcrypt.hash(password, 10)
  const newUser = { name: username, password: hashPassword }
  users.push(newUser)

  return c.json({ username: 'privet' })
})

app.get('/users', async (c) => {
  return c.json(users)
})

app.post('/login', async (c) => {
  const { username, password } = await c.req.json()

  const findedUser = users.find((u) => u.name === username)
  if (!findedUser) {
    throw new HTTPException(401, { message: 'not allowed' })
  }
  const isPasswordValid = await bcrypt.compare(password, findedUser.password)
  if (!isPasswordValid) {
    throw new HTTPException(401, { message: 'Incorrect data' })
  }
  const payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
  }
  const secret = 'mySecretKey'
  const token = await sign(payload, secret)
  return c.json({ token })
})

app.route('/post', post)

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
