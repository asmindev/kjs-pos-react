export const odooConfig = {
  baseUrl: import.meta.env.VITE_ODOO_BASE_URL ?? "http://localhost:8069",
  database: import.meta.env.VITE_ODOO_DATABASE ?? "",
  username: import.meta.env.VITE_ODOO_USERNAME ?? "",
  odooPosUrl: import.meta.env.VITE_ODOO_POS_URL ?? "http://localhost:8069/pos/web",
} as const
