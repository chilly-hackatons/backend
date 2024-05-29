require('dotenv').config()

import { HTTPException } from 'hono/http-exception'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { post } from './routes/post'
import { auth } from './middlewares'
import { sign } from 'hono/jwt'
const bcrypt = require('bcrypt')

const users = [{ name: 'username', password: '11111' }]
const app = new Hono()
app.use(etag(), logger(), auth())

app.get('/', (c) => {
  return c.json({
    message: `Hello!`,
  })
})
//registration
app.post('/register', async (c) => {
  const { user, pass } = await c.req.json()
  const hashPassword = await bcrypt.hash(pass, 10)
  const newUser = { name: user, password: hashPassword }
  users.push(newUser)

  return c.json({ username: 'privet' })
})

app.get('/users', async (c) => {
  return c.json(users)
})

app.post('/login', async (c) => {
  const { user, pass } = await c.req.json()
  const findedUser = users.find((u) => u.name === user)
  if (!findedUser) {
    throw new HTTPException(401, { message: 'not allowed' })
  }
  console.log(pass, user.password)
  const isPasswordValid = await bcrypt.compare(pass, findedUser.password)
  if (!isPasswordValid) {
    throw new HTTPException(401, { message: 'inccorect password' })
  }
  const payload = {
    sub: user,
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
