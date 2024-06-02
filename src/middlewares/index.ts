import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'

export const apiAuth = () => {
  return createMiddleware(async (c, next) => {
    const accessToken = c.req.header('Secret-Access-Token')
    console.log(accessToken === process.env.BASE_SECRET_TOKEN)
    if (accessToken !== process.env.BASE_SECRET_TOKEN)
      throw new HTTPException(401, { message: 'Do not have access token' })
    await next()
  })
}

export const jwtAuth = () => {
  return createMiddleware(async (c, next) => {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!accessToken)
      throw new HTTPException(401, { message: 'Do not have access token' })

    try {
      await verify(accessToken, process.env.JWT_SECRET as string)
      await next()
    } catch (err) {
      throw new HTTPException(403, { message: 'Invalid access token' })
    }
  })
}
