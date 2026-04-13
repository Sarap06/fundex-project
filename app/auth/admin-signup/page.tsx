'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSignUp } from '@/lib/auth';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { FadeIn } from '@/components/motion-wrapper';

export default function AdminSignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [companyCode, setCompanyCode] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await adminSignUp(email, password, accessCode);
      setSuccess(true);
      setCompanyCode(result.companyCode);

      // Store session if available
      if (result.session) {
        document.cookie = `sb-auth-token=${result.session.access_token}; path=/`;
      }

      // Redirect to dashboard immediately for admin (no approval needed)
      setTimeout(() => {
        router.push('/admin');
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
          <p className="text-stone-900 mb-4">Your account has been created.</p>
          <div className="bg-fundex-gold/10 border border-fundex-gold/20 rounded p-4 mb-4">
            <p className="text-sm text-stone-900">Your Company Code:</p>
            <p className="text-2xl font-display font-semibold text-fundex-forest">{companyCode}</p>
            <p className="text-xs text-stone-500 mt-2">Share this with your team members</p>
          </div>
          <p className="text-sm text-stone-500">Redirecting to dashboard...</p>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
      <FadeIn className="relative z-10  border border-stone-100 bg-white shadow-sm p-8 max-w-md w-full">
        <h1 className="text-3xl font-display font-semibold text-stone-900 mb-2">Admin Signup</h1>
        <p className="text-stone-500 mb-6">Create your Fundex admin account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Link href="/auth/login" className="text-fundex-forest hover:text-fundex-green">
            Login
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
