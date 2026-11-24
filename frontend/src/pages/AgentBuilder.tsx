import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Zap, Send, Square, ChevronDown, ChevronUp, Wrench, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { LoadingPage, Spinner } from '../components/ui/Spinner';
import { useAgent, useCreateAgent, useUpdateAgent } from '../hooks/useAgents';
import { useRunAgent, useAvailableTools } from '../hooks/useExecutions';
import { executionsApi } from '../api/executions';
import { formatCost } from '../utils/cn';

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const OLLAMA_MODELS = [
  { value: 'llama3.2', label: 'Llama 3.2' },
  { value: 'llama3.1', label: 'Llama 3.1' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'codellama', label: 'CodeLlama' },
  { value: 'phi3', label: 'Phi-3' },
];

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  system_prompt: z.string().optional(),
  model_provider: z.enum(['openai', 'ollama']),
  model_name: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().positive().optional().nullable(),
  tools: z.array(z.object({ tool_name: z.string(), config: z.any() })).default([]),
});

type FormData = z.infer<typeof schema>;

interface StreamEvent {
  event: string;
  data: Record<string, unknown>;
}

export default function AgentBuilder() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  // Data
  const { data: existingAgent, isLoading } = useAgent(id ?? '');
  const { data: toolsData } = useAvailableTools();
  const { mutate: createAgent, isPending: isCreating } = useCreateAgent();
  const { mutate: updateAgent, isPending: isUpdating } = useUpdateAgent(id ?? '');

  // Form
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', system_prompt: 'You are a helpful AI assistant.',
      model_provider: 'openai', model_name: 'gpt-4o-mini',
      temperature: 0.7, max_tokens: null, tools: [],
    },
  });

  const provider = watch('model_provider');
  const watchedValues = watch();

  // Populate form in edit mode
  useEffect(() => {
    if (existingAgent) {
      reset({
        name: existingAgent.name,
        description: existingAgent.description ?? '',
        system_prompt: existingAgent.system_prompt ?? '',
        model_provider: existingAgent.model_provider as 'openai' | 'ollama',
        model_name: existingAgent.model_name,
        temperature: existingAgent.temperature,
        max_tokens: existingAgent.max_tokens ?? null,
        tools: existingAgent.tools.map(t => ({ tool_name: t.tool_name, config: t.config })),
      });
    }
  }, [existingAgent, reset]);

  // Test chat
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; meta?: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecId, setCurrentExecId] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory]);

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]
    );
    setValue('tools', selectedTools.includes(toolName)
      ? watchedValues.tools.filter(t => t.tool_name !== toolName)
      : [...watchedValues.tools, { tool_name: toolName, config: null }]
    );
  };

  const onSubmit = (data: FormData) => {
    const payload = { ...data, tools: data.tools ?? [] };
    if (isEditing) {
      updateAgent(payload);
    } else {
      createAgent(payload);
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim() || !isEditing) return;
    const userMsg = testMessage.trim();
    setTestMessage('');
    setChatHistory(h => [...h, { role: 'user', content: userMsg }]);
    setIsRunning(true);

    try {
      // Start execution
      const resp = await executionsApi.run(id!, { input_data: { message: userMsg } });
      setCurrentExecId(resp.id);

      // Connect to SSE stream
      const es = new EventSource(`/api/v1/executions/${resp.id}/stream`);
      let assistantContent = '';

      es.onmessage = (e) => {
        const event: StreamEvent = JSON.parse(e.data);
        if (event.event === 'token') {
          assistantContent += (event.data as any).content || '';
          setChatHistory(h => {
            const last = h[h.length - 1];
            if (last?.role === 'assistant_streaming') {
              return [...h.slice(0, -1), { role: 'assistant_streaming', content: assistantContent }];
            }
            return [...h, { role: 'assistant_streaming', content: assistantContent }];
          });
        } else if (event.event === 'tool_call') {
          setChatHistory(h => [...h, {
            role: 'tool',
            content: `🔧 Calling tool: ${(event.data as any).tool}`,
            meta: (event.data as any).input,
          }]);
        } else if (event.event === 'tool_result') {
          setChatHistory(h => [...h, {
            role: 'tool_result',
            content: `✅ ${(event.data as any).tool}: ${(event.data as any).result?.slice(0, 200)}`,
          }]);
        } else if (event.event === 'done') {
          const done = event.data as any;
          const finalMsg = done.final_output || assistantContent || 'Agent completed.';
          setChatHistory(h => {
            const filtered = h.filter(m => m.role !== 'assistant_streaming');
            return [...filtered, {
              role: 'assistant',
              content: finalMsg,
              meta: `${done.tokens_used ?? 0} tokens · ${formatCost(done.cost_usd ?? 0)}`,
            }];
          });
          es.close();
          setIsRunning(false);
          setCurrentExecId(null);
        } else if (event.event === 'error') {
          setChatHistory(h => [...h, { role: 'error', content: `Error: ${(event.data as any).error}` }]);
          es.close();
          setIsRunning(false);
          setCurrentExecId(null);
        }
      };
      es.onerror = () => {
        es.close();
        setIsRunning(false);
        setChatHistory(h => [...h, { role: 'error', content: 'Stream connection lost.' }]);
      };
    } catch (err: any) {
      setIsRunning(false);
      setChatHistory(h => [...h, { role: 'error', content: err.response?.data?.detail || 'Failed to run agent' }]);
    }
  };

  if (isLoading && isEditing) return <LoadingPage />;

  const modelOptions = provider === 'openai' ? OPENAI_MODELS : OLLAMA_MODELS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Agent' : 'Agent Builder'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEditing ? `Editing: ${existingAgent?.name ?? '...'}` : 'Configure and deploy a new AI agent'}
          </p>
        </div>
        {isEditing && (
          <Badge variant={existingAgent?.is_active ? 'success' : 'neutral'} dot>
            {existingAgent?.is_active ? 'Active' : 'Inactive'} · v{existingAgent?.version}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Configuration form ── */}
        <div className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Card header="Basic Information">
              <div className="space-y-4">
                <Input
                  label="Agent Name *"
                  placeholder="e.g. Research Assistant"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Textarea
                  label="Description"
                  placeholder="What does this agent do?"
                  rows={2}
                  {...register('description')}
                />
              </div>
            </Card>

            <Card header="System Prompt">
              <Textarea
                placeholder="You are a helpful AI assistant..."
                rows={8}
                className="font-mono text-xs"
                helper="The system prompt defines your agent's personality, role, and constraints."
                {...register('system_prompt')}
              />
            </Card>

            <Card header="Model Configuration">
              <div className="space-y-4">
                <Controller
                  name="model_provider"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Provider"
                      options={[
                        { value: 'openai', label: 'OpenAI' },
                        { value: 'ollama', label: 'Ollama (Local)' },
                      ]}
                      value={field.value}
                      onChange={e => {
                        field.onChange(e);
                        setValue('model_name', e.target.value === 'openai' ? 'gpt-4o-mini' : 'llama3.2');
                      }}
                    />
                  )}
                />
                <Controller
                  name="model_name"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Model"
                      options={modelOptions}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.model_name?.message}
                    />
                  )}
                />

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Temperature</label>
                    <span className="text-sm font-mono text-primary">{watchedValues.temperature}</span>
                  </div>
                  <input
                    type="range" min={0} max={2} step={0.1}
                    className="w-full accent-primary"
                    {...register('temperature', { valueAsNumber: true })}
                  />
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Precise (0)</span>
                    <span>Balanced (1)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                <Input
                  label="Max Tokens (optional)"
                  type="number"
                  placeholder="Leave blank for model default"
                  min={1}
                  {...register('max_tokens', { valueAsNumber: true, setValueAs: v => v === '' || isNaN(v) ? null : Number(v) })}
                />
              </div>
            </Card>

            {/* Tools */}
            <Card>
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setShowTools(s => !s)}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span className="font-medium text-white text-sm">Tools</span>
                  {selectedTools.length > 0 && (
                    <Badge variant="info">{selectedTools.length} selected</Badge>
                  )}
                </div>
                {showTools ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showTools && (
                <div className="mt-4 space-y-2">
                  {toolsData?.tools.map(tool => (
                    <label key={tool.name} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool.name)}
                        onChange={() => toggleTool(tool.name)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{tool.name}</p>
                        <p className="text-xs text-slate-500">{tool.description}</p>
                        {tool.requires_approval && (
                          <Badge variant="warning" className="mt-1">Requires approval</Badge>
                        )}
                      </div>
                    </label>
                  ))}
                  {!toolsData?.tools.length && (
                    <p className="text-xs text-slate-500 text-center py-4">No tools loaded</p>
                  )}
                </div>
              )}
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isCreating || isUpdating}
            >
              {isEditing ? 'Update Agent' : 'Create Agent'}
            </Button>
          </form>
        </div>

        {/* ── Right: Preview + Test ── */}
        <div className="space-y-5">
          {/* Agent Preview */}
          <Card header={<span className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Agent Preview</span>}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">{watchedValues.name || 'Unnamed Agent'}</p>
                  <p className="text-xs text-slate-500">{watchedValues.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  <Zap className="w-3 h-3" />
                  {watchedValues.model_provider}/{watchedValues.model_name}
                </Badge>
                <Badge variant="neutral">temp: {watchedValues.temperature}</Badge>
                {watchedValues.max_tokens && <Badge variant="neutral">max: {watchedValues.max_tokens}t</Badge>}
              </div>
              {watchedValues.system_prompt && (
                <div className="p-3 bg-surface-2 rounded-lg border border-border">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">System Prompt</p>
                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-5">
                    {watchedValues.system_prompt.slice(0, 300)}
                    {watchedValues.system_prompt.length > 300 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Test Panel */}
          <Card header={<span className="flex items-center gap-2"><Send className="w-4 h-4 text-primary" />Test Agent</span>}>
            {!isEditing ? (
              <div className="text-center py-8 text-slate-500">
                <Bot className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm">Save the agent first to test it</p>
              </div>
            ) : (
              <div className="flex flex-col h-96">
                {/* Chat history */}
                <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8 text-slate-600">
                      <p className="text-sm">Send a message to test your agent</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary/20 text-white border border-primary/20'
                          : msg.role === 'error'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : msg.role === 'tool' || msg.role === 'tool_result'
                          ? 'bg-amber-500/5 text-amber-400 border border-amber-500/10 font-mono text-xs'
                          : 'bg-surface-2 text-slate-300 border border-border'
                      }`}>
                        <p className="whitespace-pre-wrap leading-5">{msg.content}</p>
                        {msg.meta && <p className="text-xs text-slate-600 mt-1">{msg.meta}</p>}
                      </div>
                    </div>
                  ))}
                  {isRunning && chatHistory[chatHistory.length - 1]?.role !== 'assistant_streaming' && (
                    <div className="flex gap-2 items-center text-slate-500 text-xs">
                      <Spinner size="sm" />
                      Agent is thinking...
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleTest()}
                    placeholder="Send a message..."
                    disabled={isRunning}
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-white text-sm
                               placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary
                               focus:border-primary disabled:opacity-50"
                  />
                  {isRunning ? (
                    <Button variant="danger" size="sm" leftIcon={<Square className="w-4 h-4" />} onClick={() => {}}>
                      Stop
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleTest} disabled={!testMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
