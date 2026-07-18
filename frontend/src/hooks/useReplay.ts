import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { replayService, type ReplaySession, type ReplayState, type ReplayBookmark, type MarketCandle } from '../api/replay';

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
  useQuery({
    queryKey: ['replay-sessions', projectId],
    queryFn: () => replayService.listSessions(projectId),
    enabled: !!projectId,
  });

export const useReplayState = (projectId: string, sessionId: string | null) =>
  useQuery({
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
      qc.setQueryData(['replay-state', projectId, data.session.id], data);
    },
  });
};

export const usePrevCandle = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => replayService.prevCandle(projectId, sessionId),
    onSuccess: (data) => {
      qc.setQueryData(['replay-state', projectId, data.session.id], data);
    },
  });
};

export const useJumpToCandle = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, candleIndex }: { sessionId: string; candleIndex: number }) =>
      replayService.jumpToCandle(projectId, sessionId, candleIndex),
    onSuccess: (data) => {
      qc.setQueryData(['replay-state', projectId, data.session.id], data);
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
    onSuccess: (data) => {
      qc.setQueryData(['replay-state', projectId, data.session.id], data);
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
    mutationFn: ({ sessionId, bookmarkId, note }: { sessionId: string; bookmarkId: string; note: string }) =>
      replayService.updateBookmark(projectId, bookmarkId, note),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['replay-state', projectId, sessionId] });
    },
  });
};

export const useReplayDashboard = (projectId: string) =>
  useQuery({
    queryKey: ['replay-dashboard', projectId],
    queryFn: () => replayService.getDashboard(projectId),
    enabled: !!projectId,
  });
