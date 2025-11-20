import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Avatar,
    Button,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Snackbar,
} from "@mui/material";
import {
    SearchOutlined,
    PersonAddOutlined,
} from "@mui/icons-material";
import UsuarioOverflow from "../../components/Usuarios/Overflow";
import CadastrarUsuario from "../../components/Usuarios/CadastrarUsuario";
import userService from "../../services/userService";
import type { User, UserRole, UserStatus } from "../../types";

const getRoleLabel = (role: UserRole): string => {
    switch (role) {
        case "ADMIN":
            return "Administrador";
        case "MANAGER":
            return "Gerenciador";
        case "USER":
        default:
            return "Usuário";
    }
};

const getRoleColor = (role: UserRole) => {
    switch (role) {
        case "ADMIN":
            return "error";
        case "MANAGER":
            return "warning";
        case "USER":
        default:
            return "primary";
    }
};

const getStatusLabel = (status: UserStatus): string => {
    return status === "ACTIVE" ? "Ativo" : "Inativo";
};

const getStatusColor = (status: UserStatus) => {
    return status === "ACTIVE" ? "success" : "default";
};

export default function Usuarios() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [cadastrarOpen, setCadastrarOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        loadUsers();
    }, [page, rowsPerPage]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const skip = page * rowsPerPage;
            const response = await userService.getUsers(skip, rowsPerPage);
            setUsers(response.users);
            setTotal(response.total);
        } catch (error: any) {
            console.error("Erro ao carregar usuários:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao carregar usuários",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleUserCreated = () => {
        setCadastrarOpen(false);
        setSnackbar({
            open: true,
            message: "Usuário cadastrado com sucesso!",
            severity: "success",
        });
        loadUsers();
    };

    const handleUserUpdated = () => {
        setSnackbar({
            open: true,
            message: "Usuário atualizado com sucesso!",
            severity: "success",
        });
        loadUsers();
    };

    const handleUserDeleted = () => {
        setSnackbar({
            open: true,
            message: "Usuário desativado com sucesso!",
            severity: "success",
        });
        loadUsers();
    };

    const handleUserActivated = () => {
        setSnackbar({
            open: true,
            message: "Usuário reativado com sucesso!",
            severity: "success",
        });
        loadUsers();
    };

    const handlePermissionUpdated = () => {
        setSnackbar({
            open: true,
            message: "Função do usuário alterada com sucesso!",
            severity: "success",
        });
        loadUsers();
    };

    // Filtro local por busca
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Usuários
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Gerencie os usuários e suas permissões
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAddOutlined />}
                    onClick={() => setCadastrarOpen(true)}
                >
                    Cadastrar Usuário
                </Button>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 3 }}
                />

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredUsers.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="h6" sx={{ color: "text.secondary" }}>
                            {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Função</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Data de Cadastro</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            hover
                                            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {user.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getRoleLabel(user.role)}
                                                    color={getRoleColor(user.role)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(user.status)}
                                                    color={getStatusColor(user.status)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.created_at).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell align="right">
                                                <UsuarioOverflow
                                                    user={user}
                                                    onUserUpdated={handleUserUpdated}
                                                    onUserDeleted={handleUserDeleted}
                                                    onUserActivated={handleUserActivated}
                                                    onPermissionUpdated={handlePermissionUpdated}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            labelRowsPerPage="Linhas por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
                    </>
                )}
            </Paper>

            <CadastrarUsuario
                open={cadastrarOpen}
                onClose={() => setCadastrarOpen(false)}
                onUserCreated={handleUserCreated}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
