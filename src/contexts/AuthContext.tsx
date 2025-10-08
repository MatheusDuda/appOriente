import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextType = {
    isAuthenticated: boolean;
    login: (token?: string) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const t = localStorage.getItem("auth_token");
        if (t) setToken(t);
    }, []);

    const login = (t = "dev-token") => {
        localStorage.setItem("auth_token", t);
        setToken(t);
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        setToken(null);
    };

    const value = useMemo(
        () => ({ isAuthenticated: !!token, login, logout }),
        [token]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
