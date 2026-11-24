import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { executionsApi, ExecutionCreatePayload } from '../api/executions';

export function useExecutions(agentId?: string, page = 1) {
  return useQuery({
    queryKey: ['executions', agentId, page],
    queryFn: () => executionsApi.list(agentId, page),
  });
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionsApi.get(id),
    enabled: !!id,
    refetchInterval: (data) => {
      if (!data) return 2000;
      const status = (data as any)?.status;
      return status === 'running' || status === 'pending' ? 2000 : false;
    },
  });
}

export function useRunAgent(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExecutionCreatePayload) => executionsApi.run(agentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to run agent');
    },
  });
}

export function useCancelExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executionsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executions'] });
      toast.success('Execution cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to cancel execution');
    },
  });
}

export function useAvailableTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: executionsApi.tools,
    staleTime: Infinity,
  });
}
