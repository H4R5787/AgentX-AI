import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, Copy } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export default function ApiKeys() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-slate-400 text-sm mt-1">Manage API keys for programmatic access to AgentX AI</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} disabled>
          Create Key
        </Button>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-2 bg-surface-2 text-sm text-slate-400">
        <Badge variant="warning">Phase 7</Badge>
        <span>API key management is coming in Phase 7 (SaaS Preparation)</span>
      </div>

      <Card>
        <EmptyState
          icon={Key}
          title="No API keys"
          description="Create API keys to access the AgentX AI API programmatically from your applications and scripts."
        />
      </Card>

      <Card header="Planned Features">
        <ul className="space-y-3 text-sm text-slate-400">
          {[
            'Create named API keys with configurable scopes',
            'Set expiration dates on keys',
            'View last-used timestamps',
            'Revoke keys instantly',
            'Per-key rate limiting and quota enforcement',
            'Audit logs for all API key usage',
          ].map(f => (
            <li key={f} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
