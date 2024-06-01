import { Hono } from 'hono'
import { prisma } from '..'

export const vacancy = new Hono()

vacancy.get('/', async (c) => {
  const getAllVacs = await prisma.vacancy.findMany()

  return c.json(getAllVacs)
})

vacancy.post('/', async (c) => {
  const { recruiterId, title, description } = await c.req.json()
  const vacancy = await prisma.vacancy.create({
    data: {
      title,
      description,
      recruiter: {
        connect: {
          id: Number(recruiterId),
        },
      },
    },
  })

  return c.json(vacancy)
})

vacancy.delete('/:id', async (c) => {
  const vacId = c.req.param('id')
  try {
    const vacansy = await prisma.vacancy.delete({
      where: {
        id: Number(vacId),
      },
    })
    return c.json(vacansy)
  } catch (error) {
    return c.json(404)
  }
})

vacancy.get('/:id', async (c) => {
  const id = c.req.param('id')
  const getVac = await prisma.vacancy.findUnique({
    where: {
      id: Number(id),
    },
  })

  return c.json(getVac)
})

vacancy.put('/:id', async (c) => {
  const updatedVacId = c.req.param('id')
  const { title, descript, recruiterId } = await c.req.json()
  try {
    const updatedVac = await prisma.vacancy.update({
      where: { id: Number(updatedVacId) },
      data: {
        title: title,
        description: descript,
        recruiter: {
          connect: {
            id: recruiterId,
          },
        },
      },
    })
    return c.json(updatedVac)
  } catch (error) {
    return c.json(404)
  }
})
