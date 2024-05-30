import { Hono } from "hono";

export const post = new Hono()


post.get('/', (c) => c.text('List Users')) 

post.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.text('Get Post: ' + id)

})
// log-in
post.post('/sign-in', (c) => c.text('Create User')) 

// register
post.post('/sign-up', (c) => c.text('Create User')) 
