import { Hono } from 'hono'
import { jwtAuth } from '../middlewares'
import { prisma } from '..'
import { transformStringsToObjects } from '../helpers'
import { ApplicationStatus } from '@prisma/client'
import { vacancy } from './vacancy'

export const candidates = new Hono()

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
  const filterBy = c.req.query('filterBy') as ApplicationStatus | 'ALL'

  const vacancyId = c.req.param('vacancyId')

  const isFilteredByAll = filterBy === 'ALL'

  let result

  try {
    if (isFilteredByAll) {
      result = await prisma.vacancy.findUniqueOrThrow({
        where: {
          id: Number(vacancyId),
        },
        include: {
          applications: {
            include: {
              applicant: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      })
    } else {
      result = await prisma.vacancy.findUniqueOrThrow({
        where: {
          id: Number(vacancyId),
        },
        include: {
          applications: {
            where: {
              status: filterBy,
            },
            include: {
              applicant: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      })
    }

    const formattedCandidates = result.applications.map((application) => {
      const { password, type, refreshToken, ...userData } =
        application.applicant.user
      const { id, skills, user, userId, ...applicationData } =
        application.applicant
      return {
        ...userData,
        ...applicationData,
        skills: transformStringsToObjects(application.applicant.skills),
        status: application.status,
      }
    })

    return c.json(formattedCandidates)
  } catch (error) {
    console.log(error)
    return c.json({ message: 'Something went wrong' }, 500)
  }
})

candidates.patch('/candidates-feedback/:vacancyId', async (c) => {
  const vacancyId = c.req.param('vacancyId')

  const { status, userId } = await c.req.json()

  try {
    const result = await prisma.user.update({
      where: {
        id: Number(userId),

        
      },
      include: {
        applicant: {
          include: {
            Application: true,
          }
        },
      },
      data: {
        applicant: {
          update: {
            Application: {
              updateMany: {
                where: {
                  vacancyId: Number(vacancyId),
                },
                data: {
                  status,
                },
              }
            }
          }
        }
        
      },
    })
    return c.json(result)
  } catch (error) {
    console.log(error)
    return c.json({ message: 'Something went wrong' }, 500)
  }
})
