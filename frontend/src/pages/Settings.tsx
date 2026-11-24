import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
});
type FormData = z.infer<typeof schema>;

export default function Settings() {
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { full_name: user?.full_name || '' },
  });

  const onSubmit = (_data: FormData) => {
    toast.success('Profile update coming in Phase 7');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      <Card header={<div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Profile</div>}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Your name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />
          <Input
            label="Email"
            value={user?.email ?? ''}
            disabled
            helper="Email cannot be changed after registration"
          />
          <div className="flex items-center gap-3">
            <Button type="submit">Save Changes</Button>
            <Badge variant={user?.is_active ? 'success' : 'error'}>
              {user?.is_active ? 'Active Account' : 'Inactive'}
            </Badge>
          </div>
        </form>
      </Card>

      <Card header={<div className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Security</div>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Password management coming in Phase 7.</p>
          <Button variant="secondary" disabled>Change Password</Button>
        </div>
      </Card>

      <Card header="Danger Zone" className="border-red-500/20">
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Destructive actions. These cannot be undone.</p>
          <Button variant="danger" disabled>Delete Account (Phase 7)</Button>
        </div>
      </Card>
    </div>
  );
}
