import React from 'react';
import { BookOpen, Upload, Search } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function KnowledgeBase() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-slate-400 text-sm mt-1">Upload documents and configure vector search for your agents</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-2 bg-surface-2 text-sm text-slate-400">
        <Badge variant="info">Phase 2 →</Badge>
        <span>Knowledge base ingestion and vector search coming soon (uses PostgreSQL + pgvector)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Upload, title: 'Document Ingestion', desc: 'Upload PDFs, Markdown, text files and web pages into your knowledge base.' },
          { icon: Search, title: 'Semantic Search', desc: 'Vector embeddings enable semantic search across all your documents.' },
          { icon: BookOpen, title: 'Agent Context', desc: 'Agents can query relevant knowledge during execution to ground their responses.' },
        ].map(item => (
          <Card key={item.title} className="opacity-60">
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-5">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
