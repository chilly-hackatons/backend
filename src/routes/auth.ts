import { Hono } from 'hono'
import { prisma } from '..'
import { HTTPException } from 'hono/http-exception'
const bcrypt = require('bcrypt')

export const auth = new Hono()

enum UserType {
  APPLICANT = 'APPLICANT',
  RECRUITER = 'RECRUITER',
}

auth.get('/', (c) => c.text('List Users'))

auth.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.text('Get Post: ' + id)
})

// log-in
auth.post('/sign-in', async (c) => {
  const { email, password } = await c.req.json()

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
    })

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordValid) {
      throw new HTTPException(401, { message: 'Incorrect data' })
    }

    return c.json(user, 200)

  } catch (error) {
    return c.json(
      {
        message: 'Login failed',
      },
      401
    )
  }
})

// register
auth.post('/sign-up', async (c) => {
  const requestData = await c.req.json()

  const hashPassword = await bcrypt.hash(requestData.password, 10)

  const userData = {
    firstName: requestData.first_name,
    lastName: requestData.last_name,
    patronymic: requestData.patronymic,
    email: requestData.email,
    password: hashPassword,
    type: requestData.user_type,
    about: requestData.about,
    jobExperience: [],
  }

  try {
    let user

    if (requestData.user_type === UserType.RECRUITER) {
      user = await prisma.user.create({
        data: {
          ...userData,
          recruiter: {
            create: {
              companyName: requestData.company_name || '',
            },
          },
        },
      })
    } else if (requestData.user_type === UserType.APPLICANT) {
      user = await prisma.user.create({
        data: {
          ...userData,
          applicant: {
            create: {
              gitHubLink: requestData.github || '',
              skills: requestData.technologies || [],
            },
          },
        },
      })
    } else {
      return c.json({ message: 'Invalid user type' }, 400)
    }

    return c.json(user, 201)
  } catch (error) {
    return c.json(
      {
        message: 'User already exists',
      },
      409
    )
  }
})
