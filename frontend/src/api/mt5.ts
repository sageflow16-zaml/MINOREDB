import { callEdgeFunction } from '../lib/edgeFunctions';
import type { MT5StatusResponse, MT5ConnectRequest, BrokerConnection, MT5SyncResponse, TradeSyncLog } from './types';

export const mt5Service = {
  status: (): Promise<MT5StatusResponse> =>
    callEdgeFunction('mt5', { operation: 'status' }),

  connect: (req: MT5ConnectRequest): Promise<BrokerConnection> =>
    callEdgeFunction('mt5', { operation: 'connect', data: req as any }),

  disconnect: (): Promise<BrokerConnection | null> =>
    callEdgeFunction('mt5', { operation: 'disconnect' }),

  sync: (projectId: string, mode: string = 'incremental'): Promise<MT5SyncResponse> =>
    callEdgeFunction('mt5', { operation: 'sync', project_id: projectId, data: { mode } }),

  logs: (_limit: number = 100): Promise<TradeSyncLog[]> => {
    throw new Error('MT5 logs require Edge Function deployment');
  },
};
