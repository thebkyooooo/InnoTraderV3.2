import { axiosInstance } from '@/shared/api/axios-instance'

export const broadcastApi = {
  getInterval: () =>
    axiosInstance.get<{ ms: number }>('/api/admin/broadcast/interval'),

  setInterval: (ms: number) =>
    axiosInstance.post<{ ms: number }>('/api/admin/broadcast/interval', { ms }),
}
