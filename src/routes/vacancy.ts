import { Hono } from 'hono'
import { prisma } from '..'
import { jwtAuth } from '../middlewares'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

export const vacancy = new OpenAPIHono()

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

  try {
    const recruiter = await prisma.recruiter.findUniqueOrThrow({
      where: {
        userId: Number(id),
      },
    })

    const vacancies = await prisma.vacancy.findMany({
      where: {
        recruiterId: Number(recruiter.id),
      },
      include: {
        applications: true,
      },
    })

    return c.json(vacancies)
  } catch (error) {
    return c.json({ message: 'Something went wrong' }, 500)
  }
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
  console.log(recruiterId)
  try {
    const recruiter = await prisma.recruiter.findUniqueOrThrow({
      where: {
        userId: Number(recruiterId),
      },
    })

    const vacancy = await prisma.vacancy.create({
      data: {
        title,
        description,

        recruiter: {
          connect: {
            id: Number(recruiter.id),
          },
        },
      },
    })

    return c.json(vacancy)
  } catch (error) {
    console.log(error)
    return c.json({ message: 'Vacancy already exists' }, 409)
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


const allVacancyRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            firstName: z.string(),
            lastName: z.string(),
            avatar: z.string(),
            companyName: z.string(),
            createdAt: z.string(),
            title: z.string(),
            description: z.string()
            
          }),
        },
      },
      description: 'фрагмент кода для получения всех доступных вакансий.',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(allVacancyRoute, (c) => {
  return c.json(
    {
      id: 1,
      firstName: 'nikita',
      lastName: 'vasyankin',
      avatar:'12322331232132.jpg',
      companyName: 'google',
      createdAt: new Date(),
      title: 'chotko',
      description:'devops engenier backend developer'
    },
    200
  )
})

const searchVacancyRoute = createRoute({
  method: 'get',
  path: '/search/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            recrutierId: z.number(),
            createdAt: z.string(),
            title: z.string(),
            description: z.string()
            
          }),
        },
      },
      description: 'фрагмент кода для поиска конкретных ваканский.',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(searchVacancyRoute, (c) => {
  return c.json(
    {
      id: 1,
      recrutierId:2,
      createdAt: new Date(),
      title: 'chotko',
      description:'devops engenier backend developer'
    },
    200
  )
})

const vacancyStatsRoute = createRoute({
  method: 'get',
  path: '/statistics/:id/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            applicantId: z.number(),
            vacancyId: z.number(),
            status: z.string(),
            recrutierId: z.number(),
            createdAt: z.string(),
            title: z.string(),
            description: z.string()
            
          }),
        },
      },
      description: 'фрагмент кода для получения всех доступных вакансий.',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(vacancyStatsRoute, (c) => {
  return c.json(
    {
      id: 1,
      applicantId:2,
      vacancyId: 2,
      status: 'avilible',
      recrutierId:2,
      createdAt: new Date(),
      title: 'chotko',
      description:'devops engenier backend developer'
    },
    200
  )
})

const addVacancyRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            recrutierId: z.number(),
            tilte: z.string(),
            description: z.string(),
            createdAt: z.string(),
            id: z.number()

          }),
        },
      },
      description:"в фрагменте кода описывается добавление новых вакансий для аппликантов. На вход принимаются данные рекрутера, а на выход те же данные и описание вакансии."
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            recrutierId: z.number(),
            title: z.string(),
            description: z.string(),
            createdAt: z.string(),
            id: z.number()
          }),
        },
      },
      description: 'search candidates response',
    },
  },
  tags: ['vacancy'], 
})

vacancy.openapi(addVacancyRoute, (c) => {
  return c.json(
    {
    recrutierId: 1,
    title:'backend',
    description:'devops backend',
    createdAt: new Date(),
    id: 1
    },
    200
  )
})

const deleteVacancyRoute = createRoute({
  method: 'delete',
  path: '/:id/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            recrutierId: z.number(),
            tilte: z.string(),
            description: z.string(),
            createdAt: z.string(),
            id: z.number()

          }),
        },
      },
      description: 'фрагмент кода описывает удаление вакансии по уникальному идентефикатору.',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(deleteVacancyRoute, (c) => {
  return c.json(
    {
    recrutierId: 1,
    tilte:'23123123',
    description:'devops backend',
    createdAt: new Date(),
    id: 1
    },
    200
  )
})

const vacancyByIdRoute = createRoute({
  method: 'get',
  path: '/:id/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            recrutierId: z.number(),
            tilte: z.string(),
            description: z.string(),
            createdAt: z.string(),
            id: z.number(),
            status: z.string(),
          }),
        },
      },
      description: 'фрагмент кода для возврата определенной вакансии(по уникальному идентефикатору).',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(vacancyByIdRoute, (c) => {
  return c.json(
    {
    recrutierId: 1,
    tilte:'23123123',
    description:'devops backend',
    createdAt: new Date(),
    id: 1,
    status: 'avilible'
    },
    200
  )
})

const vacancyRespondRoute = createRoute({
  method: 'patch',
  path: '/vacancy-respond',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            applicantId: z.number(),
            vacancyId: z.number(),
            recrutierId: z.number(),
            tilte: z.string(),
            description: z.string(),
            createdAt: z.string(),
            id: z.number()
          }),
        },
      },
      description: 'фрагмент кода описывает отклик аппликанта на вакансию, на вход принимаются id вакансии и id соискателя.',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(vacancyRespondRoute, (c) => {
  return c.json(
    {
      applicantId:1,
      recrutierId: 1,
      tilte:'23123123',
      description:'devops backend',
      createdAt: new Date(),
      id: 1,
      vacancyId: 1
    },
    200
  )
})

const updateVacancyRoute = createRoute({
  method: 'patch',
  path: '/:id',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            recrutierId: z.number(),
            tilte: z.string(),
            description: z.string(),
            createdAt: z.string(),
            id: z.number()
          }),
        },
      },
      description: 'фрагмент кода описывает обновление вакансии.',
    },
  },
  tags: ['vacancy'],
})

vacancy.openapi(updateVacancyRoute, (c) => {
  return c.json(
    {
      recrutierId: 1,
      tilte:'23123123',
      description:'devops backend',
      createdAt: new Date(),
      id: 1
    },
    200
  )
})