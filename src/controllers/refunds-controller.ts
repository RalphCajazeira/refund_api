import type { Request, Response } from "express"
import { AppError } from "@/utils/AppError"
import { prisma } from "@/database/prisma"
import { Category, UserRole } from "@prisma/client"
import { z } from "zod"

function buildPagination(totalRecords: number, page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage))
  return { page, perPage, totalRecords, totalPages }
}

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

  async index(request: Request, response: Response) {
    const { id, role } = request.user || {}

    const querySchema = z.object({
      name: z.string().optional().default(""),
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(10),
    })

    const { name, page, perPage } = querySchema.parse(request.query)
    const skip = (page - 1) * perPage

    if (!id) throw new AppError("Não autorizado", 401)

    // Monta o filtro base conforme o papel do usuário
    const isManager = role === UserRole.manager || role === UserRole.admin

    // where para consultas
    const where = isManager
      ? name?.trim()
        ? { user: { name: { contains: name.trim() } } }
        : {} // sem filtro por nome
      : { userId: id }

    // include somente para manager/admin
    const include = isManager
      ? { user: { select: { name: true, email: true } } }
      : undefined

    const [refunds, totalRecords] = await Promise.all([
      prisma.refunds.findMany({
        skip,
        take: perPage,
        where,
        include,
        orderBy: { createdAt: "desc" },
      }),
      prisma.refunds.count({ where }),
    ])

    const pagination = buildPagination(totalRecords, page, perPage)

    return response.json({ refunds, pagination })
  }

  async show(request: Request, response: Response) {
    const { id: user_id, role } = request.user || {}

    const paramsSchema = z.object({
      id: z.uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    if (!user_id) throw new AppError("Não autorizado", 401)

    const isManager = role === UserRole.manager || role === UserRole.admin

    // 1) Busca o refund pelo id para diferenciar "não encontrado" de "não autorizado"
    const refund = await prisma.refunds.findUnique({
      where: { id },
      include: isManager
        ? { user: { select: { name: true, email: true } } }
        : undefined,
    })

    // 2) Se não existir, 404
    if (!refund) {
      throw new AppError("Refund não encontrado", 404)
    }

    // 3) Se não for manager/admin, só pode ver se for o dono
    if (!isManager && refund.userId !== user_id) {
      throw new AppError("Não autorizado", 401) // (opcionalmente use 403)
    }

    // 4) Autorizado → retorna
    return response.json(refund)
  }
}

export { RefundsController }
