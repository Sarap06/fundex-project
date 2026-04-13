'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { companySignUp } from '@/lib/auth';
import Link from 'next/link';
import { CheckCircle, Check } from 'lucide-react';
import { FadeIn } from '@/components/motion-wrapper';

export function CompanySignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isFromInvite, setIsFromInvite] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const code = searchParams.get('code');
    const inviteEmail = searchParams.get('email');

    if (code) {
      setCompanyCode(code.toUpperCase());
      setIsFromInvite(true);
    }

    if (inviteEmail) {
      setEmail(inviteEmail);
      setIsFromInvite(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await companySignUp(email, password, fullName, companyCode);
      setSuccess(true);

      // Hard redirect to onboarding so middleware picks up the new cookies
      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 2000);
    } catch (err: Error | unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Signup failed');
      } else {
        setError('Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
        <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
        <FadeIn className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4"><CheckCircle className="text-fundex-forest" size={56} /></div>
          <h2 className="text-2xl font-display font-semibold text-fundex-forest mb-4">Signup Successful!</h2>
          <p className="text-stone-900 mb-4">Your joining request has been sent to the admin.</p>
          <p className="text-sm text-stone-500 mb-4">
            You will be redirected once admin approves your request.
          </p>
          <p className="text-sm text-stone-500">Redirecting...</p>
        </FadeIn>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
        <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
        <div className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full">
          <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">Company Signup</h1>
          <p className="text-stone-500 mb-6">Join a Fundex company</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
      <FadeIn className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full">
        <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">Company Signup</h1>
        <p className="text-stone-500 mb-6">{isFromInvite ? 'Complete your registration' : 'Join a Fundex company'}</p>

        {isFromInvite && (
          <div className="bg-fundex-gold/10 border border-fundex-gold/20  p-3 mb-6 flex items-center gap-2">
            <Check className="text-fundex-forest flex-shrink-0" size={20} />
            <p className="text-sm text-fundex-forest">You were invited to join this company</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFromInvite}
              required
              className={`w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none ${
                isFromInvite ? 'bg-stone-50 cursor-not-allowed' : ''
              }`}
              placeholder="user@example.com"
            />
            {isFromInvite && <p className="text-xs text-stone-500 mt-1">Pre-filled from your invitation</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900 mb-2">
              Company Code
            </label>
            <input
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              disabled={isFromInvite}
              required
              className={`w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none ${
                isFromInvite ? 'bg-stone-50 cursor-not-allowed' : ''
              }`}
              placeholder="ABC123"
            />
            {isFromInvite ? (
              <p className="text-xs text-stone-500 mt-1">Pre-filled from your invitation</p>
            ) : (
              <p className="text-xs text-stone-500 mt-1">Ask your admin for the company code</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fundex-forest text-white py-2  font-semibold hover:bg-fundex-forest/90 disabled:bg-stone-300 disabled:text-stone-500 transition"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-stone-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-fundex-forest hover:text-fundex-green font-medium">
            Login
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
