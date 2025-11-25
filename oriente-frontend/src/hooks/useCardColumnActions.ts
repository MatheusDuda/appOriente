import { useState } from 'react';
import type { Card } from '../types';
import type { KanbanColumn } from '../types';
import cardService from '../services/cardService';

interface UseCardColumnActionsProps {
    card: Card | null;
    columns: KanbanColumn[];
    projectId: number;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

interface UseCardColumnActionsReturn {
    completeTask: () => Promise<void>;
    resumeTask: () => Promise<void>;
    canComplete: boolean;
    canResume: boolean;
    isFirstColumn: boolean;
    isLastColumn: boolean;
    isLoading: boolean;
}

export const useCardColumnActions = ({
    card,
    columns,
    projectId,
    onSuccess,
    onError
}: UseCardColumnActionsProps): UseCardColumnActionsReturn => {
    const [isLoading, setIsLoading] = useState(false);

    // Ordenar colunas por posição para identificar primeira e última
    const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

    const firstColumn = sortedColumns[0];
    const lastColumn = sortedColumns[sortedColumns.length - 1];

    // Verificar posição atual da tarefa - com validação para null
    const isFirstColumn = card && firstColumn ? card.column_id === firstColumn.id : false;
    const isLastColumn = card && lastColumn ? card.column_id === lastColumn.id : false;

    // Botão "Concluir" aparece se NÃO está na última coluna
    const canComplete = !isLastColumn && sortedColumns.length > 0;

    // Botão "Retomar" aparece se está na última coluna
    const canResume = isLastColumn && sortedColumns.length > 1;

    /**
     * Move a tarefa para a última coluna (concluir)
     */
    const completeTask = async () => {
        if (!canComplete || !lastColumn || !card) return;

        setIsLoading(true);
        try {
            // Calcular nova posição (final da coluna de destino)
            const newPosition = lastColumn.cards?.length || 0;
            await cardService.moveCard(projectId, String(card.id), lastColumn.id, newPosition);
            onSuccess?.();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || 'Erro ao concluir tarefa';
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Move a tarefa para a primeira coluna (retomar)
     */
    const resumeTask = async () => {
        if (!canResume || !firstColumn || !card) return;

        setIsLoading(true);
        try {
            // Calcular nova posição (final da coluna de destino)
            const newPosition = firstColumn.cards?.length || 0;
            await cardService.moveCard(projectId, String(card.id), firstColumn.id, newPosition);
            onSuccess?.();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || 'Erro ao retomar tarefa';
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        completeTask,
        resumeTask,
        canComplete,
        canResume,
        isFirstColumn,
        isLastColumn,
        isLoading
    };
};
