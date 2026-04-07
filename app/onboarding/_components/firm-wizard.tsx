'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BUSINESS_TYPES = [
  'Private Lender',
  'Capital Arranger',
  'Real Estate Syndicator',
  'Private Credit Operator',
  'Other',
];

const TEAM_SIZES = ['1–5', '6–15', '16–50', '50+'];
const INVESTOR_COUNTS = ['1–25', '26–100', '101–500', '500+'];
const DEAL_VOLUMES = ['Under $5M', '$5M–$25M', '$25M–$100M', '$100M+'];
const USER_ROLES = [
  'Managing Partner',
  'Investor Relations',
  'Operations',
  'Capital Markets',
  'Admin',
  'Other',
];

const TOTAL_STEPS = 5;

type FirmWizardProps = {
  userId: string;
  companyId: string;
  onBack?: (() => void) | undefined;
  onComplete: () => void;
};

export function FirmWizard({ userId, companyId, onBack, onComplete }: FirmWizardProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [firmName, setFirmName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [activeInvestors, setActiveInvestors] = useState('');
  const [dealVolume, setDealVolume] = useState('');
  const [userRole, setUserRole] = useState('');

  const canContinue = () => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: return firmName.trim() !== '' && businessType !== '';
      case 2: return teamSize !== '' && activeInvestors !== '';
      case 3: return dealVolume !== '';
      case 4: return userRole !== '';
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async (skipBank = true) => {
    setSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch('/api/surveys/firm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firmName,
          businessType,
          teamSize,
          activeInvestors,
          annualDealVolume: dealVolume,
          userRole,
          bankConnected: !skipBank,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setStep(TOTAL_STEPS + 1); // Show completion
      setTimeout(onComplete, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  // Progress bar
  const progress = step <= TOTAL_STEPS ? (step / TOTAL_STEPS) * 100 : 100;

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-1">
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          {step > TOTAL_STEPS ? 'Setup Complete' : `Step ${step} of ${TOTAL_STEPS}`}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Let&apos;s set up your workspace
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto">
              We&apos;ll personalize Fundex based on your firm so you can manage deals, investors, and capital more efficiently.
            </p>
            <p className="mt-6 text-xs text-emerald-600 font-medium flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Takes about 2 minutes
            </p>
          </div>
        )}

        {/* Step 1: Firm Information */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900">Firm Information</h2>
            <p className="mt-1 text-sm text-slate-500">Tell us about your business</p>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="firm-name" className="block text-sm font-medium text-slate-700">
                  Firm Name
                </label>
                <input
                  id="firm-name"
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g., Acme Capital Partners"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">
                  What best describes your business?
                </p>
                <div className="space-y-2">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBusinessType(type)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        businessType === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {type}
                        {businessType === type && <Check className="h-4 w-4 text-emerald-600" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Firm Size */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900">Firm Size</h2>
            <p className="mt-1 text-sm text-slate-500">Help us understand your scale</p>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">
                  How many team members do you have?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTeamSize(size)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        teamSize === size
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">
                  How many active investors do you manage?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INVESTOR_COUNTS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setActiveInvestors(count)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        activeInvestors === count
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Activity */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900">Activity</h2>
            <p className="mt-1 text-sm text-slate-500">Tell us about your operations</p>

            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700 mb-3">
                What is your approximate annual deal volume?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEAL_VOLUMES.map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setDealVolume(vol)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      dealVolume === vol
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {vol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Role */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900">What is your role?</h2>
            <p className="mt-1 text-sm text-slate-500">This helps us tailor your workspace and permissions.</p>

            <div className="mt-6 space-y-2">
              {USER_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    userRole === role
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {role}
                    {userRole === role && <Check className="h-4 w-4 text-emerald-600" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Connect Bank */}
        {step === 5 && (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Automate your capital flows
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Connect your firm&apos;s bank account to automatically track investor deposits and payout confirmations.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              {[
                { title: 'Track Incoming Capital', desc: 'Automatically track incoming investor capital' },
                { title: 'Confirm Payouts', desc: 'Confirm outgoing payments (interest and principal)' },
                { title: 'Reduce Manual Work', desc: 'Reduce manual reconciliation' },
                { title: 'Improve Accuracy', desc: 'Improve reporting accuracy' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Connect Bank (via Plaid) <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="mt-3 text-sm text-slate-500 transition hover:text-slate-700"
            >
              Skip for now
            </button>
            <p className="mt-4 text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Secure connection powered by Plaid. Fundex never stores your bank credentials.
            </p>
          </div>
        )}

        {/* Step 6: Complete */}
        {step > TOTAL_STEPS && (
          <div className="text-center py-8">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
              <Check className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Your workspace is ready
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto">
              Fundex has prepared your firm layer based on your setup. You can now manage deals, investors, and capital operations.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 font-medium text-center">{error}</p>
        )}
      </div>

      {/* Navigation buttons */}
      {step <= 4 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
