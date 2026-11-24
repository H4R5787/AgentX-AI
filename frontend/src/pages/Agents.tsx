import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bot, Plus, Search, Copy, Trash2, Edit3, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { agentsApi } from '../api/agents';
import { Button } from '../components/ui/Button';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingPage } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { useDeleteAgent, useDuplicateAgent, useToggleAgent } from '../hooks/useAgents';
import { formatDate, truncate } from '../utils/cn';
import type { AgentListItem } from '../types';

export default function Agents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AgentListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['agents', 1],
    queryFn: () => agentsApi.list(1, 50),
  });

  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteAgent();
  const { mutate: duplicateAgent } = useDuplicateAgent();
  const { mutate: toggleAgent } = useToggleAgent();

  const agents = (data?.items ?? []).filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.total ?? 0} agent{(data?.total ?? 0) !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        <Button onClick={() => navigate('/agents/new')} leftIcon={<Plus className="w-4 h-4" />}>
          New Agent
        </Button>
      </div>

      {/* Search */}
      {(data?.total ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-white text-sm
                       placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      )}

      {/* Grid */}
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title={search ? 'No agents match your search' : 'No agents yet'}
          description={search ? 'Try a different search term' : 'Create your first AI agent to get started'}
          action={!search ? { label: 'Create Agent', onClick: () => navigate('/agents/new') } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Card key={agent.id} className="hover:border-border-2 transition-all group">
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{agent.name}</h3>
                    <p className="text-xs text-slate-500">v{agent.version}</p>
                  </div>
                </div>
                <Badge variant={agent.is_active ? 'success' : 'neutral'} dot>
                  {agent.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 mb-4 min-h-[32px] leading-5">
                {agent.description ? truncate(agent.description, 100) : (
                  <span className="italic text-slate-600">No description</span>
                )}
              </p>

              {/* Model chip */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-surface-2 border border-border text-slate-400">
                  <Zap className="w-3 h-3 text-primary" />
                  {agent.model_provider} / {agent.model_name}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-slate-600">{formatDate(agent.created_at)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className="p-1.5 rounded-lg hover:bg-surface-2 text-slate-400 hover:text-white transition-colors"
                    title={agent.is_active ? 'Disable' : 'Enable'}
                  >
                    {agent.is_active
                      ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                      : <ToggleLeft className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => duplicateAgent(agent.id)}
                    className="p-1.5 rounded-lg hover:bg-surface-2 text-slate-400 hover:text-white transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="p-1.5 rounded-lg hover:bg-surface-2 text-slate-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(agent)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Agent"
        size="sm"
      >
        <p className="text-slate-400 text-sm mb-6">
          Are you sure you want to delete <span className="text-white font-medium">"{deleteTarget?.name}"</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={isDeleting}
            onClick={() => {
              if (deleteTarget) {
                deleteAgent(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
