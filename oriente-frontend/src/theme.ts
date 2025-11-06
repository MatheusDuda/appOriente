import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#6B4F35",
            contrastText: "#FFFFFF", // bom contraste sobre o marrom
        },
        secondary: {
            main: "#E8DED6",
            contrastText: "#3D332A", // secundária é clara → texto escuro
        },
        background: {
            default: "#F8F5F2",
            paper: "#FFFFFF",
        },
        text: {
            primary: "#3D332A",
            secondary: "#7D756D",
        },
        divider: "#E6DFD8", // perto da paleta, útil pra bordas sutis
    },
    typography: {
        fontFamily: ["Poppins", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
        h1: { fontSize: "2.25rem", fontWeight: 700 },
        h2: { fontSize: "1.75rem", fontWeight: 700 },
        h3: { fontSize: "1.5rem",  fontWeight: 600 },
        body1: { fontSize: "1rem",  fontWeight: 400 },
        button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: "#F8F5F2",
                    color: "#3D332A",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)", // sombra card
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
