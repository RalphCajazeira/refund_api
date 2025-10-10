import type { Request, Response } from "express"
import { AppError } from "@/utils/AppError"
import { authConfig } from "@/configs/auth"
import { prisma } from "@/database/prisma"
import { Category, UserRole } from "@prisma/client"
import { verify } from "jsonwebtoken"
import { z } from "zod"

type JwtPayload = {
  sub: string
  role: UserRole
  iat: number
  exp: number
}

class RefundsController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
      amount: z.number().positive({ message: "Valor deve ser positivo" }),
      category: z.enum(Object.values(Category)),
      filename: z.string().min(20),
    })

    const { name, amount, category, filename } = bodySchema.parse(req.body)

    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw new AppError("JWT token está faltando", 401)
    }

    const [, token] = authHeader.split(" ")

    const authorization = verify(token, authConfig.jwt.secret) as JwtPayload

    if (!authorization) {
      throw new AppError("JWT token inválido", 401)
    }

    if (authorization.role !== UserRole.employee) {
      res.status(401).json({ message: "Acesso negado" })
    }

    const user = await prisma.user.findUnique({
      where: { id: authorization.sub },
    })

    if (!user) {
      throw new AppError("Usuário não encontrado", 404)
    }

    const refund = await prisma.refunds.create({
      data: { name, amount, category, filename, userId: user.id },
    })

    res.status(201).json(refund)
  }
}

export { RefundsController }
