import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

type ThemeMode = "light" | "dark" | "auto";

type ThemeContextType = {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem("theme_mode");
        return (saved as ThemeMode) || "light";
    });

    const [systemPrefersDark, setSystemPrefersDark] = useState(
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );

    // Detecta mudanças nas preferências do sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    // Persiste modo no localStorage
    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
        localStorage.setItem("theme_mode", newMode);
    };

    // Determina tema efetivo (considerando modo auto)
    const effectiveMode = useMemo(() => {
        if (mode === "auto") {
            return systemPrefersDark ? "dark" : "light";
        }
        return mode;
    }, [mode, systemPrefersDark]);

    // Cria tema MUI baseado no modo efetivo
    const theme = useMemo(() => {
        const isDark = effectiveMode === "dark";

        return createTheme({
            palette: {
                mode: effectiveMode,
                primary: {
                    main: isDark ? "#8B6F47" : "#6B4F35",
                    contrastText: "#FFFFFF",
                },
                secondary: {
                    main: isDark ? "#D4C5B9" : "#E8DED6",
                    contrastText: isDark ? "#2A2520" : "#3D332A",
                },
                background: {
                    default: isDark ? "#1A1613" : "#F8F5F2",
                    paper: isDark ? "#2A2520" : "#FFFFFF",
                },
                text: {
                    primary: isDark ? "#E8DED6" : "#3D332A",
                    secondary: isDark ? "#B8ADA3" : "#7D756D",
                },
                divider: isDark ? "#3D3832" : "#E6DFD8",
            },
            typography: {
                fontFamily: ["Poppins", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
                h1: { fontSize: "2.25rem", fontWeight: 700 },
                h2: { fontSize: "1.75rem", fontWeight: 700 },
                h3: { fontSize: "1.5rem", fontWeight: 600 },
                body1: { fontSize: "1rem", fontWeight: 400 },
                button: { textTransform: "none", fontWeight: 600 },
            },
            shape: { borderRadius: 12 },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            backgroundColor: isDark ? "#1A1613" : "#F8F5F2",
                            color: isDark ? "#E8DED6" : "#3D332A",
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: isDark
                                ? "0 4px 12px rgba(0,0,0,0.3)"
                                : "0 4px 12px rgba(0,0,0,0.06)",
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 10,
                            padding: "10px 16px",
                            fontWeight: 600,
                        },
                    },
                },
            },
        });
    }, [effectiveMode]);

    const toggleTheme = () => {
        setMode(mode === "light" ? "dark" : "light");
    };

    const value = useMemo(
        () => ({ mode, setMode, toggleTheme }),
        [mode]
    );

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
