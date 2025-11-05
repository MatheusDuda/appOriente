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
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Topbar />
                <Box component="main" sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 3, md: 4 } }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
