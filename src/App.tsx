import { useAuth } from "./contexts/AuthContext";
import LoadingScreen from "./components/Common/LoadingScreen";
import AppRoutes from "./routes";

export default function App() {
    const { loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return <AppRoutes />;
}
