import { Hono } from 'hono'
import { prisma } from '..'

export const vacancy = new Hono()

vacancy.get('/', async (c) => {
  const allVacancies = await prisma.vacancy.findMany({
    orderBy: {
      createdAt: 'desc',
    },

    include: {
      recruiter: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  })

  const formattedVacancies = allVacancies.map((vacancy) => {
    const { recruiter, recruiterId, ...vacancyData } = vacancy
    return {
      ...vacancyData,
      user: {
        id: recruiter.user.id,
        firstName: recruiter.user.firstName,
        lastName: recruiter.user.lastName,
        avatar: recruiter.user.avatar,
        companyName: recruiter.companyName,
      },
    }
  })

  return c.json(formattedVacancies)
})

vacancy.get('/search', async (c) => {
  const searchQuery = c.req.query('searchQuery')

  const result = await prisma.vacancy.findMany({
    where: {
      title: {
        search: searchQuery,
      },
      description: {
        search: searchQuery,
      },
    },
  })

  return c.json(result)
})

vacancy.post('/', async (c) => {
  const { recruiterId, title, description } = await c.req.json()

  try {
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
  } catch (error) {
    return c.json(404)
  }
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

  const vacancy = await prisma.vacancy.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
    },
  })

  return c.json(vacancy)
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
