export const odooConfig = {
  baseUrl: import.meta.env.VITE_ODOO_BASE_URL ?? "http://localhost:8069",
  database: import.meta.env.VITE_ODOO_DATABASE ?? "",
  username: import.meta.env.VITE_ODOO_USERNAME ?? "",
} as const
