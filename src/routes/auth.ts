import { Hono } from 'hono'
import { prisma } from '..'
import { HTTPException } from 'hono/http-exception'
import {
  generateAccessToken,
  generateRefreshToken,
  transformStringsToObjects,
} from '../helpers'
import { verify } from 'hono/jwt'
import { getCookie, setCookie } from 'hono/cookie'
import { Applicant, Recruiter, User } from '@prisma/client'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
const bcrypt = require('bcrypt')

export const auth = new OpenAPIHono()

interface UserWithRelations extends User {
  recruiter?: Recruiter | null
  applicant?: Applicant | null
}

enum UserType {
  APPLICANT = 'APPLICANT',
  RECRUITER = 'RECRUITER',
}

// log-in
auth.post('/sign-in', async (c) => {
  const { email, password } = await c.req.json()

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
      include: {
        applicant: true,
        recruiter: true,
      },
    })

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new HTTPException(401, { message: 'Incorrect data' })
    }

    const accessToken = await generateAccessToken(user.id)
    const refreshToken = await generateRefreshToken(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    setCookie(c, 'Refresh-Token', refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      expires: expires,
      sameSite: 'None',
    })

    const {
      refreshToken: _refreshToken,
      recruiter,
      applicant,
      password: _password,
      ...userData
    } = user

    const userDataReturn = {
      ...userData,
      ...(recruiter && { companyName: recruiter.companyName }),
      ...(applicant && {
        gitHubLink: applicant.gitHubLink,
        skills: transformStringsToObjects(applicant.skills),
      }),
    }

    return c.json({ accessToken, user: userDataReturn })
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
    let user: UserWithRelations
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
        include: {
          recruiter: true,
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
        include: {
          applicant: true,
        },
      })
    } else {
      return c.json({ message: 'Invalid user type' }, 400)
    }

    const refreshToken = await generateRefreshToken(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    const accessToken = await generateAccessToken(user.id)

    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    setCookie(c, 'Refresh-Token', refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      expires: expires,
      sameSite: 'None',
    })

    const {
      refreshToken: _refreshToken,
      recruiter,
      applicant,
      ...userData_
    } = user

    const userDataReturn = {
      ...userData_,
      ...(recruiter && { companyName: recruiter.companyName }),
      ...(applicant && {
        gitHubLink: applicant.gitHubLink,
        skills: transformStringsToObjects(applicant.skills),
      }),
    }

    return c.json({ accessToken, user: userDataReturn }, 201)
  } catch (error) {
    return c.json(
      {
        message: 'User already exists',
      },
      409
    )
  }
})

auth.post('/refresh', async (c) => {
  const refresh_token = getCookie(c, 'Refresh-Token')

  if (!refresh_token) {
    throw new HTTPException(401, { message: 'Refresh token is required' })
  }

  try {
    const decoded = await verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET as string
    )

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) },
      include: {
        applicant: true,
        recruiter: true,
      },
    })

    if (!user || user.refreshToken !== refresh_token) {
      return c.json({ error: 'Refresh token is invalid' }, 401)
    }

    const accessToken = await generateAccessToken(user.id)
    const newRefreshToken = await generateRefreshToken(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    })

    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    setCookie(c, 'Refresh-Token', newRefreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      expires: expires,
      sameSite: 'None',
    })

    const {
      refreshToken: _refreshToken,
      password,
      recruiter,
      applicant,
      ...userData
    } = user

    const userDataReturn = {
      ...userData,
      ...(recruiter && { companyName: recruiter.companyName }),
      ...(applicant && {
        gitHubLink: applicant.gitHubLink,
        skills: transformStringsToObjects(applicant.skills),
      }),
    }
    return c.json({ accessToken, user: userDataReturn })
  } catch (err) {
    return c.json({ error: 'Refresh token is invalid' }, 401)
  }
})

