'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Key, Loader2, Lock, LogOut, User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { logOut } from '@/lib/auth';

interface ProfileData {
  fullName: string;
  email: string;
  role: string;
  companyName: string;
  companyCode: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: p } = await supabase
          .from('user_profiles')
          .select('full_name, email, role, company_id')
          .eq('user_id', user.id)
          .single();

        let companyName = '';
        let companyCode = '';
        if (p?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name, company_code')
            .eq('id', p.company_id)
            .single();
          companyName = company?.name || '';
          companyCode = company?.company_code || '';
        }

        setProfile({
          fullName: p?.full_name || '',
          email: p?.email || user.email || '',
          role: p?.role || '',
          companyName,
          companyCode,
        });
      } catch (err) {
        console.error('[SETTINGS] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: profile.fullName })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password');
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fundex-forest" />
      </div>
    );
  }

  const initials = (profile?.fullName || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleName = profile?.role === 'admin' ? 'Managing Partner' : profile?.role === 'partner' ? 'Team Member' : profile?.role || '';

  return (
    <div className="space-y-8 px-6 py-6 md:px-8 md:py-8">
      <PageHeader title="Settings" subtitle="Manage your account and firm preferences" />

      {/* Profile Card */}
      <div className="fdx-card flex items-center gap-5 p-6">
        <div className="flex h-16 w-16 items-center justify-center bg-gradient-to-br from-fundex-forest to-fundex-green text-lg font-bold text-white">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{profile?.fullName}</h2>
          <p className="text-sm text-stone-500">{roleName}</p>
          <p className="text-sm text-stone-400">{profile?.email}</p>
        </div>
      </div>

      {/* Account */}
      <section className="fdx-card divide-y divide-stone-100">
        <div className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Account</h3>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Full Name</label>
              <Input
                value={profile?.fullName || ''}
                onChange={(e) => setProfile((p) => p ? { ...p, fullName: e.target.value } : p)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Email</label>
              <Input value={profile?.email || ''} disabled className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-fundex-forest hover:bg-fundex-green">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </section>

      {/* Firm Details */}
      <section className="fdx-card divide-y divide-stone-100">
        <div className="flex items-center gap-3 p-5">
          <Building2 className="h-4 w-4 text-stone-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Firm Details</h3>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Firm Name</span>
            <span className="text-sm font-medium text-stone-900">{profile?.companyName || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Company Code</span>
            <span className="font-mono text-sm font-medium text-stone-900">{profile?.companyCode || '—'}</span>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="fdx-card divide-y divide-stone-100">
        <div className="flex items-center gap-3 p-5">
          <Lock className="h-4 w-4 text-stone-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Security</h3>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">Current Password</label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="mt-1.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">New Password</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="mt-1.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Confirm Password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="mt-1.5" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleUpdatePassword} className="bg-fundex-forest hover:bg-fundex-green">Update Password</Button>
          </div>
        </div>
      </section>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="fdx-card flex w-full items-center gap-3 border-red-200 p-5 text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">Log Out</span>
      </button>
    </div>
  );
}
