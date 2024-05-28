import { Hono } from "hono";

export const post = new Hono()


post.get('/', (c) => c.text('List Posts')) 

post.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.text('Get Post: ' + id)

})
post.post('/', (c) => c.text('Create Post')) 
