import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import Layout from "../components/Layout";
import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import Dashboard from "../pages/Dashboard/Dashboard";
import Reports from "../pages/Reports/Reports";
import Users from "../pages/Users/Users";
import Permissions from "../pages/Permissions/Permissions";
import Teams from "../pages/Teams/Teams";
import EditTeam from "../pages/Teams/EditTeam";
import Chat from "../pages/Chat/Chat";
import Projects from "../pages/Projects/Projects";
import CreateProject from "../pages/Projects/CreateProject";
import TaskDetail from "../pages/Tasks/TaskDetail";
import Notifications from "../pages/Notifications/Notifications";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";

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
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/permissions" element={<Permissions />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/:id" element={<EditTeam />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/new" element={<CreateProject />} />
                        <Route path="/projects/:projectId" element={<Projects />} />
                        <Route path="/projects/:projectId/tasks/:cardId" element={<TaskDetail />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                </Route>

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
