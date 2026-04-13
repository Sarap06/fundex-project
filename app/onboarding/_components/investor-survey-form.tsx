'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const REGIONS = [
  'South Florida',
  'Northeast US',
  'Southeast US',
  'Midwest US',
  'West Coast US',
  'Southwest US',
  'International',
  'Other',
];

type InvestorSurveyFormProps = {
  email: string;
  fullName: string;
  onBack: () => void;
  onComplete: () => void;
};

export function InvestorSurveyForm({ email, fullName, onBack, onComplete }: InvestorSurveyFormProps) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('');
  const [secondCountryCode, setSecondCountryCode] = useState('+1');
  const [secondPhoneNumber, setSecondPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !region) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          countryCode,
          phoneNumber,
          region,
          secondCountryCode: secondPhoneNumber ? secondCountryCode : null,
          secondPhoneNumber: secondPhoneNumber || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Survey submission failed');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 text-center">
        Complete your account
      </h1>
      <p className="mt-2 text-sm text-stone-500 text-center">
        Just a few details to get you started
      </p>

      <form onSubmit={handleSubmit} className="mt-8  border border-stone-100 bg-white p-6 shadow-sm space-y-5">
        {/* Email — auto-filled, read-only */}
        <div>
          <label htmlFor="investor-email" className="block text-sm font-medium text-stone-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="investor-email"
            type="email"
            value={email}
            readOnly
            className="mt-1.5 w-full  border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-600 shadow-sm outline-none cursor-not-allowed"
          />
        </div>

        {/* Phone Number — required */}
        <div>
          <label htmlFor="investor-phone" className="block text-sm font-medium text-stone-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="mt-1.5 flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-20  border border-stone-200 bg-white px-2 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            >
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+91">+91</option>
              <option value="+61">+61</option>
              <option value="+971">+971</option>
            </select>
            <input
              id="investor-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 000-0000"
              className="flex-1  border border-stone-200 px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            />
          </div>
        </div>

        {/* Region — required */}
        <div>
          <label htmlFor="investor-region" className="block text-sm font-medium text-stone-700">
            Region <span className="text-red-500">*</span>
          </label>
          <select
            id="investor-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1.5 w-full  border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
          >
            <option value="">Select your region</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Secondary Phone — optional */}
        <div>
          <label htmlFor="investor-phone2" className="block text-sm font-medium text-stone-700">
            Secondary Phone Number <span className="text-stone-400 font-normal">(Optional)</span>
          </label>
          <div className="mt-1.5 flex gap-2">
            <select
              value={secondCountryCode}
              onChange={(e) => setSecondCountryCode(e.target.value)}
              className="w-20  border border-stone-200 bg-white px-2 py-2.5 text-sm text-stone-700 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            >
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+91">+91</option>
              <option value="+61">+61</option>
              <option value="+971">+971</option>
            </select>
            <input
              id="investor-phone2"
              type="tel"
              value={secondPhoneNumber}
              onChange={(e) => setSecondPhoneNumber(e.target.value)}
              placeholder="(555) 000-0000"
              className="flex-1  border border-stone-200 px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full  bg-fundex-forest py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-fundex-green disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Continue'}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-700 mx-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
    </div>
  );
}
