import type { Request, Response } from "express"
import { AppError } from "@/utils/AppError"
import { prisma } from "@/database/prisma"
import { Category, UserRole } from "@prisma/client"
import { z } from "zod"

class RefundsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
      amount: z.number().positive({ message: "Valor precisa ser positivo" }),
      category: z.enum(Object.values(Category)),
      filename: z.string().min(20),
    })

    const { name, amount, category, filename } = bodySchema.parse(request.body)

    if (!request.user) {
      throw new AppError("Não autorizado", 401)
    }

    const refund = await prisma.refunds.create({
      data: {
        name,
        amount,
        category,
        filename,
        userId: request.user?.id,
      },
    })

    response.status(201).json(refund)
  }

  async list(request: Request, response: Response) {
    const { id, role } = request.user || {}

    if (!id) {
      throw new AppError("Não autorizado", 401)
    }

    if (role === UserRole.manager || role === UserRole.admin) {
      const refunds = await prisma.refunds.findMany({
        include: {
          user: { select: { name: true, email: true } },
        },
      })
      return response.json(refunds)
    }

    const refunds = await prisma.refunds.findMany({
      where: {
        userId: id,
      },
    })
    return response.json(refunds)
  }
}

export { RefundsController }
