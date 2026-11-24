import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { agentsApi, AgentCreatePayload } from '../api/agents';

export function useAgents(page = 1) {
  return useQuery({
    queryKey: ['agents', page],
    queryFn: () => agentsApi.list(page),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id),
    enabled: !!id && id !== 'new',
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: AgentCreatePayload) => agentsApi.create(data),
    onSuccess: (agent) => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent created successfully!');
      navigate(`/agents/${agent.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create agent');
    },
  });
}

export function useUpdateAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AgentCreatePayload>) => agentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['agent', id] });
      toast.success('Agent updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update agent');
    },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete agent');
    },
  });
}

export function useDuplicateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent duplicated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to duplicate agent');
    },
  });
}

export function useToggleAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.toggle(id),
    onSuccess: (agent) => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['agent', agent.id] });
      toast.success(agent.is_active ? 'Agent enabled' : 'Agent disabled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to toggle agent');
    },
  });
}
