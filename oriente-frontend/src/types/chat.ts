export type Mensagem = {
    id: number;
    texto: string;
    remetente: string;
    timestamp: string;
    lida: boolean;
};

export type Conversa = {
    id: number;
    nome: string;
    avatar?: string;
    ultimaMensagem: string;
    timestamp: string;
    naoLidas: number;
    online: boolean;
    tipo: "individual" | "grupo";
    mensagens: Mensagem[];
};
