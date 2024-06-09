import { Hono } from 'hono'
import { prisma } from '..'

export const search = new Hono()

//search string
search.get('/', async (c) => {
    const query = c.req.query('q');
    console.log(query)
    if (!query) {
      return c.json(400);
    }
  
    try {
      const post = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          tags: true,
          user: true,
        },
      });
  
      return c.json(post);
    } catch (error) {
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });