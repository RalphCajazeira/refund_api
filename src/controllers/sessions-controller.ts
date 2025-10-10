import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { compare } from "bcrypt"
import type { Request, Response } from "express"
import z from "zod"

class SessionsController {
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      email: z.email({ message: "Digite um email válido" }),
      password: z
        .string()
        .min(6, { message: "A senha deve ter no mínimo 6 dígitos" }),
    })

    const { email, password } = bodySchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true },
    })

    if (!user) {
      throw new AppError("Usuário ou senha incorretos", 401)
    }

    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      throw new AppError("Usuário ou senha incorretos", 401)
    }

    const { password: _, ...userWithoutPassword } = user

    res.json({ userWithoutPassword })
  }
}

export { SessionsController }
