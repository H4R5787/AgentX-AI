import React from 'react';
import { Shield, Code2, Package, AlertTriangle, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Cybersecurity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cybersecurity</h1>
        <p className="text-slate-400 text-sm mt-1">AI-powered security analysis for authorized targets only</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm">
        <Badge variant="error">Phase 5</Badge>
        <span className="text-red-400">All security scanning is restricted to authorized targets only</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Code2, title: 'Source Code Analysis', desc: 'Static analysis with Semgrep to detect security vulnerabilities in your codebase.', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { icon: Package, title: 'Dependency Scanning', desc: 'Identify vulnerable packages and outdated dependencies in your project.', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { icon: AlertTriangle, title: 'OWASP Top 10', desc: 'Automated checks for the most critical web application security risks.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { icon: FileText, title: 'Security Reports', desc: 'Detailed vulnerability reports with risk classification and remediation recommendations.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: Shield, title: 'Security Agent', desc: 'A specialized AI agent that performs comprehensive security analysis autonomously.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { icon: Shield, title: 'Config Analysis', desc: 'Analyze Docker, Kubernetes and cloud configuration for security misconfigurations.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
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
