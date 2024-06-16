import { Hono } from 'hono'
import { prisma } from '..'
import { jwtAuth } from '../middlewares'
import { transformStringsToObjects } from '../helpers';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'


export const profile = new OpenAPIHono()

profile.patch('/:id', jwtAuth(), async (c) => {
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
    skills,
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

    const { password, refreshToken, recruiter, ...userWithOutPassword } =
      updatedUser

    const userDataReturn = {
      ...userWithOutPassword,
      companyName: updatedUser.recruiter!.companyName,
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

    const { password, refreshToken, applicant, ...userWithOutPassword } =
      updatedUser

    const userDataReturn = {
      ...userWithOutPassword,
      gitHubLink: updatedUser.applicant!.gitHubLink,
      skills: transformStringsToObjects(updatedUser.applicant!.skills),
    }

    return c.json(userDataReturn, 200)
  } else {
    return c.json({ message: 'Invalid user type' }, 400)
  }
})

profile.patch('/job-add/:id', jwtAuth(), async (c) => {
  const jobData = await c.req.json()

  const id = c.req.param('id')

  try {
    const updatedJob = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        jobExperience: {
          push: jobData,
        },
      },
      include: {
        applicant: true,
        recruiter: true,
      },
    })

    const {
      password,
      refreshToken,
      recruiter,
      applicant,
      ...userWithOutPassword
    } = updatedJob

    const userDataReturn = {
      ...userWithOutPassword,
      ...(recruiter && { companyName: recruiter.companyName }),
      ...(applicant && {
        gitHubLink: applicant.gitHubLink,
        skills: transformStringsToObjects(applicant.skills),
      }),
    }

    return c.json(userDataReturn, 200)
  } catch (error) {
    return c.json({ message: 'User not found' }, 404)
  }
})

profile.patch('/job-delete/:id', jwtAuth(), async (c) => {
  const id = c.req.param('id')

  const { companyTitle } = await c.req.json()

  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      jobExperience: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Удаляем объект с заданным jobTitle из jobExperience
  const updatedJobExperience = user.jobExperience.filter(
    (job: any) => job.companyTitle !== companyTitle
  )

  // Обновляем поле jobExperience в базе данных
  const updatedUser = await prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      jobExperience: updatedJobExperience.map((job) =>
        JSON.parse(JSON.stringify(job))
      ),
    },
    include: {
      applicant: true,
      recruiter: true,
    },
  })

  const {
    password,
    refreshToken,
    recruiter,
    applicant,
    ...userWithOutPassword
  } = updatedUser

  const userDataReturn = {
    ...userWithOutPassword,
    ...(recruiter && { companyName: recruiter.companyName }),
    ...(applicant && {
      gitHubLink: applicant.gitHubLink,
      skills: transformStringsToObjects(applicant.skills),
    }),
  }

  return c.json(userDataReturn)
})


const profileRoute = createRoute({
  method: 'patch',
  path: '/:id/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            companyName: z.string(),
            type: z.string(),
            email: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            patronimyc: z.string(),
            avatar: z.string(),
            jobExperience: z.object({}).array(),
            userId: z.number(),
            createdAt: z.string(),
            about: z.string(),
            skills: z.object({}).array(),
            id: z.number(),
            gitHubLink: z.string()
          }),
        },
      },
      description: 'этот фрагмент кода позволяет обновлять профиль пользователя в зависимости от его типа(аппликант или рекрутёр).',
    },
  },
  tags: ['profile'],
})

profile.openapi(profileRoute, (c) => {
  return c.json(
    {
      companyName: 'google',
      type: 'recrutier',
      email:'plat1324@mail.ru',
      firstName: 'platon',
      lastName: 'lukichev',
      patronimyc:'aleksandrovich',
      avatar:'231231231231.jpg',
      jobExperience:[{}],
      userId:1,
      createdAt: new Date(),
      about:'devops backend',
      skills: [{}],
      id: 1,
      gitHubLink: 'github/uglynhumble.com'
    },
    200
  )
})


const updateJobExperianceRoute = createRoute({
  method: 'patch',
  path: '/job-add/:id/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            companyName: z.string(),
            type: z.string(),
            email: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            patronimyc: z.string(),
            avatar: z.string(),
            jobExperience: z.object({}).array(),
            userId: z.number(),
            createdAt: z.string(),
            about: z.string(),
            skills: z.object({}).array(),
            id: z.number(),
            gitHubLink: z.string()
          }),
        },
      },
      description: 'этот фрагмент кода добавляет новый опыт работы для пользователя, обновляет его профиль и возвращает обновленные данные, исключая чувствительную информацию. В случае ошибки (например, если пользователь не найден), возвращается сообщение об ошибке..',
    },
  },
  tags: ['profile'],
})

profile.openapi(updateJobExperianceRoute, (c) => {
  return c.json(
    {
      companyName: 'google',
      type: 'recrutier',
      email:'plat1324@mail.ru',
      firstName: 'platon',
      lastName: 'lukichev',
      patronimyc:'aleksandrovich',
      avatar:'231231231231.jpg',
      jobExperience:[{}],
      userId:1,
      createdAt: new Date(),
      about:'devops backend',
      skills: [{}],
      id: 1,
      gitHubLink: 'github/uglynhumble.com'
    },
    200
  )
})

const deleteJobExperianceRoute = createRoute({
  method: 'patch',
  path: '/job-delete/:id/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            companyName: z.string(),
            type: z.string(),
            email: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            patronimyc: z.string(),
            avatar: z.string(),
            jobExperience: z.object({}).array(),
            userId: z.number(),
            createdAt: z.string(),
            about: z.string(),
            skills: z.object({}).array(),
            id: z.number(),
            gitHubLink: z.string()
          }),
        },
      },
      description: 'этот фрагмент кода удаляет работы для пользователя, обновляет его профиль и возвращает обновленные данные, исключая чувствительную информацию. В случае ошибки (например, если пользователь не найден), возвращается сообщение об ошибке..',
    },
  },
  tags: ['profile'],
})

profile.openapi(deleteJobExperianceRoute, (c) => {
  return c.json(
    {
      companyName: 'google',
      type: 'recrutier',
      email:'plat1324@mail.ru',
      firstName: 'platon',
      lastName: 'lukichev',
      patronimyc:'aleksandrovich',
      avatar:'231231231231.jpg',
      jobExperience:[{}],
      userId:1,
      createdAt: new Date(),
      about:'devops backend',
      skills: [{}],
      id: 1,
      gitHubLink: 'github/uglynhumble.com'
    },
    200
  )
})