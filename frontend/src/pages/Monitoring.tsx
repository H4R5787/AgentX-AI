import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import { executionsApi } from '../api/executions';
import { Card } from '../components/ui/Card';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { LoadingPage } from '../components/ui/Spinner';
import { formatDateTime, formatCost } from '../utils/cn';

export default function Monitoring() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: dashboardApi.health,
    refetchInterval: 15_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 10_000,
  });

  const { data: executions } = useQuery({
    queryKey: ['executions', undefined, 1],
    queryFn: () => executionsApi.list(undefined, 1, 10),
    refetchInterval: 5_000,
  });

  if (healthLoading) return <LoadingPage />;

  const dbOk = health?.services?.database === 'ok';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Monitoring</h1>
        <p className="text-slate-400 text-sm mt-1">System health, execution metrics and observability</p>
      </div>

      {/* System health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            {dbOk
              ? <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              : <XCircle className="w-6 h-6 text-red-400 shrink-0" />
            }
            <div>
              <p className="text-xs text-slate-500">Database</p>
              <p className={`font-semibold text-sm ${dbOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {dbOk ? 'Connected' : 'Error'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Environment</p>
              <p className="font-semibold text-sm text-blue-400">{health?.services?.environment ?? 'unknown'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-violet-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Active Executions</p>
              <p className="font-semibold text-sm text-violet-400">{stats?.active_executions ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Execution metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats?.total_executions ?? 0, color: 'text-white' },
          { label: 'Completed', value: stats?.completed_executions ?? 0, color: 'text-emerald-400' },
          { label: 'Failed', value: stats?.failed_executions ?? 0, color: 'text-red-400' },
          { label: 'Tokens Used', value: (stats?.total_tokens_used ?? 0).toLocaleString(), color: 'text-blue-400' },
        ].map(m => (
          <Card key={m.label}>
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </Card>
        ))}
      </div>

      {/* Cost */}
      {(stats?.total_cost_usd ?? 0) > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Estimated API Cost</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCost(stats?.total_cost_usd ?? 0)}</p>
              <p className="text-xs text-slate-600 mt-1">Approximate based on token usage</p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent executions table */}
      <Card header="Recent Executions">
        {!executions?.items.length ? (
          <div className="text-center py-10 text-slate-600">
            <Activity className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No executions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Tokens</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executions.items.map(exec => (
                  <tr key={exec.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3 font-mono text-xs text-slate-400">{exec.id.slice(0, 8)}...</td>
                    <td className="py-3">
                      <Badge variant={statusToBadge(exec.status)} dot>{exec.status}</Badge>
                    </td>
                    <td className="py-3 text-slate-300">{exec.tokens_used.toLocaleString()}</td>
                    <td className="py-3 text-slate-300">{formatCost(exec.cost_usd)}</td>
                    <td className="py-3 text-slate-500 text-xs">
                      {exec.started_at ? formatDateTime(exec.started_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
