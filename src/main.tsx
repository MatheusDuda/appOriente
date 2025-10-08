import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);