auth.post('/logout', async (c) => {
  const { refresh_token } = await c.req.json()

  try {
    const decoded = await verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET as string
    )

    await prisma.user.update({
      where: { id: Number(decoded.sub) },
      data: { refreshToken: null },
    })

    return c.json({ message: 'Logout successful' }, 200)
  } catch (err) {
    return c.json({ message: 'Invalid token' })
  }
})
//sign-up route
const signupRoute = createRoute({
  method: 'post',
  path: '/sign-up/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string(),
            lastName: z.string(),
            patronymic: z.string(),
            email: z.string(),
            password: z.string(),
            about: z.string(),
            type: z.string(),
          }),
        },
      },
      description:"userData-основная информация о пользователе. Далее исходя из флага,определяем к какому типу относиться пользователь(рекрутер или аппликант).После создания пользователя создается рефреш токен и токен доступа.Далее из объекта пользователя удаляются лишние данные и отправляются клиенту с кодом 201"
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
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
      description: 'sign-up response',
    },
  },
  tags: ['auth'], // <- Add tag here
})
auth.openapi(signupRoute, (c) => {
  return c.json(
    {
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
//sign-in route
const signinRoute = createRoute({
  method: 'post',
  path: '/sign-in/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string(),
            password: z.string(),
          }),
        },
      },
      description:"из тела запроса забираем email & password.Попытка найти пользователя в базе данных(В запрос включены связанные данные applicant и recruiter, чтобы получить полные данные о пользователе).Далее выполняется проверка пароля, если он не верен выбрасываем ошибку(401).После успешной проверки пароля генерируются токен доступа (access token) и токен обновления (refresh token). Токен обновления сохраняется в базе данных для соответствующего пользователя.Из объекта пользователя удаляются лишние данные (refreshToken и password), формируется объект для ответа с данными пользователя, включая данные рекрутера или соискателя, если они есть. "
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string(),
            password: z.string(),

          }),
        },
      },
      description: 'sign-in response',
    },
  },
  tags: ['auth'], // <- Add tag here
})

auth.openapi(signinRoute, (c) => {
  return c.json(
    {
      email: 'vasyahershtein@gmail.com',
      password: 'qwerty123123',
    },
    200
  )
})
//refresh token route
const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),
           
          }),
        },
      },
      description:"Из куки извлекается токен обновления. Если токен отсутствует, выбрасывается ошибка с кодом 401.Токен обновления проверяется и декодируется.Если проверка не удалась, выбрасывается исключение.Пользователь ищется в базе данных по ID, который содержится в декодированном токене обновления.Если пользователь не найден или токен обновления не совпадает с тем, который хранится в базе данных, возвращается ошибка 401.После успешной проверки генерируются новые токены доступа и обновления.Из объекта пользователя удаляются лишние данные (refreshToken и password), формируется объект для ответа с данными пользователя, включая данные рекрутера или соискателя, если они есть."
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),

          }),
        },
      },
      description: 'refresh token response',
    },
  },
  tags: ['auth'], // <- Add tag here
})

auth.openapi(refreshRoute, (c) => {
  return c.json(
    {
      refreshToken: '6a7396ffab113854a558e0f9b36232',
    },
    200
  )
})
//logout route
const logoutRoute = createRoute({
  method: 'post',
  path: '/logout/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),
           
          }),
        },
      },
      description:"Из тела запроса извлекается refresh_token.Токен обновления проверяется и декодируется,если проверка не удалась, выбрасывается исключение.После успешной проверки и декодирования токена, в базе данных находится пользователь по ID (из декодированного токена) и обновляется его запись, устанавливая значение refreshToken в null.Если все прошло успешно, клиенту возвращается сообщение о успешном выходе с кодом 200. Если возникает ошибка, возвращается сообщение об ошибке с кодом 401"
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),

          }),
        },
      },
      description: 'refresh token response',
    },
  },
  tags: ['auth'], // <- Add tag here
})

auth.openapi(logoutRoute, (c) => {
  return c.json(
    {
      refreshToken: '6a7396ffab113854a558e0f9b36232',
    },
    200
  )
})