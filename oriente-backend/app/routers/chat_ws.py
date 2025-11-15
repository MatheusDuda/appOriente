from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Dict, Set
import json
from datetime import datetime

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.schemas.chat import ChatMessageCreate, WebSocketMessage
from app.services.chat_service import ChatService
from app.services.chat_message_service import ChatMessageService


router = APIRouter()


class ConnectionManager:
    """
    Gerenciador de conexões WebSocket
    Mantém registro de quais usuários estão conectados a quais chats
    """

    def __init__(self):
        # Dict[chat_id, Dict[user_id, WebSocket]]
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, chat_id: int, user_id: int):
        """Adiciona conexão ao chat"""
        await websocket.accept()

        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}

        self.active_connections[chat_id][user_id] = websocket

    def disconnect(self, chat_id: int, user_id: int):
        """Remove conexão do chat"""
        if chat_id in self.active_connections:
            if user_id in self.active_connections[chat_id]:
                del self.active_connections[chat_id][user_id]

            # Se não há mais conexões no chat, remove o chat do dict
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Envia mensagem para uma conexão específica"""
        await websocket.send_json(message)

    async def broadcast_to_chat(self, message: dict, chat_id: int, exclude_user_id: int = None):
        """
        Envia mensagem para todos os participantes conectados ao chat
        Opcionalmente exclui um usuário (geralmente o remetente)
        """
        if chat_id not in self.active_connections:
            return

        disconnected_users = []

        for user_id, websocket in self.active_connections[chat_id].items():
            # Pular usuário excluído (geralmente o remetente)
            if exclude_user_id and user_id == exclude_user_id:
                continue

            try:
                await websocket.send_json(message)
            except Exception:
                # Se falhar ao enviar, marcar para desconexão
                disconnected_users.append(user_id)

        # Remover conexões que falharam
        for user_id in disconnected_users:
            self.disconnect(chat_id, user_id)

    def is_user_connected(self, chat_id: int, user_id: int) -> bool:
        """Verifica se usuário está conectado ao chat"""
        return chat_id in self.active_connections and user_id in self.active_connections[chat_id]


# Instância global do gerenciador de conexões
manager = ConnectionManager()


async def get_current_user_ws(
    token: str = Query(..., description="JWT token de autenticação"),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência para autenticação via WebSocket
    Token é passado como query parameter
    """
    try:
        payload = decode_access_token(token)
        if not payload:
            raise Exception("Token inválido")

        user_id = payload.get("sub")

        if not user_id:
            raise Exception("Token inválido")

        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user:
            raise Exception("Usuário não encontrado")

        return user

    except Exception as e:
        raise Exception(f"Falha na autenticação: {str(e)}")


