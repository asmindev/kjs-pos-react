/**
 * app.config.ts — Single Source of Truth Konfigurasi Aplikasi
 *
 * Menggabungkan: app-config.ts + odoo-config.ts + feature-flags.ts
 * + semua konstanta yang ditemukan saat audit (hardcoded values audit).
 *
 * Struktur:
 *   1. Schema Zod     — validasi + typing semua config dari .env
 *   2. appConfig      — objek konfigurasi yang sudah divalidasi
 *   3. APP_CONSTANTS  — konstanta teknis/domain yang tidak perlu di .env
 */

import { z } from "zod"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse string env var menjadi boolean.
 * Mendukung: "true", "1" → true | "false", "0", undefined → false/fallback
 */
function boolEnv(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined || value === "") return fallback
    return value === "true" || value === "1"
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const AppSchema = z.object({
    /** Nama aplikasi, ditampilkan di <title> dan header. */
    name: z.string().min(1).default("POS Retail"),

    /** Nama toko spesifik — bisa berbeda dari nama app. */
    storeName: z.string().min(1).default("POS KJS"),

    /** Versi semver aplikasi. */
    version: z.string().regex(/^\d+\.\d+\.\d+/).default("0.1.0"),

    /** Runtime environment dari Vite MODE. */
    environment: z
        .enum(["development", "staging", "production", "test"])
        .default("development"),

    /** Kode mata uang untuk format tampilan harga. */
    currency: z.string().length(3).default("IDR"),

    /** Locale format angka / tanggal. */
    locale: z.string().default("id-ID"),
})

const OdooSchema = z.object({
    /**
     * Base URL REST API Odoo (pos_rest_api module).
     * Wajib diisi di .env untuk production.
     * Audit: sebelumnya ada duplikasi — VITE_ODOO_URL (port 8001) vs
     *        VITE_ODOO_BASE_URL (port 8069). Sudah dikonsolidasi ke satu var.
     */
    baseUrl: z.string().url().default("http://localhost:8069"),

    /** Nama database Odoo. */
    database: z.string().default(""),

    /** Username login Odoo (untuk keperluan display / debug). */
    username: z.string().default(""),

    /**
     * URL sesi POS Odoo (web frontend).
     * Digunakan untuk deep-link kembali ke sesi Odoo.
     * Audit: VITE_ODOO_POS_URL sebelumnya tidak ada di .env template.
     */
    posUrl: z.string().url().default("http://localhost:8069/pos/web"),
})

const FeaturesSchema = z.object({
    /** Aktifkan barcode scanner via kamera (zxing/browser). */
    barcodeScanning: z.boolean().default(true),

    /** Aktifkan mode offline-first (simpan lokal sebelum sync). */
    offlineMode: z.boolean().default(true),

    /** Aktifkan integrasi printer thermal via Web Serial API. */
    printerIntegration: z.boolean().default(true),

    /** Aktifkan background sync otomatis ke Odoo. */
    backgroundSync: z.boolean().default(true),
})

const ConfigSchema = z.object({
    app: AppSchema,
    odoo: OdooSchema,
    features: FeaturesSchema,
})

// ─── Parse & Validasi ─────────────────────────────────────────────────────────

const _raw = {
    app: {
        name: import.meta.env.VITE_APP_NAME,
        storeName: import.meta.env.VITE_STORE_NAME,
        version: import.meta.env.VITE_APP_VERSION,
        environment: import.meta.env.MODE,
        currency: import.meta.env.VITE_CURRENCY,
        locale: import.meta.env.VITE_LOCALE,
    },
    odoo: {
        baseUrl: import.meta.env.VITE_ODOO_BASE_URL,
        database: import.meta.env.VITE_ODOO_DATABASE,
        username: import.meta.env.VITE_ODOO_USERNAME,
        posUrl: import.meta.env.VITE_ODOO_POS_URL,
    },
    features: {
        barcodeScanning: boolEnv(
            import.meta.env.VITE_FEATURE_BARCODE_SCANNING,
            true
        ),
        offlineMode: boolEnv(import.meta.env.VITE_FEATURE_OFFLINE_MODE, true),
        printerIntegration: boolEnv(
            import.meta.env.VITE_FEATURE_PRINTER_INTEGRATION,
            true
        ),
        backgroundSync: boolEnv(
            import.meta.env.VITE_FEATURE_BACKGROUND_SYNC,
            true
        ),
    },
}

const _result = ConfigSchema.safeParse(_raw)

if (!_result.success) {
    console.error(
        "[AppConfig] Konfigurasi tidak valid:",
        _result.error.format()
    )
    throw new Error(
        "[AppConfig] Validasi konfigurasi gagal. Periksa file .env Anda.\n" +
            _result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n")
    )
}

/**
 * Konfigurasi aplikasi yang sudah divalidasi oleh Zod.
 * Semua nilai bersumber dari .env (dengan fallback default yang aman).
 *
 * @example
 * import { appConfig } from "@/config/app.config"
 * appConfig.odoo.baseUrl   // "http://localhost:8069"
 * appConfig.features.offlineMode  // true
 */
