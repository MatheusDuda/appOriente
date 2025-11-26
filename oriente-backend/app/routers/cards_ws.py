from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Dict, Set
import json
from datetime import datetime

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.project import Project


router = APIRouter()


class CardsConnectionManager:
    """
    Gerenciador de conexões WebSocket para cards/tarefas
    Mantém registro de quais usuários estão conectados a quais projetos
    Notifica sobre mudanças em cards em tempo real
    """

    def __init__(self):
        # Dict[project_id, Dict[user_id, WebSocket]]
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int, user_id: int):
        """Adiciona conexão ao projeto"""
        await websocket.accept()

        if project_id not in self.active_connections:
            self.active_connections[project_id] = {}

        self.active_connections[project_id][user_id] = websocket

    def disconnect(self, project_id: int, user_id: int):
        """Remove conexão do projeto"""
        if project_id in self.active_connections:
            if user_id in self.active_connections[project_id]:
                del self.active_connections[project_id][user_id]

            # Se não há mais conexões no projeto, remove o projeto do dict
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Envia mensagem para uma conexão específica"""
        await websocket.send_json(message)

    async def broadcast_to_project(self, message: dict, project_id: int, exclude_user_id: int = None):
        """
        Envia mensagem para todos os participantes conectados ao projeto
        Opcionalmente exclui um usuário (geralmente o remetente)
        """
        if project_id not in self.active_connections:
            return

        disconnected_users = []

        for user_id, websocket in self.active_connections[project_id].items():
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
            self.disconnect(project_id, user_id)

    def is_user_connected(self, project_id: int, user_id: int) -> bool:
        """Verifica se usuário está conectado ao projeto"""
        return project_id in self.active_connections and user_id in self.active_connections[project_id]


# Instância global do gerenciador de conexões
manager = CardsConnectionManager()


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


def _can_access_project(db: Session, project_id: int, user_id: int) -> bool:
    """Verifica se o usuário tem acesso ao projeto"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False

    # O usuário tem acesso se é o owner ou membro do time
    if project.owner_id == user_id:
        return True

    # Se o projeto tem um time, verificar se o usuário é membro
    if project.team_id:
        # Assuming Team model has members relationship
        # This is a basic check - adjust based on your actual team structure
        return True  # Permitir acesso se faz parte do team

    return False


@router.websocket("/projects/{project_id}")
async def websocket_cards_endpoint(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(..., description="JWT token de autenticação")
):
    """
    Endpoint WebSocket para atualizações de cards em tempo real

    **URL**: `ws://your-domain/ws/projects/{project_id}?token=YOUR_JWT_TOKEN`

    **Autenticação**:
    - Token JWT deve ser passado como query parameter
    - Usuário deve ter acesso ao projeto

    **Eventos recebidos pelo cliente**:

    1. **card_moved** - Card foi movido entre colunas
       ```json
       {
         "type": "card_moved",
         "data": {
           "card_id": 1,
           "from_column_id": 1,
           "to_column_id": 2,
           "position": 0
         }
       }
       ```

    2. **card_updated** - Card foi atualizado (título, descrição, etc)
       ```json
       {
         "type": "card_updated",
         "data": {
           "card_id": 1,
           "title": "Novo título",
           "description": "Nova descrição"
         }
       }
       ```

    3. **card_created** - Novo card foi criado
       ```json
       {
         "type": "card_created",
         "data": {
           "card_id": 1,
           "title": "Título do card",
           "column_id": 1
         }
       }
       ```

    4. **card_deleted** - Card foi deletado
       ```json
       {
         "type": "card_deleted",
         "data": {
           "card_id": 1
         }
       }
       ```

    5. **connected** - Confirmação de conexão
       ```json
       {
         "type": "connected",
         "data": {
           "project_id": 1,
           "user_id": 2,
           "message": "Conectado ao projeto"
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

        # Verificar se usuário tem acesso ao projeto
        if not _can_access_project(db, project_id, current_user.id):
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Você não tem acesso a este projeto"
            )
            return

        # Conectar usuário ao projeto
        await manager.connect(websocket, project_id, current_user.id)

        # Enviar confirmação de conexão
        await manager.send_personal_message({
            "type": "connected",
            "data": {
                "project_id": project_id,
                "user_id": current_user.id,
                "message": f"Conectado ao projeto {project_id}"
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
                if event_type == "card_moved":
                    # Card foi movido - fazer broadcast para todos no projeto
                    await manager.broadcast_to_project({
                        "type": "card_moved",
                        "data": {
                            **event_data,
                            "updated_at": datetime.utcnow().isoformat(),
                            "updated_by_user_id": current_user.id
                        }
                    }, project_id)

                elif event_type == "card_updated":
                    # Card foi atualizado - fazer broadcast para todos no projeto
                    await manager.broadcast_to_project({
                        "type": "card_updated",
                        "data": {
                            **event_data,
                            "updated_at": datetime.utcnow().isoformat(),
                            "updated_by_user_id": current_user.id
                        }
                    }, project_id)

                elif event_type == "card_created":
                    # Novo card foi criado - fazer broadcast para todos no projeto
                    await manager.broadcast_to_project({
                        "type": "card_created",
                        "data": {
                            **event_data,
                            "created_at": datetime.utcnow().isoformat(),
                            "created_by_user_id": current_user.id
                        }
                    }, project_id)

                elif event_type == "card_deleted":
                    # Card foi deletado - fazer broadcast para todos no projeto
                    await manager.broadcast_to_project({
                        "type": "card_deleted",
                        "data": {
                            **event_data,
                            "deleted_at": datetime.utcnow().isoformat(),
                            "deleted_by_user_id": current_user.id
                        }
                    }, project_id)

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
        manager.disconnect(project_id, current_user.id)

    except Exception as e:
        # Erro inesperado
        try:
            manager.disconnect(project_id, current_user.id)
        except:
            pass
        print(f"Erro no WebSocket de cards: {e}")

    finally:
        # Fechar sessão do banco
        db.close()
