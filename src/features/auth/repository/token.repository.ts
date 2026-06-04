export const tokenRepository = {
    getToken(): string | null {
        const data = localStorage.getItem("pos-auth-storage")
        if (data) {
            try {
                const parsed = JSON.parse(data)
                return parsed?.state?.token || null
            } catch {
                return null
            }
        }
        return null
    },

    setToken(token: string): void {
        // Not used directly if Zustand manages state, but implemented for completeness
        const data = localStorage.getItem("pos-auth-storage")
        let parsed: {
            state: { token: string | null; payload: any }
            version: number
        } = { state: { token: null, payload: null }, version: 0 }
        if (data) {
            try {
                parsed = JSON.parse(data)
            } catch {}
        }
        parsed.state.token = token
        localStorage.setItem("pos-auth-storage", JSON.stringify(parsed))
    },

    clearToken(): void {
        const data = localStorage.getItem("pos-auth-storage")
        if (data) {
            try {
                const parsed: {
                    state: { token: string | null; payload: any }
                    version: number
                } = JSON.parse(data)
                parsed.state.token = null
                parsed.state.payload = null
                localStorage.setItem("pos-auth-storage", JSON.stringify(parsed))
            } catch {}
        }
    },

    getAuthHeader(): string | null {
        const token = this.getToken()
        return token ? `Bearer ${token}` : null
    },
}
