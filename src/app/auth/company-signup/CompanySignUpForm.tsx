'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { companySignUp } from '@/lib/auth';
import Link from 'next/link';
import { CheckCircle, Check } from 'lucide-react';

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

  useEffect(() => {
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

      // Redirect to pending page after 2 seconds
      setTimeout(() => {
        router.push('/auth/pending');
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4"><CheckCircle className="text-emerald-600" size={56} /></div>
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">Signup Successful!</h2>
          <p className="text-gray-900 mb-4">Your joining request has been sent to the admin.</p>
          <p className="text-sm text-gray-700 mb-4">
            You will be redirected once admin approves your request.
          </p>
          <p className="text-sm text-gray-700">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Signup</h1>
        <p className="text-gray-700 mb-6">{isFromInvite ? 'Complete your registration' : 'Join a Fundex company'}</p>

        {isFromInvite && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <Check className="text-emerald-900 flex-shrink-0" size={20} />
            <p className="text-sm text-emerald-900">You were invited to join this company</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFromInvite}
              required
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                isFromInvite ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="user@example.com"
            />
            {isFromInvite && <p className="text-xs text-gray-700 mt-1">Pre-filled from your invitation</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Company Code
            </label>
            <input
              type="text"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              disabled={isFromInvite}
              required
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                isFromInvite ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="ABC123"
            />
            {isFromInvite ? (
              <p className="text-xs text-gray-700 mt-1">Pre-filled from your invitation</p>
            ) : (
              <p className="text-xs text-gray-700 mt-1">Ask your admin for the company code</p>
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
            className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-700 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-emerald-600 hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
