import { Hono } from 'hono'
import { prisma } from '..'
import { jwtAuth } from '../middlewares'

export const vacancy = new Hono()

vacancy.use(jwtAuth())

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

vacancy.get('/statistics/:id', async (c) => {
  const id = c.req.param('id')

  const vacancies = await prisma.vacancy.findMany({
    where: {
      recruiterId: Number(id),
    },
    include: {
      applications: true,
    },
  })

  return c.json(vacancies)
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

  const userId = c.req.query('userId')

  try {
    const vacancy = await prisma.vacancy.findUniqueOrThrow({
      where: {
        id: Number(id),
      },
      include: {
        applications: {
          include: {
            applicant: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    const usersRespondedLists = vacancy.applications.map((application) => {
      return application.applicant.userId
    })

    const isRespondedToVacancy = usersRespondedLists.includes(Number(userId))

    const { applications, ...vacancyData } = vacancy


    return c.json({
      ...vacancyData,
      isRespondedToVacancy,
    })
  } catch (error) {
    return c.json(404)
  }
})
vacancy.patch('/vacancy-respond', async (c) => {
  const { applicantId, vacancyId } = await c.req.json()

  const applicantExists = await prisma.applicant.findUnique({
    where: { userId: Number(applicantId) },
  })

  if (!applicantExists) {
    return c.json({ message: 'Applicant not found' }, 404)
  }

  const existingApplication = await prisma.application.findFirst({
    where: {
      applicantId: Number(applicantExists.id),
      vacancyId: Number(vacancyId),
    },
  })

  if (existingApplication) {
    return c.json({ message: 'Application already exists' }, 409)
  }

  const application = await prisma.application.create({
    data: {
      applicant: {
        connect: {
          id: Number(applicantExists.id),
        },
      },
      vacancy: {
        connect: { id: Number(vacancyId) },
      },
    },
    include: {
      applicant: true,
      vacancy: true,
    },
  })

  const updatedVacancy = await prisma.vacancy.update({
    where: {
      id: Number(vacancyId),
    },
    data: {
      applications: {
        connect: {
          id: Number(application.id),
        },
      },
    },
  })

  return c.json(updatedVacancy)
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
