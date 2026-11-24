import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Building2, Users, Plus } from 'lucide-react';
import { orgsApi } from '../api/organizations';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingPage } from '../components/ui/Spinner';
import { formatDate } from '../utils/cn';

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') });
type FormData = z.infer<typeof schema>;

export default function Organization() {
  const qc = useQueryClient();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: orgsApi.list,
  });

  const { data: members } = useQuery({
    queryKey: ['org-members', orgs?.[0]?.id],
    queryFn: () => orgsApi.members(orgs![0].id),
    enabled: !!orgs?.[0]?.id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: (data: FormData) => orgsApi.create(data.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created!');
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create organization'),
  });

  if (isLoading) return <LoadingPage />;

  const org = orgs?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Organization</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your organization, members and settings</p>
      </div>

      {!org ? (
        <Card header="Create Your Organization">
          <p className="text-slate-400 text-sm mb-6">
            You need to create an organization before you can create agents, workflows, or deployments.
          </p>
          <form onSubmit={handleSubmit(d => createOrg(d))} className="flex gap-3 max-w-md">
            <div className="flex-1">
              <Input
                placeholder="Organization name"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <Button type="submit" loading={isPending}>Create</Button>
          </form>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{org.name}</h2>
                  <Badge variant="info">{org.plan}</Badge>
                </div>
                <p className="text-sm text-slate-500">/{org.slug} · Created {formatDate(org.created_at)}</p>
              </div>
            </div>
          </Card>

          <Card header={<div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Members ({members?.length ?? 0})</div>}>
            {!members?.length ? (
              <p className="text-slate-500 text-sm py-4 text-center">No members found</p>
            ) : (
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {m.user_id.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white font-mono">{m.user_id.slice(0, 12)}...</p>
                        <p className="text-xs text-slate-500">Joined {formatDate(m.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={m.role === 'owner' ? 'purple' : m.role === 'admin' ? 'info' : 'neutral'}>
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} disabled>
                Invite Member (Phase 7)
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
