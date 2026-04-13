'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RoleSelector } from './_components/role-selector';
import { InvestorSurveyForm } from './_components/investor-survey-form';
import { FirmWizard } from './_components/firm-wizard';

type OnboardingStep = 'loading' | 'role_selection' | 'investor_survey' | 'firm_wizard' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email, company_id, role, status')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      router.push('/auth/login');
      return;
    }

    setUserEmail(profile.email);
    setUserName(profile.full_name);
    setUserId(user.id);
    setCompanyId(profile.company_id || '');

    // Admin — skip role selection, go straight to firm wizard
    if (profile.role === 'admin') {
      setStep('firm_wizard');
      return;
    }

    // Invited investor — skip role selection, go straight to investor survey
    if (profile.role === 'investor') {
      setStep('investor_survey');
      return;
    }

    // Invited partner — already approved, shouldn't be here
    if (profile.role === 'partner') {
      window.location.href = '/company';
      return;
    }

    // Pending users (self-signup, no invite) — show role selection
    setStep('role_selection');
  };

  const handleRoleSelected = async (role: 'investor' | 'firm') => {
    if (role === 'investor') {
      setStep('investor_survey');
    } else {
      // Firm/Operator joining a team — no survey needed, just approve as partner
      setApproving(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Not authenticated');

        const res = await fetch('/api/onboarding/approve-partner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to set up account');
        }

        window.location.href = '/company';
      } catch (err) {
        console.error('Partner approval error:', err);
        setApproving(false);
        setStep('role_selection');
      }
    }
  };

  const handleComplete = (role: 'investor' | 'admin') => {
    setStep('complete');
    const routes: Record<string, string> = {
      admin: '/admin',
      investor: '/investor',
    };
    window.location.href = routes[role] || '/auth/login';
  };

  if (step === 'loading' || approving) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin  border-2 border-emerald-500 border-t-transparent" />
        {approving && <p className="text-sm text-slate-500">Setting up your account...</p>}
      </div>
    );
  }

  if (step === 'role_selection') {
    return <RoleSelector onSelect={handleRoleSelected} />;
  }

  if (step === 'investor_survey') {
    return (
      <InvestorSurveyForm
        email={userEmail}
        fullName={userName}
        onBack={() => setStep('role_selection')}
        onComplete={() => handleComplete('investor')}
      />
    );
  }

  if (step === 'firm_wizard') {
    return (
      <FirmWizard
        userId={userId}
        companyId={companyId}
        onComplete={() => handleComplete('admin')}
      />
    );
  }

  // Complete — show brief loading while redirecting
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin  border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}
