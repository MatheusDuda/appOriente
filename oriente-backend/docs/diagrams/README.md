# Diagramas do Projeto Oriente Backend

Esta pasta contém diagramas gerados automaticamente que documentam a estrutura do banco de dados e das classes do projeto.

## 📊 Diagramas Disponíveis

### 1. [Diagrama ER (Entity-Relationship)](./er-diagram.md)
Visualiza a estrutura completa do banco de dados, incluindo:
- **14 entidades** (tabelas do banco)
- Atributos com tipos de dados
- Chaves primárias (PK) e estrangeiras (FK)
- Relacionamentos entre entidades (1:N, N:M)
- Campos obrigatórios (NOT NULL)

**Use quando precisar:**
- Entender a estrutura do banco de dados
- Analisar relacionamentos entre tabelas
- Planejar migrations ou alterações no schema
- Documentar o modelo de dados para novos desenvolvedores

### 2. [Diagrama UML (Classes)](./uml-diagram.md)
Mostra a arquitetura de classes Python, incluindo:
- Todas as classes SQLAlchemy (models)
- Atributos com tipos Python
- Relacionamentos entre classes
- Cardinalidades (1:*, *:*)

**Use quando precisar:**
- Entender a estrutura de código Python
- Visualizar herança e composição
- Analisar dependências entre classes
- Revisar a arquitetura do projeto

## 🔄 Regenerando os Diagramas

Os diagramas são gerados automaticamente a partir do código usando o script `generate_diagrams.py`.

### Como executar

```bash
# A partir da raiz do projeto backend
cd oriente-backend

# Executar o script
python generate_diagrams.py
```

### Quando regenerar

Execute o script sempre que fizer alterações em:
- Models SQLAlchemy (`app/models/*.py`)
- Relacionamentos entre entidades
- Adição ou remoção de tabelas
- Alterações em campos importantes

**Recomendação:** Adicione ao seu workflow de desenvolvimento:
```bash
# Após modificar models
python generate_diagrams.py
git add docs/diagrams/
git commit -m "docs: Atualiza diagramas após mudanças nos models"
```

## 👀 Como Visualizar os Diagramas

Os diagramas usam formato **Mermaid**, que é suportado nativamente em várias plataformas:

### Opção 1: GitHub (recomendado)
1. Abra os arquivos `.md` diretamente no GitHub
2. O diagrama será renderizado automaticamente
3. **Mais fácil para revisão de código e documentação**

### Opção 2: VS Code
1. Instale a extensão: [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
2. Abra o arquivo `.md`
3. Use `Cmd/Ctrl + Shift + V` para preview
4. **Melhor para desenvolvimento local**

### Opção 3: Mermaid Live Editor
1. Acesse: https://mermaid.live
2. Copie o código entre ` ```mermaid` e ` ``` `
3. Cole no editor
4. **Útil para edição e exportação personalizada**

### Opção 4: Exportar para PNG/SVG
```bash
# Instalar Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Gerar PNG
mmdc -i docs/diagrams/er-diagram.md -o docs/diagrams/er-diagram.png

# Gerar SVG (recomendado para documentação)
mmdc -i docs/diagrams/uml-diagram.md -o docs/diagrams/uml-diagram.svg
```

## 🏗️ Estrutura do Projeto

```
oriente-backend/
├── generate_diagrams.py      # Script de geração automática
├── docs/
│   └── diagrams/
│       ├── README.md          # Este arquivo
│       ├── er-diagram.md      # Diagrama Entity-Relationship
│       └── uml-diagram.md     # Diagrama UML de Classes
└── app/
    └── models/                # Models analisados pelo script
        ├── user.py
        ├── team.py
        ├── project.py
        ├── Card.py
        ├── Column.py
        ├── comment.py
        ├── notification.py
        ├── chat.py
        └── ...
```

## 🔧 Detalhes Técnicos

### Models Analisados

O script analisa automaticamente os seguintes models:

1. **User** - Usuários do sistema
2. **Team** - Equipes e membros
3. **Project** - Projetos e suas configurações
4. **KanbanColumn** - Colunas do quadro Kanban
5. **Card** - Cards/tarefas do projeto
6. **Tag** - Tags para organização de cards
7. **Comment** - Comentários em cards
8. **CommentMention** - Menções em comentários
9. **CommentAudit** - Auditoria de comentários deletados
10. **Attachment** - Anexos de cards
11. **CardHistory** - Histórico de alterações em cards
12. **Notification** - Sistema de notificações
13. **Chat** - Chats entre usuários
14. **ChatMessage** - Mensagens de chat

### Relacionamentos Detectados

O script identifica automaticamente:

- **One-to-Many (1:N)**: Ex: User → Projects, Project → Cards
- **Many-to-Many (N:M)**: Ex: User ↔ Team, Card ↔ Tag
- **Many-to-One (N:1)**: Ex: Card → Column, Comment → User

### Tipos de Dados

Mapeamento SQLAlchemy → Python:
- `INTEGER/BIGINT` → `int`
- `VARCHAR/TEXT` → `str`
- `BOOLEAN` → `bool`
- `DATETIME/TIMESTAMP` → `datetime`
- `Enum` → Nome do enum (ex: `UserRole`, `CardPriority`)

## 📚 Referências

- [Documentação Mermaid](https://mermaid.js.org/)
- [ER Diagrams em Mermaid](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)
- [Class Diagrams em Mermaid](https://mermaid.js.org/syntax/classDiagram.html)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## 🤝 Contribuindo

Ao adicionar novos models ou modificar relacionamentos:

1. Faça suas alterações nos arquivos de model
2. Execute `python generate_diagrams.py`
3. Revise os diagramas gerados
4. Commit os diagramas atualizados junto com suas mudanças

Isso mantém a documentação sempre sincronizada com o código!

---

*Diagramas gerados automaticamente pelo script `generate_diagrams.py`*
*Última atualização: Veja timestamp nos arquivos individuais*
