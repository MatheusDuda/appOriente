import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextType = {
    isAuthenticated: boolean;
    isInitialized: boolean;
    login: (token?: string) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        console.log("[AuthContext] Inicializando - verificando localStorage...");
        const t = localStorage.getItem("auth_token");
        if (t) {
            console.log("[AuthContext] ✓ Token encontrado no localStorage");
            setToken(t);
        } else {
            console.log("[AuthContext] ✗ Nenhum token encontrado no localStorage");
        }
        setIsInitialized(true);
        console.log("[AuthContext] ✓ Inicialização completa");
    }, []);

    useEffect(() => {
        console.log("[AuthContext] Estado mudou - isAuthenticated:", !!token, "isInitialized:", isInitialized);
    }, [token, isInitialized]);

    const login = (t?: string) => {
        if (!t) {
            console.error("[AuthContext] ✗ Token não fornecido para login");
            return;
        }
        console.log("[AuthContext] ✓ Login realizado - salvando token");
        localStorage.setItem("auth_token", t);
        setToken(t);
    };

    const logout = () => {
        console.log("[AuthContext] ✓ Logout realizado - removendo token");
        localStorage.removeItem("auth_token");
        setToken(null);
    };

    const value = useMemo(
        () => ({ isAuthenticated: !!token, isInitialized, login, logout }),
        [token, isInitialized]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
