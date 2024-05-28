import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { post } from './routes/post'

const app = new Hono()
app.use(etag(), logger())


app.get('/', (c) => {
  return c.json({
    message: `Hello!`,
  })
})


app.route('/post', post)



const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
