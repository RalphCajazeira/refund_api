import { Router } from "express"

import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"

import { usersRoutes } from "./user-routes"
import { sessionsRoutes } from "./sessions-routes"
import { refundsRoutes } from "./refunds-routes"

const routes = Router()

// Rotas Públicas
routes.use("/users", usersRoutes)
routes.use("/sessions", sessionsRoutes)

// Rotas Privadas
routes.use(ensureAuthenticated) // Aplica o middleware de autenticação do token para todas as rotas abaixo
routes.use("/refunds", refundsRoutes)

export { routes }
