import client from './client';
import type { ExecutionResponse, ExecutionListItem, PaginatedResponse } from '../types';

export interface ExecutionCreatePayload {
  input_data: { message: string; [key: string]: unknown };
}

export const executionsApi = {
  run: (agentId: string, data: ExecutionCreatePayload) =>
    client.post<ExecutionResponse>(`/agents/${agentId}/execute`, data).then(r => r.data),

  list: (agentId?: string, page = 1, page_size = 20) =>
    client.get<PaginatedResponse<ExecutionListItem>>('/executions', {
      params: { agent_id: agentId, page, page_size }
    }).then(r => r.data),

  get: (id: string) =>
    client.get<ExecutionResponse>(`/executions/${id}`).then(r => r.data),

  cancel: (id: string) =>
    client.post<ExecutionResponse>(`/executions/${id}/cancel`).then(r => r.data),

  tools: () =>
    client.get<{ tools: { name: string; description: string; requires_approval: boolean }[] }>('/tools').then(r => r.data),

  streamUrl: (id: string) => `/api/v1/executions/${id}/stream`,
};
