require('dotenv').config()
import { PrismaClient } from '@prisma/client'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { post } from './routes/post'
import { apiAuth, jwtAuth } from './middlewares'
import { auth } from './routes/auth'

import { comments } from './routes/comments'
import { vacancy } from './routes/vacancy'

import { cors } from 'hono/cors'

export const prisma = new PrismaClient()

const app = new Hono()

app.use(
  cors({
    origin: 'http://localhost:5173',
    maxAge: 600,
    credentials: true,
  }),
  etag(),
  logger(),
  apiAuth()
)

app.patch('/profile/:id', jwtAuth(), async (c) => {
  const id = c.req.param('id')

  const {
    about,
    email,
    firstName,
    lastName,
    patronymic,

    companyName,

    userType,
    
    gitHubLink,
    skills
  } = await c.req.json()

  if (userType === 'RECRUITER') {
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        about,
        firstName,
        lastName,
        patronymic,
        email,
        recruiter: {
          update: {
            companyName,
          },
        },
      },
      include: {
        recruiter: true,
      },
    })


    const {password, refreshToken, recruiter, ...userWithOutPassword} = updatedUser

      const userDataReturn = {
      ...userWithOutPassword,
       companyName: updatedUser.recruiter!.companyName
    }


    return c.json(userDataReturn, 200)
  } else if (userType === 'APPLICANT') {
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        about,
        firstName,
        lastName,
        patronymic,
        email,
        applicant: {
          update: {
            gitHubLink,
            skills,
          },
        },
      },
      include: {
        applicant: true,
      },
    })
    
    
    const {password, refreshToken, applicant, ...userWithOutPassword} = updatedUser

      const userDataReturn = {
      ...userWithOutPassword,
       gitHubLink: updatedUser.applicant!.gitHubLink,
       skills: updatedUser.applicant!.skills
    }


    return c.json(userDataReturn, 200)
  } else {
    return c.json({ message: 'Invalid user type' }, 400)
  }
})

app.patch('/job/:id', jwtAuth(), async (c) => {
  const jobData  = await c.req.json()

  const id = c.req.param('id')

  try {
    const updatedJob = await prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      jobExperience: {
        push: jobData,
      }
    },
    include: {
      applicant: true,
      recruiter: true,
    },
  })

  const { password, refreshToken, recruiter, applicant, ...userWithOutPassword } = updatedJob


   const userDataReturn = {
      ...userWithOutPassword,
      ...(recruiter && { companyName: recruiter.companyName }),
      ...(applicant && { gitHubLink: applicant.gitHubLink, skills: applicant.skills }),
    }

  return c.json(userDataReturn, 200)
  } catch (error) {
    return c.json({ message: 'User not found' }, 404)
  }
})

app.get('/users', jwtAuth(), async (c) => {
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
      applicant: true,
      recruiter: true,
    },
  })
  return c.json(allUsers)
})

app.get('/user/:id', jwtAuth(), async (c) => {
  const id = c.req.param('id')
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: Number(id),
      },
      include: {
        applicant: true,
        recruiter: true,
      },
    })

    const { password, ...userWithOutPassword } = user

    return c.json(userWithOutPassword)
  } catch (error) {
    return c.json({ message: 'User not found' }, 404)
  }
})

app.route('/vacancy', vacancy)

app.route('/comments', comments)

app.route('/post', post)

app.route('/auth', auth)

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
