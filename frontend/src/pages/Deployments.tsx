import React from 'react';
import { Rocket, Cloud, Server } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Deployments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deployments</h1>
        <p className="text-slate-400 text-sm mt-1">Deploy agents to local Docker runtimes or cloud environments</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-2 bg-surface-2 text-sm text-slate-400">
        <Badge variant="warning">Phase 4</Badge>
        <span>Agent deployment platform is coming in Phase 4 of development</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Server, title: 'Local Docker Runtime', desc: 'Run agents on your own machine using Docker. Supports Ollama for local LLMs.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: Cloud, title: 'Cloud Deployment', desc: 'Deploy agents to AWS ECS or compatible cloud environments with autoscaling.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: Rocket, title: 'Deployment Lifecycle', desc: 'Start, stop, restart and remove deployments with full lifecycle management.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { icon: Server, title: 'Runtime Registration', desc: 'Register runtime nodes securely without exposing your machine to the internet.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(item => (
          <Card key={item.title} className="opacity-60">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${item.bg}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
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
