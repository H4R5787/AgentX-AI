import client from './client';
import type { Agent, AgentListItem, PaginatedResponse } from '../types';

export interface AgentCreatePayload {
  name: string;
  description?: string;
  system_prompt?: string;
  model_provider: string;
  model_name: string;
  temperature: number;
  max_tokens?: number;
}

export const agentsApi = {
  list: (page = 1, page_size = 20) =>
    client.get<PaginatedResponse<AgentListItem>>('/agents', { params: { page, page_size } }).then(r => r.data),

  create: (data: AgentCreatePayload) =>
    client.post<Agent>('/agents', data).then(r => r.data),

  get: (id: string) =>
    client.get<Agent>(`/agents/${id}`).then(r => r.data),

  update: (id: string, data: Partial<AgentCreatePayload>) =>
    client.patch<Agent>(`/agents/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/agents/${id}`),

  duplicate: (id: string) =>
    client.post<Agent>(`/agents/${id}/duplicate`).then(r => r.data),

  toggle: (id: string) =>
    client.post<Agent>(`/agents/${id}/toggle`).then(r => r.data),
};
