import { UserRole } from "@prisma/client"
import { Router } from "express"

import { RefundsController } from "@/controllers/refunds-controller"
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization"

const refundsRoutes = Router()
const refundsController = new RefundsController()

refundsRoutes.post(
  "/",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.create
)

export { refundsRoutes }
