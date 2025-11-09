import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const SIDEBAR_STORAGE_KEY = "sidebar_open";

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        return stored !== null ? stored === "true" : true;
    });

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    useEffect(() => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    }, [sidebarOpen]);

    return (
        <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "background.default" }}>
            <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
            <Box sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                marginLeft: { xs: 0, md: sidebarOpen ? '260px' : '80px' },
                transition: 'margin 0.3s ease',
                height: "100vh",
                overflow: "hidden"
            }}>
                <Topbar sidebarOpen={sidebarOpen} />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        overflow: "auto",
                        p: { xs: 2, md: 3 },
                        mt: '64px',
                        height: "calc(100vh - 64px)"
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
