import { useState } from "react";
import {
    Box,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Badge,
    Chip,
    Typography,
    IconButton,
    AvatarGroup,
} from "@mui/material";
import { SearchOutlined, GroupAddOutlined } from "@mui/icons-material";
import type {Conversation} from "../../types/chat";
import CreateGroupDialog from "./CreateGroup";

type ConversationListProps = {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    onSelectConversation: (conversation: Conversation) => void;
};

export default function ConversationList({
    conversations,
    selectedConversation,
    onSelectConversation,
}: ConversationListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    const filteredConversations = conversations.filter(
        (conversation) =>
            conversation.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conversation.ultimaMensagem.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Conversas
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => setCreateGroupOpen(true)}
                        aria-label="Criar grupo"
                    >
                        <GroupAddOutlined />
                    </IconButton>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

                        <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
                {filteredConversations.map((conversation) => (
                    <ListItem
                        key={conversation.id}
                        disablePadding
                        sx={{
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            "&:last-of-type": { borderBottom: "none" },
                        }}
                    >
                        <ListItemButton
                            selected={selectedConversation?.id === conversation.id}
                            onClick={() => onSelectConversation(conversation)}
                            sx={{
                                "&.Mui-selected": {
                                    bgcolor: "action.selected",
                                },
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                                alignItems: "flex-start",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                            }}
                        >
                            <ListItemAvatar>
                                {conversation.tipo === "grupo" ? (
                                    <AvatarGroup max={2} sx={{ width: 40, height: 40 }}>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                                            {conversation.nome.charAt(0)}
                                        </Avatar>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                                            {conversation.nome.charAt(1)}
                                        </Avatar>
                                    </AvatarGroup>
                                ) : (
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                        variant="dot"
                                        sx={{
                                            "& .MuiBadge-badge": {
                                                bgcolor: conversation.online ? "success.main" : "grey.400",
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                border: "2px solid",
                                                borderColor: "background.paper",
                                            },
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: "primary.main" }}>
                                            {conversation.nome.charAt(0)}
                                        </Avatar>
                                    </Badge>
                                )}
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {conversation.nome}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {conversation.timestamp}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flexGrow: 1,
                                                fontWeight: conversation.naoLidas > 0 ? 600 : 400,
                                            }}
                                        >
                                            {conversation.ultimaMensagem}
                                        </Typography>
                                        {conversation.naoLidas > 0 && (
                                            <Chip
                                                label={conversation.naoLidas}
                                                size="small"
                                                color="primary"
                                                sx={{ height: 20, minWidth: 20, fontSize: "0.75rem", ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                }
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <CreateGroupDialog open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} />
        </>
    );
}
