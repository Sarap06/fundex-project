'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminSignUp, companySignUp } from '@/lib/auth';
import Link from 'next/link';
import { CheckCircle, Check } from 'lucide-react';
import { FadeIn } from '@/components/motion-wrapper';

type SignupType = 'admin' | 'company';

export default function Signup() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
          <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
          <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
          <div className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full">
            <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">Sign Up</h1>
            <p className="text-stone-500 mb-6">Create your Fundex account</p>
          </div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signupType, setSignupType] = useState<SignupType>('company');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successCompanyCode, setSuccessCompanyCode] = useState('');
  const [isFromInvite, setIsFromInvite] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const code = searchParams.get('code');
    const inviteEmail = searchParams.get('email');
    const type = searchParams.get('type') as SignupType | null;

    if (code) {
      setCompanyCode(code.toUpperCase());
      setIsFromInvite(true);
      setSignupType('company');
    }

    if (inviteEmail) {
      setEmail(inviteEmail);
      setIsFromInvite(true);
      setSignupType('company');
    }

    if (type === 'admin' || type === 'company') {
      setSignupType(type);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (signupType === 'admin') {
        const result = await adminSignUp(email, password, accessCode);
        setSuccess(true);
        setSuccessCompanyCode(result.companyCode);

        // Redirect to onboarding to complete firm setup
        setTimeout(() => {
          window.location.href = '/onboarding';
        }, 2000);
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          setError('First name and last name are required');
          return;
        }
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await companySignUp(email, password, fullName, companyCode);
        setSuccess(true);

        // Hard redirect to onboarding so middleware picks up the new cookies
        setTimeout(() => {
          window.location.href = '/onboarding';
        }, 2000);
      }
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

  if (!isMounted) {
    return (
      <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
        <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
        <div className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full">
          <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">Sign Up</h1>
          <p className="text-stone-500 mb-6">Create your Fundex account</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
        <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
        <FadeIn className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="text-fundex-forest" size={56} />
          </div>
          <h2 className="text-2xl font-display font-semibold text-fundex-forest mb-4">Signup Successful!</h2>

          {signupType === 'admin' ? (
            <>
              <p className="text-stone-900 mb-4">Your account has been created.</p>
              <div className="bg-fundex-gold/10 border border-fundex-gold/20 rounded p-4 mb-4">
                <p className="text-sm text-stone-900">Your Company Code:</p>
                <p className="text-2xl font-display font-semibold text-fundex-forest">{successCompanyCode}</p>
                <p className="text-xs text-stone-500 mt-2">Share this with your team members</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-stone-900 mb-4">Account created successfully!</p>
              <p className="text-sm text-stone-500 mb-4">
                Setting up your account...
              </p>
            </>
          )}

          <p className="text-sm text-stone-500">Redirecting...</p>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
      <FadeIn className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full">
        <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">Sign Up</h1>
        <p className="text-stone-500 mb-6">Create your Fundex account</p>

        {/* Type Toggle */}
        <div className="mb-6 bg-stone-50  p-1 flex gap-1">
          <button
            type="button"
            onClick={() => setSignupType('company')}
            className={`flex-1 py-2 px-4  font-medium transition-colors ${
              signupType === 'company'
                ? 'bg-fundex-forest text-white'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Company
          </button>
          <button
            type="button"
            onClick={() => setSignupType('admin')}
            className={`flex-1 py-2 px-4  font-medium transition-colors ${
              signupType === 'admin'
                ? 'bg-fundex-forest text-white'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Admin
          </button>
        </div>

        {isFromInvite && signupType === 'company' && (
          <div className="bg-fundex-gold/10 border border-fundex-gold/20  p-3 mb-6 flex items-center gap-2">
            <Check className="text-fundex-forest flex-shrink-0" size={20} />
            <p className="text-sm text-fundex-forest">You were invited to join this company</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Type Fields */}
          {signupType === 'company' && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none"
                  placeholder="Doe"
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
            </>
          )}

          {/* Admin Type Fields */}
          {signupType === 'admin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none"
                  placeholder="admin@company.com"
                />
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
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-stone-200  focus:ring-1 focus:ring-fundex-gold/30 focus:border-fundex-gold outline-none"
                  placeholder="Enter access code"
                />
              </div>
            </>
          )}

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
