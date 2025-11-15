import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import Layout from "../components/Layout";
import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import Dashboard from "../pages/Dashboard/Dashboard";
import Relatorios from "../pages/Relatorios/Relatorios";
import Usuarios from "../pages/Usuarios/Usuarios";
import Permissoes from "../pages/Permissoes/Permissoes";
import Equipes from "../pages/Equipes/Equipes";
import EditarEquipe from "../pages/Equipes/EditarEquipe";
import Chat from "../pages/Chat/Chat";
import Projetos from "../pages/Projetos/Projetos";
import CriarProjeto from "../pages/Projetos/CriarProjeto";
import Tarefa from "../pages/Tarefas/Tarefa";
import Notificacoes from "../pages/Notificacoes/Notificacoes";
import Perfil from "../pages/Perfil/Perfil";
import Configuracoes from "../pages/Configuracoes/Configuracoes";

import { useAuth } from "../contexts/AuthContext";

// Redireciona para / se não estiver autenticado
function RequireAuth() {
    const { isAuthenticated, isInitialized } = useAuth();
    const location = useLocation();

    console.log("[RequireAuth] Verificando acesso a:", location.pathname, "- isAuthenticated:", isAuthenticated, "isInitialized:", isInitialized);

    // Wait for auth to initialize before redirecting
    if (!isInitialized) {
        console.log("[RequireAuth] Aguardando inicialização da autenticação...");
        return null; // or a loading spinner
    }

    if (!isAuthenticated) {
        console.log("[RequireAuth] ✗ Não autenticado - Redirecionando para /");
        return <Navigate to="/" replace state={{ from: location.pathname }} />;
    }

    console.log("[RequireAuth] ✓ Autenticado - Permitindo acesso");
    return <Outlet />;
}

// Se já estiver autenticado, manda pra /dashboard (evita voltar pro login)
function RedirectIfAuth() {
    const { isAuthenticated, isInitialized } = useAuth();
    const location = useLocation();

    console.log("[RedirectIfAuth] Verificando rota pública:", location.pathname, "- isAuthenticated:", isAuthenticated, "isInitialized:", isInitialized);

    // Wait for auth to initialize before redirecting
    if (!isInitialized) {
        console.log("[RedirectIfAuth] Aguardando inicialização da autenticação...");
        return null; // or a loading spinner
    }

    if (isAuthenticated) {
        console.log("[RedirectIfAuth] ✓ Já autenticado - Redirecionando para /dashboard");
        return <Navigate to="/dashboard" replace />;
    }

    console.log("[RedirectIfAuth] ✓ Não autenticado - Permitindo acesso à rota pública");
    return <Outlet />;
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* públicas */}
                <Route element={<RedirectIfAuth />}>
                    <Route path="/" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* privadas */}
                <Route element={<RequireAuth />}>
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/usuarios" element={<Usuarios />} />
                        <Route path="/permissoes" element={<Permissoes />} />
                        <Route path="/equipes" element={<Equipes />} />
                        <Route path="/equipes/:id" element={<EditarEquipe />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/projetos" element={<Projetos />} />
                        <Route path="/projetos/novo" element={<CriarProjeto />} />
                        <Route path="/projetos/:projectId" element={<Projetos />} />
                        <Route path="/projetos/:projectId/tarefas/:cardId" element={<Tarefa />} />
                        <Route path="/notificacoes" element={<Notificacoes />} />
                        <Route path="/perfil" element={<Perfil />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                    </Route>
                </Route>

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
