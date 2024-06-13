import { Hono } from 'hono'
import { jwtAuth } from '../middlewares'
import { prisma } from '..'
import { transformStringsToObjects } from '../helpers'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

export const candidates = new OpenAPIHono()

candidates.use(jwtAuth())

candidates.get('/search', async (c) => {
  const searchQuery = c.req.query('searchQuery') || ''

  try {
    const result = await prisma.user.findMany({
      where: {
        type: 'APPLICANT',

        applicant: {
          skills: {
            has: `${searchQuery[0].toUpperCase()}${searchQuery.slice(1)}`,
          },
        },
      },
      include: {
        applicant: true,
      },
    })

    const formattedCandidates = result.map((user) => {
      const { refreshToken, applicant, password, type, ...userData } = user
      return {
        ...userData,
        gitHubLink: applicant?.gitHubLink,
        skills: transformStringsToObjects(applicant?.skills),
      }
    })
    return c.json(formattedCandidates)
  } catch (error) {
    return c.json({ message: 'Something went wrong' }, 500)
  }
})

candidates.get('/', async (c) => {
  const result = await prisma.user.findMany({
    where: {
      type: 'APPLICANT',
    },
    include: {
      applicant: true,
    },
  })

  const formattedCandidates = result.map((user) => {
    const { refreshToken, applicant, password, type, ...userData } = user
    return {
      ...userData,
      gitHubLink: applicant?.gitHubLink,
      skills: transformStringsToObjects(applicant?.skills),
    }
  })
  return c.json(formattedCandidates)
})

candidates.get('/candidates-feedback/:vacancyId', async (c) => {
  const vacancyId = c.req.param('vacancyId')

  try {
    const result = await prisma.vacancy.findUniqueOrThrow({
      where: {
        id: Number(vacancyId),
      },
      include: {
        applications: {
          include: {
            applicant: {
              include: {
                user: true,
              }
            }
          }
        }
      }
    })

    const formattedCandidates = result.applications.map((application) => {
      const {password, type, refreshToken,  ...userData} = application.applicant.user
      const {id, skills, user, userId, ...applicationData} = application.applicant
      return {
        ...userData,
        ...applicationData,
        skills: transformStringsToObjects(application.applicant.skills),
      }
    })




    return c.json(formattedCandidates)
  } catch (error) {
    return c.json({ message: 'Something went wrong' }, 500)
  }
})

candidates.get('/candidates-feedback/:vacancyId', async (c) => {
  const vacancyId = c.req.param('vacancyId')

  try {
    const result = await prisma.vacancy.findUniqueOrThrow({
      where: {
        id: Number(vacancyId),
      },
      include: {
        applications: {
          include: {
            applicant: {
              include: {
                user: true,
              }
            }
          }
        }
      }
    })

    const formattedCandidates = result.applications.map((application) => {
      const {password, type, refreshToken,  ...userData} = application.applicant.user
      const {id, skills, user, userId, ...applicationData} = application.applicant
      return {
        ...userData,
        ...applicationData,
        skills: transformStringsToObjects(application.applicant.skills),
      }
    })




    return c.json(formattedCandidates)
  } catch (error) {
    return c.json({ message: 'Something went wrong' }, 500)
  }
})


const searchRoute = createRoute({
  method: 'get',
  path: '/search/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            gitHubLink: z.string(),
            value: z.string(),
            label: z.string(),
            accessToken: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            id: z.number(),
            email: z.string(),
            password: z.string(),
            patronymic: z.string(),
            about: z.string(),
            avatar: z.string(),
            jobExperience: z.object({}).array(),
            type: z.string(),
            createdAt: z.string(),

          }),
        },
      },
      description: 'search candidates response',
    },
  },
  tags: ['candidates'], // <- Add tag here
})

candidates.openapi(searchRoute, (c) => {
  return c.json(
    {
      gitHubLink: 'https://github.com/uglynhumble',
      value:'3123123123',
      label: 'google',
      accessToken: 'sign-up success',
      firstName: 'vasya',
      lastName: 'hershtein',
      id: 1,
      email: 'vasyahershtein@gmail.com',
      password: 'qwerty123123',
      patronymic: 'alekseevich',
      about: 'backend developer',
      avatar: '',
      jobExperience: [{}],
      type: 'recrutieer',
      createdAt: new Date(),
    },
    200
  )
})

const applicantRoute = createRoute({
  method: 'get',
  path: '/applicant/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),
            userId: z.number(),
            resume: z.string(),
            projectsList: z.object({}).array(),
            skills: z.string({}),
            gitHubLink: z.string(),
            value: z.string(),
            label: z.string(),
            accessToken: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            id: z.number(),
            email: z.string(),
            password: z.string(),
            patronymic: z.string(),
            about: z.string(),
            avatar: z.string(),
            jobExperience: z.object({}).array(),
            type: z.string(),
            createdAt: z.string(),

          }),
        },
      },
      description: 'applicant response',
    },
  },
  tags: ['candidates'], // <- Add tag here
})

candidates.openapi(applicantRoute, (c) => {
  return c.json(
    {
      refreshToken: '12312312312312312312',
      userId: 2,
      resume: 'all gucci',
      projectsList: [{}],
      skills: '1231231231231',
      gitHubLink: 'https://github.com/uglynhumble',
      value:'3123123123',
      label: 'google',
      accessToken: 'sign-up success',
      firstName: 'vasya',
      lastName: 'hershtein',
      id: 1,
      email: 'vasyahershtein@gmail.com',
      password: 'qwerty123123',
      patronymic: 'alekseevich',
      about: 'backend developer',
      avatar: '',
      jobExperience: [{}],
      type: 'recrutieer',
      createdAt: new Date(),
    },
    200
  )
})