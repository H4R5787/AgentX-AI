export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
}

export interface OrgMembership {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
}

export interface AgentTool {
  id: string;
  tool_name: string;
  config: Record<string, unknown> | null;
}

export interface Agent {
  id: string;
  org_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  system_prompt: string | null;
  model_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number | null;
  is_active: boolean;
  version: number;
  tools: AgentTool[];
  created_at: string;
  updated_at: string;
}

export interface AgentListItem {
  id: string;
  name: string;
  description: string | null;
  model_provider: string;
  model_name: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_executions: number;
  active_executions: number;
  completed_executions: number;
  failed_executions: number;
  active_deployments: number;
  org_members: number;
  total_tokens_used: number;
  total_cost_usd: number;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ExecutionTask {
  id: string;
  task_type: string;
  status: string;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error: string | null;
  tokens_used: number;
  created_at: string;
  completed_at: string | null;
}

export interface ExecutionResponse {
  id: string;
  org_id: string;
  agent_id: string | null;
  initiated_by: string | null;
  status: string;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error: string | null;
  tokens_used: number;
  cost_usd: number;
  iteration_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  tasks: ExecutionTask[];
}

export interface ExecutionListItem {
  id: string;
  agent_id: string | null;
  status: string;
  tokens_used: number;
  cost_usd: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
