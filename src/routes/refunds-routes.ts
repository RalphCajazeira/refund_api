import { UserRole } from "@prisma/client"
import { Router } from "express"

import { RefundsController } from "@/controllers/refunds-controller"
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization"

const refundsRoutes = Router()
const refundsController = new RefundsController()

// Definir todas as roles possíveis
const ALL_ROLES = Object.values(UserRole) as UserRole[]

refundsRoutes.post(
  "/",
  verifyUserAuthorization([UserRole.employee, UserRole.admin]),
  refundsController.create
)

refundsRoutes.get(
  "/",
  verifyUserAuthorization(ALL_ROLES),
  refundsController.index
)

refundsRoutes.get(
  "/:id",
  verifyUserAuthorization(ALL_ROLES),
  refundsController.show
)

export { refundsRoutes }
