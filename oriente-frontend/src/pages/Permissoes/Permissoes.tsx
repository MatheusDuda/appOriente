import { useLocation } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Divider,
    Button,
    Avatar,
    Chip,
    Stack,
} from "@mui/material";
import { SaveOutlined, ArrowBackOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { User } from "../../types";

type Permissao = {
    modulo: string;
    permissoes: {
        label: string;
        key: string;
        checked: boolean;
    }[];
};

const permissoesIniciais: Permissao[] = [
    {
        modulo: "Usuários",
        permissoes: [
            { label: "Visualizar usuários", key: "usuarios.visualizar", checked: true },
            { label: "Criar usuários", key: "usuarios.criar", checked: false },
            { label: "Editar usuários", key: "usuarios.editar", checked: false },
            { label: "Excluir usuários", key: "usuarios.excluir", checked: false },
            { label: "Gerenciar permissões", key: "usuarios.permissoes", checked: false },
        ],
    },
    {
        modulo: "Projetos",
        permissoes: [
            { label: "Visualizar projetos", key: "projetos.visualizar", checked: true },
            { label: "Criar projetos", key: "projetos.criar", checked: false },
            { label: "Editar projetos", key: "projetos.editar", checked: false },
            { label: "Excluir projetos", key: "projetos.excluir", checked: false },
            { label: "Gerenciar membros", key: "projetos.membros", checked: false },
        ],
    },
    {
        modulo: "Tarefas",
        permissoes: [
            { label: "Visualizar tarefas", key: "tarefas.visualizar", checked: true },
            { label: "Criar tarefas", key: "tarefas.criar", checked: true },
            { label: "Editar tarefas", key: "tarefas.editar", checked: true },
            { label: "Excluir tarefas", key: "tarefas.excluir", checked: false },
            { label: "Atribuir tarefas", key: "tarefas.atribuir", checked: false },
        ],
    },
    {
        modulo: "Relatórios",
        permissoes: [
            { label: "Visualizar relatórios", key: "relatorios.visualizar", checked: true },
            { label: "Criar relatórios", key: "relatorios.criar", checked: false },
            { label: "Exportar relatórios", key: "relatorios.exportar", checked: false },
        ],
    },
    {
        modulo: "Equipes",
        permissoes: [
            { label: "Visualizar equipes", key: "equipes.visualizar", checked: true },
            { label: "Criar equipes", key: "equipes.criar", checked: false },
            { label: "Editar equipes", key: "equipes.editar", checked: false },
            { label: "Excluir equipes", key: "equipes.excluir", checked: false },
        ],
    },
    {
        modulo: "Configurações",
        permissoes: [
            { label: "Acessar configurações", key: "config.acessar", checked: false },
            { label: "Modificar configurações", key: "config.modificar", checked: false },
        ],
    },
];

export default function Permissoes() {
    const location = useLocation();
    const navigate = useNavigate();
    const usuario = location.state?.usuario as User | undefined;

    const handleSalvar = () => {
        console.log("Salvar permissões para usuário:", usuario?.id);
        navigate("/usuarios");
    };

    const getRoleLabel = (role: string): string => {
        return role === "ADMIN" ? "Administrador" : "Usuário";
    };

    if (!usuario) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Usuário não encontrado
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackOutlined />}
                    onClick={() => navigate("/usuarios")}
                    sx={{ width: "fit-content" }}
                >
                    Voltar para Usuários
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Button
                    variant="text"
                    startIcon={<ArrowBackOutlined />}
                    onClick={() => navigate("/usuarios")}
                    sx={{ mb: 2 }}
                >
                    Voltar
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Gerenciar Permissões
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Configure as permissões de acesso do usuário
                </Typography>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: "1.5rem" }}>
                        {usuario.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {usuario.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {usuario.email}
                        </Typography>
                    </Box>
                    <Chip label={getRoleLabel(usuario.role)} color="primary" />
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {permissoesIniciais.map((modulo, index) => (
                        <Box key={modulo.modulo}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                                {modulo.modulo}
                            </Typography>
                            <FormGroup>
                                {modulo.permissoes.map((perm) => (
                                    <FormControlLabel
                                        key={perm.key}
                                        control={<Checkbox defaultChecked={perm.checked} />}
                                        label={perm.label}
                                    />
                                ))}
                            </FormGroup>
                            {index < permissoesIniciais.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                    ))}
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 4 }} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => navigate("/usuarios")}>
                        Cancelar
                    </Button>
                    <Button variant="contained" startIcon={<SaveOutlined />} onClick={handleSalvar}>
                        Salvar Permissões
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
