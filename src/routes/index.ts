import { Router } from "express"

import { usersRoutes } from "./user-routes"

const routes = Router()

// Rotas Públicas
routes.use("/users", usersRoutes)

export { routes }
