import { Hono } from 'hono'
import { prisma } from '..'
import { jwtAuth } from '../middlewares'
import { transformStringsToObjects } from '../helpers'

export const profile = new Hono()

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
