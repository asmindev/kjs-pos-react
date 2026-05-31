import { RouterProvider } from "@tanstack/react-router"

import { router } from "./router"

export function Root() {
  return <RouterProvider router={router} />
}
