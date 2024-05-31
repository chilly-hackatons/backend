import { Hono } from "hono";
import { prisma } from "..";

export const post = new Hono()


post.get('/', (c) => c.text('List Posts')) 

post.get('/:id', async (c) => {
  const id = c.req.param('id')
  const getPost = await prisma.post.findUnique({
    where:{
      id:Number(id)
    }
  }) 

  return c.json(getPost)

})
post.post('/', async (c) => {
  const{userId, title, content} = await c.req.json();
  const post = await prisma.post.create({
    data: {
      title,
      content,
      user: {
        connect: {
          id: userId
        }
      }
    }
  })
  
  return c.json(post)
}) 
