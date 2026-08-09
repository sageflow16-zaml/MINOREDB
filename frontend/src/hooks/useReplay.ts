import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStableQuery } from './useStableQuery';
import {replayService} from '../api/replay';

export const useFetchCandles = (projectId: string) => {
  return useMutation({
    mutationFn: (data: { symbol: string; timeframe: string; start_date?: string; end_date?: string; force?: boolean }) =>
      replayService.fetchCandles(projectId, data),
  });
};

export const useCreateSession = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pair: string; timeframe: string; start_date: string; end_date: string; notes?: string }) =>
      replayService.createSession(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['replay-sessions', projectId] });
      qc.invalidateQueries({ queryKey: ['replay-dashboard', projectId] });
    },
  });
};

export const useReplaySessions = (projectId: string) =>
  useStableQuery({
    queryKey: ['replay-sessions', projectId],
    queryFn: () => replayService.listSessions(projectId),
    enabled: !!projectId,
  });

export const useReplayState = (projectId: string, sessionId: string | null) =>
  useStableQuery({
    queryKey: ['replay-state', projectId, sessionId],
    queryFn: () => replayService.getSession(projectId, sessionId!),
    enabled: !!sessionId,
    refetchOnMount: false,
  });

export const useNextCandle = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => replayService.nextCandle(projectId, sessionId),
    onSuccess: (data) => {
      if (data?.session?.id) {
        qc.setQueryData(['replay-state', projectId, data.session.id], data);
      }
    },
  });
};

export const usePrevCandle = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => replayService.prevCandle(projectId, sessionId),
    onSuccess: (data) => {
      if (data?.session?.id) {
        qc.setQueryData(['replay-state', projectId, data.session.id], data);
      }
    },
  });
};

export const useJumpToCandle = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, candleIndex }: { sessionId: string; candleIndex: number }) =>
      replayService.jumpToCandle(projectId, sessionId, candleIndex),
    onSuccess: (data) => {
      if (data?.session?.id) {
        qc.setQueryData(['replay-state', projectId, data.session.id], data);
      }
    },
  });
};

export const usePauseSession = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => replayService.pauseSession(projectId, sessionId),
    onSuccess: (data) => {
      qc.setQueryData(['replay-state', projectId, data.id], (old: any) => old ? { ...old, session: data } : old);
      qc.invalidateQueries({ queryKey: ['replay-sessions', projectId] });
    },
  });
};

export const useResumeSession = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => replayService.resumeSession(projectId, sessionId),
    onSuccess: (data) => {
      qc.setQueryData(['replay-state', projectId, data.id], (old: any) => old ? { ...old, session: data } : old);
      qc.invalidateQueries({ queryKey: ['replay-sessions', projectId] });
    },
  });
};

export const useFinishSession = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => replayService.finishSession(projectId, sessionId),
    onSuccess: (data) => {
      qc.setQueryData(['replay-state', projectId, data.id], (old: any) => old ? { ...old, session: data } : old);
      qc.invalidateQueries({ queryKey: ['replay-sessions', projectId] });
      qc.invalidateQueries({ queryKey: ['replay-dashboard', projectId] });
    },
  });
};

export const useCreateTrade = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string; direction: string; entry_price: number; stop_loss?: number; take_profit?: number; position_size?: number; risk_percent?: number; notes?: string; confidence?: number }) =>
      replayService.createTrade(projectId, sessionId, data),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] });
      qc.invalidateQueries({ queryKey: ['replay-dashboard', projectId] });
    },
  });
};

export const useCreateBookmark = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string; candle_index: number; date: string; note?: string }) =>
      replayService.createBookmark(projectId, sessionId, data),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] });
    },
  });
};

export const useDeleteBookmark = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, bookmarkId }: { sessionId: string; bookmarkId: string }) =>
      replayService.deleteBookmark(projectId, bookmarkId).then(() => ({ sessionId, bookmarkId })),
    onSuccess: ({ sessionId }) => {
      qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] });
    },
  });
};

export const useUpdateBookmark = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookmarkId, note }: { sessionId: string; bookmarkId: string; note: string }) =>
      replayService.updateBookmark(projectId, bookmarkId, note),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] });
    },
  });
};

export const useReplayDashboard = (projectId: string) =>
  useStableQuery({
    queryKey: ['replay-dashboard', projectId],
    queryFn: () => replayService.getDashboard(projectId),
    enabled: !!projectId,
  });

// ── Annotations ──

export const useCreateAnnotation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string; candle_index: number; annotation_type: string; content?: Record<string, unknown>; color?: string; label?: string }) =>
      replayService.createAnnotation(projectId, sessionId, data),
    onSuccess: (_data, { sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

export const useUpdateAnnotation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, annotationId, ...data }: { sessionId: string; annotationId: string; content?: Record<string, unknown>; color?: string; label?: string }) =>
      replayService.updateAnnotation(projectId, annotationId, data),
    onSuccess: (_data, { sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

export const useDeleteAnnotation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, annotationId }: { sessionId: string; annotationId: string }) =>
      replayService.deleteAnnotation(projectId, annotationId).then(() => ({ sessionId })),
    onSuccess: ({ sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

// ── Review ──

export const useUpsertReview = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string } & Record<string, unknown>) =>
      replayService.upsertReview(projectId, sessionId, data),
    onSuccess: (_data, { sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

// ── Mistakes ──

export const useCreateMistake = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string; mistake_type?: string; severity?: string; description?: string; candle_index?: number; preventable?: boolean; recommendation?: string }) =>
      replayService.createMistake(projectId, sessionId, data),
    onSuccess: (_data, { sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

export const useDeleteMistake = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, mistakeId }: { sessionId: string; mistakeId: string }) =>
      replayService.deleteMistake(projectId, mistakeId).then(() => ({ sessionId })),
    onSuccess: ({ sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

// ── Screenshots ──

export const useCreateScreenshot = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string; candle_index: number; category?: string; image_url?: string; caption?: string }) =>
      replayService.createScreenshot(projectId, sessionId, data),
    onSuccess: (_data, { sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};

export const useDeleteScreenshot = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, screenshotId }: { sessionId: string; screenshotId: string }) =>
      replayService.deleteScreenshot(projectId, screenshotId).then(() => ({ sessionId })),
    onSuccess: ({ sessionId }) => qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] }),
  });
};
