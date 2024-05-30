import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'



export const apiAuth = () => {
    return createMiddleware(async (c, next) => {
        const accessToken = c.req.header('Secret-Access-Token')
        if (accessToken !== process.env.BASE_SECRET_TOKEN) throw new HTTPException(401, { message: 'Do not have access token' })
        await next()
  })
}
