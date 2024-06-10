import { sign } from 'hono/jwt'


export const generateAccessToken = (userId : number | string) => {
    const payload = {
        sub: String(userId),
        exp: Math.floor(Date.now() / 1000) + 60 * 15, // Token expires in 5 minutes
    }
    const secret = process.env.JWT_SECRET as string
    const token = sign(payload, secret)

  return token
};

export const generateRefreshToken = (userId : number | string) => {

    const payload = {
        sub: String(userId),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Token expires in 30 days
    }
    const secret = process.env.JWT_REFRESH_SECRET as string
    const token = sign(payload, secret)

  return token
};

export const transformStringsToObjects = (strings: string[] | undefined): { value: string, label: string }[] => {
  if (!strings) return [];
  
  return strings.map(str => ({
    value: str,
    label: str.charAt(0).toUpperCase() + str.slice(1)
  }));
}