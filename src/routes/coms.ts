import { Hono } from "hono";
import { prisma } from "..";


export const comms = new Hono()

comms.post('/', async (c) => {
    const {content, userId, postId} = await c.req.json()
    const comment = await prisma.comment.create({
       data: {
        content,
        user:{
            connect:{
                id:userId
            }
        },
        post:{
            connect:{
                id:postId
            }
        }

       }
    })
    return c.json(comment)
})











// comms.put('/:id', async (c) =>{
//     const id = parseInt(c.req.param('id'))
//     const { content } = await c.req.json()
//     const comment = await prisma.comment.update({
//       where: { id },
//       data: { content },
//     })
//     return c.json(comment)
//   })


