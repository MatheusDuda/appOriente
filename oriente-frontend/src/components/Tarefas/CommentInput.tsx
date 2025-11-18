import { useState, useRef, useEffect, useCallback } from "react";
import {
    TextField,
    List,
    ListItem,
    ListItemText,
    Paper,
    Popper,
    CircularProgress,
    IconButton,
    Box,
} from "@mui/material";
import { SendOutlined } from "@mui/icons-material";
import type { User } from "../../types";
import projectService from "../../services/projectService";

type CommentInputProps = {
    onSubmit: (content: string) => Promise<void>;
    initialValue?: string;
    disabled?: boolean;
    projectId: number;
    placeholder?: string;
};

export default function CommentInput({
    onSubmit,
    initialValue = "",
    disabled = false,
    projectId,
    placeholder = "Adicione um comentário...",
}: CommentInputProps) {
    const [content, setContent] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<User[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionStart, setMentionStart] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const textFieldContainerRef = useRef<HTMLDivElement>(null);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Load project members on mount
    useEffect(() => {
        const loadMembers = async () => {
            try {
                setLoadingMembers(true);
                const projectMembers = await projectService.getProjectMembers(projectId);
                console.log("✓ CommentInput: Membros carregados do API:", projectMembers);
                console.log(`✓ CommentInput: Total de membros: ${projectMembers.length}`);
                setMembers(projectMembers);
            } catch (error) {
                console.error("✗ CommentInput: Erro ao carregar membros:", error);
            } finally {
                setLoadingMembers(false);
            }
        };
        loadMembers();
    }, [projectId]);

    // Handle text input and detect @mentions
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const text = e.target.value;
            setContent(text);

            // Find the last @ symbol and check if we're in a mention context
            const cursorPos = e.currentTarget.selectionStart || 0;
            const textBeforeCursor = text.substring(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf("@");

            if (lastAtIndex === -1) {
                setShowMentions(false);
                return;
            }

            // Check if @ is at the start or after a space
            const isValidMentionStart = lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ";
            if (!isValidMentionStart) {
                setShowMentions(false);
                return;
            }

            // Get the search query after @
            const searchQuery = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();

            // Filter members based on query
            if (searchQuery.length === 0) {
                console.log(`📍 CommentInput: Digitou @, mostrando todos os ${members.length} membros`);
                setFilteredMembers(members);
            } else {
                const filtered = members.filter(
                    (member) =>
                        member.name.toLowerCase().includes(searchQuery) ||
                        member.email.toLowerCase().includes(searchQuery)
                );
                console.log(`🔍 CommentInput: Procurando por "${searchQuery}", encontrados ${filtered.length} membros`);
                setFilteredMembers(filtered);
            }

            setMentionStart(lastAtIndex);
            setShowMentions(true);
        },
        [members]
    );

    // Handle selecting a member from dropdown
    const handleSelectMember = (member: User) => {
        // Extract username from email (part before @)
        const username = member.email.split('@')[0];
        console.log(`✅ CommentInput: Selecionado membro: ${member.name} (${member.email}) → username: ${username}`);

        const textBeforeMention = content.substring(0, mentionStart);
        const textAfterMention = content.substring(mentionStart + 1);

        // Remove the search query after @ and insert member mention with username
        const afterAtIndex = textAfterMention.indexOf(" ");
        const cleanAfterMention = afterAtIndex === -1 ? "" : textAfterMention.substring(afterAtIndex);

        // Insert username with a space after to close the mention
        const newContent = `${textBeforeMention}@${username} ${cleanAfterMention}`;
        setContent(newContent);
        setShowMentions(false);

        // Focus back on input and set cursor position
        if (inputRef.current) {
            inputRef.current.focus();
            // Cursor position is after the space we just added
            const newCursorPos = textBeforeMention.length + username.length + 2; // +1 for @, +1 for space
            setTimeout(() => {
                // Get the actual input element inside the TextField
                const inputElement = inputRef.current?.querySelector('input') as HTMLInputElement;
                if (inputElement && inputElement.setSelectionRange) {
                    inputElement.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        }
    };

    // Handle submitting comment
    const handleSubmit = async () => {
        if (!content.trim() || loading) return;

        try {
            setLoading(true);
            console.log(`📝 CommentInput: Enviando comentário:`, content);
            await onSubmit(content);
            setContent("");
        } catch (error) {
            console.error("Erro ao enviar comentário:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle key press (Enter to submit, only if mentions dropdown is closed)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Only send if Enter is pressed, not Shift+Enter, and mentions are NOT showing
        if (e.key === "Enter" && !e.shiftKey && !showMentions) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", width: "100%", position: "relative" }}>
            <Box
                ref={textFieldContainerRef}
                sx={{ flex: 1, position: "relative" }}
            >
                <TextField
                    ref={inputRef}
                    fullWidth
                    multiline
                    maxRows={4}
                    value={content}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || loading}
                    placeholder={placeholder}
                    variant="outlined"
                    size="small"
                />

                {/* Mentions Dropdown */}
                <Popper
                    open={showMentions && filteredMembers.length > 0}
                    anchorEl={inputRef.current}
                    placement="top-start"
                    style={{ zIndex: 1300 }}
                    modifiers={[
                        {
                            name: "offset",
                            options: {
                                offset: [0, 8],
                            },
                        },
                        {
                            name: "preventOverflow",
                            options: {
                                padding: 8,
                            },
                        },
                    ]}
                >
                    <Paper
                        sx={{
                            maxHeight: 250,
                            overflow: "auto",
                            minWidth: 300,
                            boxShadow: 3,
                        }}
                    >
                        {loadingMembers ? (
                            <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <List sx={{ py: 0 }}>
                                {filteredMembers.map((member) => (
                                    <ListItem
                                        key={member.id}
                                        onClick={() => handleSelectMember(member)}
                                        sx={{
                                            cursor: "pointer",
                                            py: 1,
                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        }}
                                    >
                                        <ListItemText
                                            primary={member.name}
                                            secondary={member.email}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                            }}
                                            secondaryTypographyProps={{
                                                variant: "caption",
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Popper>
            </Box>

            <IconButton
                color="primary"
                onClick={handleSubmit}
                disabled={!content.trim() || loading || disabled}
                size="small"
            >
                {loading ? <CircularProgress size={24} /> : <SendOutlined />}
            </IconButton>
        </Box>
    );
}
