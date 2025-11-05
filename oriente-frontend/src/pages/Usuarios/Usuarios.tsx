import { useState } from "react";
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
} from "@mui/material";
import {
    SearchOutlined,
    PersonAddOutlined,
} from "@mui/icons-material";
import UsuarioOverflow from "../../components/Usuarios/Overflow";
import CadastrarUsuario from "../../components/Usuarios/CadastrarUsuario";

type Usuario = {
    id: number;
    nome: string;
    email: string;
    cargo: string;
    role: "Admin" | "Gerente" | "Membro" | "Visualizador";
    status: "Ativo" | "Inativo";
    avatar?: string;
};

const mockUsuarios: Usuario[] = [
    { id: 1, nome: "João Silva", email: "joao.silva@oriente.com", cargo: "Tech Lead", role: "Admin", status: "Ativo" },
    { id: 2, nome: "Maria Santos", email: "maria.santos@oriente.com", cargo: "Product Manager", role: "Gerente", status: "Ativo" },
    { id: 3, nome: "Pedro Costa", email: "pedro.costa@oriente.com", cargo: "Desenvolvedor Senior", role: "Membro", status: "Ativo" },
    { id: 4, nome: "Ana Oliveira", email: "ana.oliveira@oriente.com", cargo: "QA Engineer", role: "Membro", status: "Ativo" },
    { id: 5, nome: "Carlos Lima", email: "carlos.lima@oriente.com", cargo: "Designer UX", role: "Membro", status: "Inativo" },
    { id: 6, nome: "Beatriz Rocha", email: "beatriz.rocha@oriente.com", cargo: "Scrum Master", role: "Gerente", status: "Ativo" },
    { id: 7, nome: "Rafael Mendes", email: "rafael.mendes@oriente.com", cargo: "Desenvolvedor Junior", role: "Visualizador", status: "Ativo" },
    { id: 8, nome: "Juliana Alves", email: "juliana.alves@oriente.com", cargo: "Analista de Dados", role: "Membro", status: "Ativo" },
];

const getRoleColor = (role: Usuario["role"]) => {
    switch (role) {
        case "Admin":
            return "error";
        case "Gerente":
            return "warning";
        case "Membro":
            return "primary";
        case "Visualizador":
            return "default";
        default:
            return "default";
    }
};

const getStatusColor = (status: Usuario["status"]) => {
    return status === "Ativo" ? "success" : "default";
};

export default function Usuarios() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [cadastrarOpen, setCadastrarOpen] = useState(false);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredUsuarios = mockUsuarios.filter(
        (usuario) =>
            usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedData = filteredUsuarios.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                    placeholder="Buscar por nome, email ou cargo..."
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

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Cargo</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Função</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((usuario) => (
                                <TableRow
                                    key={usuario.id}
                                    hover
                                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
                                                {usuario.nome.charAt(0)}
                                            </Avatar>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {usuario.nome}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{usuario.email}</TableCell>
                                    <TableCell>{usuario.cargo}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={usuario.role}
                                            color={getRoleColor(usuario.role)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={usuario.status}
                                            color={getStatusColor(usuario.status)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <UsuarioOverflow usuario={usuario} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredUsuarios.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Linhas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            <CadastrarUsuario open={cadastrarOpen} onClose={() => setCadastrarOpen(false)} />
        </Box>
    );
}
