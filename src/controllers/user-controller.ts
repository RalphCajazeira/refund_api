import type { Request, Response } from "express"
import z from "zod"
import { UserRole } from "@prisma/client"
import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { hash } from "bcrypt"

class UsersController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
      email: z.email({ message: "Digite um email válido" }).toLowerCase(),
      password: z
        .string()
        .min(6, { message: "A senha deve ter no mínimo 6 dígitos" }),
      role: z.enum([UserRole.employee, UserRole.manager]),
    })

    const { name, email, password, role } = bodySchema.parse(req.body)

    const userWithSameEmail = await prisma.user.findFirst({
      where: { email },
    })

    if (userWithSameEmail) {
      throw new AppError("Já existe um usuário com esse email", 409)
    }

    const hashedPassword = await hash(password, 10)

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    })

    res.status(201).json({ message: "Usuário criado com sucesso!" })
  }
}

export { UsersController }