export const appConfig = _result.data

// ─── Tipe Ekspor ──────────────────────────────────────────────────────────────

export type AppConfig = z.infer<typeof ConfigSchema>
export type OdooConfig = z.infer<typeof OdooSchema>
export type FeaturesConfig = z.infer<typeof FeaturesSchema>

// ─── Application Constants ────────────────────────────────────────────────────
/**
 * Konstanta teknis dan domain yang TIDAK perlu di .env.
 * Nilai-nilai ini stabil antar environment, tidak sensitif secara keamanan,
 * dan tidak perlu dikonfigurasi per deployment.
 *
 * Sumber: Audit hardcoded values (2026-06-05).
 * Sebelumnya tersebar di berbagai file; dikonsolidasikan di sini.
 */
export const APP_CONSTANTS = {
    // ── Auth & Storage ──────────────────────────────────────────────────────
    /**
     * Key localStorage untuk Zustand persist (auth state).
     * Audit: duplikat di use-auth.ts dan token.repository.ts — sekarang satu sumber.
     * JANGAN ubah nilai ini tanpa migration — akan logout semua user aktif.
     */
    AUTH_STORAGE_KEY: "pos-auth-storage",

    /**
     * Key localStorage untuk Zustand persist (cart state).
     * JANGAN ubah nilai ini tanpa migration — akan menghapus cart aktif user.
     */
    CART_STORAGE_KEY: "pos-cart-storage",

    // ── Database ─────────────────────────────────────────────────────────────
    /**
     * Nama IndexedDB (Dexie).
     * JANGAN ubah — mengubah nama DB berarti kehilangan semua data offline lokal.
     */
    DB_NAME: "pos-offline-db",

    // ── Sync Queue ────────────────────────────────────────────────────────────
    /**
     * Interval polling background sync (ms).
     * Audit: sebelumnya 30_000 di use-sync.ts, bertentangan dengan
     *        DEFAULT_SYNC_INTERVAL_MS = 60_000 di shared/constants.ts.
     *        Dikonsolidasikan ke nilai yang dipakai aktif (30 detik).
     */
    SYNC_INTERVAL_MS: 30_000,

    /**
     * Jumlah maksimum retry sebelum job sync masuk dead-letter queue.
     * Audit: sebelumnya magic number `3` di sync-queue.repository.ts.
     */
    SYNC_MAX_RETRIES: 3,

    /**
     * Nilai priority job sync untuk transaksi POS.
     * Lebih kecil = lebih prioritas.
     * Audit: sebelumnya magic number `1` di sync-queue.repository.ts.
     */
    SYNC_PRIORITY_TRANSACTION: 1,

    /** Nilai priority job sync untuk operasi lain (mis. update produk manual). */
    SYNC_PRIORITY_BACKGROUND: 2,

    // ── Cache TTL ─────────────────────────────────────────────────────────────
    /**
     * TTL cache produk di keyValueCache (Dexie).
     * Setelah 5 menit, request berikutnya akan memanggil API Odoo.
     * Audit: sebelumnya tersebar di odoo.adapter.ts.
     */
    PRODUCT_CACHE_TTL_MS: 5 * 60_000,

    /**
     * TTL cache kategori di keyValueCache (Dexie).
     * 1 jam karena kategori sangat jarang berubah.
     * Audit: sebelumnya tersebar di odoo.adapter.ts.
     */
    CATEGORY_CACHE_TTL_MS: 60 * 60_000,

    // ── UI / Domain ───────────────────────────────────────────────────────────
    /**
     * Sentinel value untuk filter "tampilkan semua kategori".
     * Audit: string "Semua" tersebar di 3 file (use-pos-dashboard.ts,
     *        product.repository.ts, use-products.ts) — sekarang satu sumber.
     */
    CATEGORY_ALL: "Semua",

    /**
     * Jumlah tab kategori yang tampil sebelum masuk dropdown "Lainnya".
     * Audit: sebelumnya inline magic number `15` di pos-dashboard.tsx.
     */
    MAX_VISIBLE_CATEGORIES: 15,

    // ── Pagination ────────────────────────────────────────────────────────────
    /** Jumlah item produk per halaman di product grid. */
    PRODUCT_PAGE_LIMIT: 100,

    /** Jumlah item customer per halaman di modal pencarian. */
    CUSTOMER_PAGE_LIMIT: 50,

    // ── Printer ───────────────────────────────────────────────────────────────
    /**
     * Nama model printer thermal yang ditampilkan di UI.
     * Audit: sebelumnya hardcoded "EPSON TM-T82 siap" di pos-dashboard.tsx.
     * TODO: idealnya dibaca dari status printer yang sesungguhnya.
     */
    PRINTER_MODEL: "EPSON TM-T82",
} as const

export type AppConstants = typeof APP_CONSTANTS
