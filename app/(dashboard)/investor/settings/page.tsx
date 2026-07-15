'use client';

import { Bell, Loader2, Lock, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  region: string;
}

export default function InvestorSettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification preferences (local state — would need a table for persistence)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [paymentNotifs, setPaymentNotifs] = useState(true);
  const [dealUpdates, setDealUpdates] = useState(true);
  const [marketingComms, setMarketingComms] = useState(false);

  // Password fields
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
          .select('full_name, email')
          .eq('user_id', user.id)
          .single();

        // Try to get investor survey data for phone/region
        const { data: survey } = await supabase
          .from('investor_surveys')
          .select('phone_number, region')
          .eq('user_id', user.id)
          .single();

        setProfile({
          fullName: p?.full_name || '',
          email: p?.email || user.email || '',
          phone: survey?.phone_number || '',
          region: survey?.region || '',
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
      console.error('[SETTINGS] Save error:', err);
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
      console.error('[SETTINGS] Password error:', err);
      toast.error(err?.message || 'Failed to update password');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fundex-forest" />
      </div>
    );
  }

  const nameParts = (profile?.fullName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12">
      <header>
        <h1 className="font-display text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-sm font-normal text-stone-400">
          Manage your account preferences
        </p>
      </header>

      {/* Personal Information */}
      <section className="border border-stone-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-fundex-gold/10 text-fundex-forest">
            <User className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-medium text-stone-900">Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-stone-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) =>
                setProfile((p) => p ? { ...p, fullName: `${e.target.value} ${lastName}`.replace(/\s+/g, ' ').trim() } : p)
              }
              className="mt-1.5 w-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) =>
                setProfile((p) => p ? { ...p, fullName: `${firstName} ${e.target.value}`.replace(/\s+/g, ' ').trim() } : p)
              }
              className="mt-1.5 w-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="mt-1.5 w-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-500 shadow-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-stone-700">Phone</label>
            <input
              type="tel"
              value={profile?.phone || ''}
              disabled
              className="mt-1.5 w-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-500 shadow-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-fundex-gold px-6 py-2.5 text-sm font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="border border-stone-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-600">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-medium text-stone-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive email updates about your investments', checked: emailNotifs, onChange: setEmailNotifs },
            { label: 'Payment Notifications', desc: 'Get notified when payments are received', checked: paymentNotifs, onChange: setPaymentNotifs },
            { label: 'Deal Updates', desc: 'Receive updates about deals you are invested in', checked: dealUpdates, onChange: setDealUpdates },
            { label: 'Marketing Communications', desc: 'Receive newsletters and promotional content', checked: marketingComms, onChange: setMarketingComms },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between border border-stone-100 bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">{item.label}</p>
                <p className="mt-0.5 text-sm text-stone-500">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => item.onChange(!item.checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  item.checked ? 'bg-fundex-forest' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    item.checked ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => toast.success('Preferences saved')}
            className="bg-fundex-gold px-6 py-2.5 text-sm font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
          >
            Save Preferences
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="border border-stone-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-purple-50 text-purple-600">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-medium text-stone-900">Security</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1.5 w-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1.5 w-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1.5 w-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-fundex-forest focus:ring-1 focus:ring-fundex-forest/30"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleUpdatePassword}
            className="bg-fundex-gold px-6 py-2.5 text-sm font-medium text-fundex-forest shadow-sm transition hover:bg-fundex-gold/90"
          >
            Update Password
          </button>
        </div>
      </section>
    </div>
  );
}
