/**
 * Parser para detectar e extrair links de tarefas do padrão Oriente
 * Padrão suportado: /projetos/:projectId/tarefas/:cardId
 */

export interface TaskLink {
  projectId: string;
  cardId: string;
  fullUrl: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedMessage {
  hasTaskLinks: boolean;
  taskLinks: TaskLink[];
  originalContent: string;
}

/**
 * Detecta links de tarefas no conteúdo da mensagem
 * @param content - Conteúdo da mensagem de chat
 * @returns Objeto contendo informações dos links encontrados
 */
export function parseTaskLinks(content: string): ParsedMessage {
  const taskLinks: TaskLink[] = [];

  // Regex para detectar o padrão /projetos/:projectId/tarefas/:cardId
  // Aceita tanto números quanto strings como IDs
  const taskLinkRegex = /\/projetos\/(\d+)\/tarefas\/(\d+)/g;

  let match;
  while ((match = taskLinkRegex.exec(content)) !== null) {
    const projectId = match[1];
    const cardId = match[2];
    const fullUrl = match[0];

    taskLinks.push({
      projectId,
      cardId,
      fullUrl,
      startIndex: match.index,
      endIndex: match.index + fullUrl.length,
    });
  }

  return {
    hasTaskLinks: taskLinks.length > 0,
    taskLinks,
    originalContent: content,
  };
}

/**
 * Verifica se um texto é um link de tarefa
 * @param text - Texto a verificar
 * @returns true se o texto é um link de tarefa válido
 */
export function isTaskLink(text: string): boolean {
  const taskLinkRegex = /^\/projetos\/(\d+)\/tarefas\/(\d+)$/;
  return taskLinkRegex.test(text);
}

/**
 * Extrai IDs do link de tarefa
 * @param url - URL do link de tarefa
 * @returns Objeto com projectId e cardId, ou null se não for um link válido
 */
export function extractTaskIds(url: string): { projectId: string; cardId: string } | null {
  const taskLinkRegex = /\/projetos\/(\d+)\/tarefas\/(\d+)/;
  const match = url.match(taskLinkRegex);

  if (match) {
    return {
      projectId: match[1],
      cardId: match[2],
    };
  }

  return null;
}
