import type { Request, Response } from "express"
import z from "zod"
import { UserRole } from "@prisma/client"

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
      role: z.enum([UserRole.employee]),
    })

    const data = bodySchema.parse(req.body)
    res.json(data)
  }
}

export { UsersController }
