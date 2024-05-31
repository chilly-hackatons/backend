import { Hono } from "hono";
import { prisma } from "..";

export const post = new Hono()



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


post.delete(`/:id`, async (c) => {
  const postId  = c.req.param('id')
  const post = await prisma.post.delete({
    where: {
      id: Number(postId),
    },
  })
  return c.json(post)
})


post.put('/:id', async (c) => {
  const updatedPostId = c.req.param('id')
  const{title, content} = await c.req.json()
  try {
    const updatedPost = await prisma.post.update({
      where:{ id:Number(updatedPostId)},
      data:{
        title:title,
        content:content
      },
    });
    return c.json(updatedPost)
  }catch(error){
    return c.json(404)
  }
})

post.get('/', async (c)=> {
  const getAllPosts = await prisma.post.findMany()

  return c.json(getAllPosts)
})