@router.websocket("/chat/{chat_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    chat_id: int,
    token: str = Query(..., description="JWT token de autenticação")
):
    """
    Endpoint WebSocket para chat em tempo real

    **URL**: `ws://your-domain/ws/chat/{chat_id}?token=YOUR_JWT_TOKEN`

    **Autenticação**:
    - Token JWT deve ser passado como query parameter
    - Usuário deve ser participante do chat

    **Eventos enviados pelo cliente**:

    1. **message** - Enviar mensagem
       ```json
       {
         "type": "message",
         "data": {
           "content": "Olá!"
         }
       }
       ```

    2. **typing** - Notificar que está digitando
       ```json
       {
         "type": "typing",
         "data": {
           "is_typing": true
         }
       }
       ```

    3. **read** - Marcar mensagens como lidas
       ```json
       {
         "type": "read",
         "data": {}
       }
       ```

    **Eventos recebidos pelo cliente**:

    1. **message** - Nova mensagem
       ```json
       {
         "type": "message",
         "data": {
           "id": 1,
           "content": "Olá!",
           "sender": {...},
           "created_at": "2024-01-01T00:00:00Z",
           ...
         }
       }
       ```

    2. **typing** - Alguém está digitando
       ```json
       {
         "type": "typing",
         "data": {
           "user_id": 2,
           "user_name": "João",
           "is_typing": true
         }
       }
       ```

    3. **read** - Alguém leu mensagens
       ```json
       {
         "type": "read",
         "data": {
           "user_id": 2,
           "user_name": "João",
           "timestamp": "2024-01-01T00:00:00Z"
         }
       }
       ```

    4. **error** - Erro
       ```json
       {
         "type": "error",
         "data": {
           "message": "Mensagem de erro"
         }
       }
       ```

    5. **connected** - Confirmação de conexão
       ```json
       {
         "type": "connected",
         "data": {
           "chat_id": 1,
           "user_id": 2,
           "message": "Conectado ao chat"
         }
       }
       ```
    """

    # Criar sessão do banco de dados
    db = next(get_db())

    try:
        # Autenticar usuário
        try:
            current_user = await get_current_user_ws(token, db)
        except Exception as e:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=str(e))
            return

        # Verificar se usuário tem acesso ao chat
        if not ChatService._can_access_chat(db, chat_id, current_user.id):
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Você não tem acesso a este chat"
            )
            return

        # Conectar usuário ao chat
        await manager.connect(websocket, chat_id, current_user.id)

        # Enviar confirmação de conexão
        await manager.send_personal_message({
            "type": "connected",
            "data": {
                "chat_id": chat_id,
                "user_id": current_user.id,
                "message": f"Conectado ao chat {chat_id}"
            }
        }, websocket)

        # Loop principal: receber e processar mensagens
        while True:
            # Receber dados do cliente
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                event_type = message.get("type")
                event_data = message.get("data", {})

                # Processar eventos
                if event_type == "message":
                    # Enviar mensagem
                    content = event_data.get("content")

                    if not content or not content.strip():
                        await manager.send_personal_message({
                            "type": "error",
                            "data": {"message": "Conteúdo da mensagem não pode ser vazio"}
                        }, websocket)
                        continue

                    # Criar mensagem no banco
                    message_create = ChatMessageCreate(content=content.strip())
                    message_response = ChatMessageService.send_message(
                        db, chat_id, message_create, current_user.id
                    )

                    # Broadcast para todos os participantes do chat
                    await manager.broadcast_to_chat({
                        "type": "message",
                        "data": message_response.model_dump()
                    }, chat_id)

                elif event_type == "typing":
                    # Notificar que está digitando
                    is_typing = event_data.get("is_typing", True)

                    # Broadcast para outros participantes (exceto remetente)
                    await manager.broadcast_to_chat({
                        "type": "typing",
                        "data": {
                            "user_id": current_user.id,
                            "user_name": current_user.name,
                            "is_typing": is_typing
                        }
                    }, chat_id, exclude_user_id=current_user.id)

                elif event_type == "read":
                    # Marcar como lido
                    ChatService.update_last_read(db, chat_id, current_user.id)

                    # Broadcast para outros participantes (exceto remetente)
                    await manager.broadcast_to_chat({
                        "type": "read",
                        "data": {
                            "user_id": current_user.id,
                            "user_name": current_user.name,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    }, chat_id, exclude_user_id=current_user.id)

                else:
                    # Evento desconhecido
                    await manager.send_personal_message({
                        "type": "error",
                        "data": {"message": f"Tipo de evento desconhecido: {event_type}"}
                    }, websocket)

            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "data": {"message": "Formato JSON inválido"}
                }, websocket)

            except Exception as e:
                await manager.send_personal_message({
                    "type": "error",
                    "data": {"message": f"Erro ao processar evento: {str(e)}"}
                }, websocket)

    except WebSocketDisconnect:
        # Usuário desconectou
        manager.disconnect(chat_id, current_user.id)

    except Exception as e:
        # Erro inesperado
        manager.disconnect(chat_id, current_user.id)
        print(f"Erro no WebSocket: {e}")

    finally:
        # Fechar sessão do banco
        db.close()
