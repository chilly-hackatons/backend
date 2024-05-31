import { Hono } from "hono";
import { prisma } from "..";

export const vac = new Hono()

vac.get('/', async (c)=>{
    const getAllVacs = await prisma.vacancy.findMany()

  return c.json(getAllVacs)
})

vac.post('/', async (c)=>{
    const{recruiterId, title, description} = await c.req.json();
  const vacancy = await prisma.vacancy.create({
    data: {
      title,
      description,
      recruiter: {
        connect: {
          id: recruiterId
        }
      }
    }
  })

  return c.json(vacancy)
})

vac.delete('/:id', async (c)=>{
    const vacId  = c.req.param('id')
    const vacansy = await prisma.vacancy.delete({
      where: {
        id: Number(vacId),
      },
    })
    return c.json(vacansy)
})

vac.get('/:id', async (c)=>{
    const id = c.req.param('id')
  const getVac = await prisma.vacancy.findUnique({
    where:{
      id:Number(id)
    }
    
  }) 

  return c.json(getVac)
})

vac.put('/:id', async (c)=>{
    const updatedVacId = c.req.param('id')
  const{title, descript,recruiterId} = await c.req.json()
  try {
    const updatedVac = await prisma.vacancy.update({
      where:{ id:Number(updatedVacId)},
      data:{
        title:title,
        description:descript,
        recruiter: {
            connect: {
              id: recruiterId
            }
          }
      },
    });
    return c.json(updatedVac)
  }catch(error){
    return c.json(404)
  }
})