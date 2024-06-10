import { Hono } from 'hono'
import { jwtAuth } from '../middlewares'
import { prisma } from '..'
import { transformStringsToObjects } from '../helpers'

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
