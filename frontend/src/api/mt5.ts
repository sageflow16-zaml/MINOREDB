import api from '../services/api';
import type {
  BrokerConnection,
  TradeSyncLog,
  MT5StatusResponse,
  MT5ConnectRequest,
  MT5SyncResponse,
} from './types';

const BASE = '/mt5';

export const mt5Service = {
  status: () =>
    api.get<MT5StatusResponse>(`${BASE}/status`).then((r) => r.data),

  connect: (req: MT5ConnectRequest) =>
    api.post<BrokerConnection>(`${BASE}/connect`, req).then((r) => r.data),

  disconnect: () =>
    api.post<BrokerConnection | null>(`${BASE}/disconnect`).then((r) => r.data),

  sync: (projectId: string, mode: string = 'incremental') =>
    api.post<MT5SyncResponse>(`${BASE}/sync`, { mode }, { params: { project_id: projectId } }).then((r) => r.data),

  logs: (limit: number = 100) =>
    api.get<TradeSyncLog[]>(`${BASE}/logs`, { params: { limit } }).then((r) => r.data),
};
