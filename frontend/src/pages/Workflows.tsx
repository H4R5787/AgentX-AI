import React from 'react';
import { GitBranch, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Workflows() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workflows</h1>
        <p className="text-slate-400 text-sm mt-1">Build and orchestrate multi-agent workflows</p>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-2 bg-surface-2 text-sm text-slate-400">
        <Badge variant="warning">Phase 3</Badge>
        <span>Multi-agent orchestration is coming in Phase 3 of development</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Sequential Workflows', desc: 'Chain agents together where each agent processes the output of the previous one.' },
          { title: 'Parallel Execution', desc: 'Run multiple specialized agents simultaneously and merge their outputs.' },
          { title: 'Conditional Branching', desc: 'Route tasks to different agents based on conditions or prior outputs.' },
          { title: 'Human Approval Gates', desc: 'Pause execution and require human approval before sensitive operations.' },
          { title: 'Task Delegation', desc: 'An orchestrator agent coordinates and delegates subtasks to specialist agents.' },
          { title: 'Visual Graph Editor', desc: 'Drag-and-drop workflow builder with node connections using ReactFlow.' },
        ].map(item => (
          <Card key={item.title} className="opacity-60">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <GitBranch className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-5">{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
