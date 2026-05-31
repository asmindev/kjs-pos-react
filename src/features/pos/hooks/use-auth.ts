import { create } from "zustand"

/**
 * JWT payload dari Odoo pos_rest_api module.
 * Token di-decode client-side untuk display info.
 * Verifikasi signature terjadi di server.
 */
export type JwtPayload = {
    uid: number
    pid: number
    sid: number
    branch_id: number
    name: string
    login: string
    iat: number
    exp: number
    jti: string
}

type AuthState = {
    token: string | null
    payload: JwtPayload | null
    isAuthenticated: boolean
    isExpired: boolean

    // Actions
    setToken: (token: string) => void
    clearAuth: () => void
    getAuthHeader: () => string | null
}

function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split(".")
        if (parts.length !== 3) return null

        // Decode payload (bagian kedua JWT)
        const payloadB64 = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")

        // Tambah padding
        const padded = payloadB64.padEnd(
            payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
            "="
        )

        const decoded = atob(padded)
        const payload = JSON.parse(decoded)
        return payload as JwtPayload
    } catch {
        return null
    }
}

function isTokenExpired(payload: JwtPayload): boolean {
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
}

export const useAuth = create<AuthState>((set, get) => ({
    token: null,
    payload: null,
    isAuthenticated: false,
    isExpired: false,

    setToken: (token) => {
        const payload = decodeJwtPayload(token)
        const expired = payload ? isTokenExpired(payload) : true

        // Simpan ke localStorage untuk persist
        if (payload && !expired) {
            localStorage.setItem("pos_jwt", token)
        }

        set({
            token,
            payload,
            isAuthenticated: !!payload && !expired,
            isExpired: expired,
        })
    },

    clearAuth: () => {
        localStorage.removeItem("pos_jwt")
        set({
            token: null,
            payload: null,
            isAuthenticated: false,
            isExpired: false,
        })
    },

    getAuthHeader: () => {
        const { token, isAuthenticated, isExpired } = get()
        if (token && isAuthenticated && !isExpired) {
            return `Bearer ${token}`
        }
        return null
    },
}))
