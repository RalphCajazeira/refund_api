import type { Request, Response } from "express"
import { AppError } from "@/utils/AppError"
import { authConfig } from "@/configs/auth"
import { prisma } from "@/database/prisma"
import { sign } from "jsonwebtoken"
import { compare } from "bcrypt"
import { z } from "zod"

class SessionsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.email({ message: "Digite um email válido" })),
      password: z.string().trim(),
    })

    const { email, password } = bodySchema.parse(request.body)

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

    const { secret, expiresIn } = authConfig.jwt

    const token = sign({ role: user.role }, secret, {
      subject: user.id,
      expiresIn,
    })

    const { password: _, ...userWithoutPassword } = user

    response.json({ token, user: userWithoutPassword })
  }
}

export { SessionsController }
