'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSignUp } from '@/lib/auth';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

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
        router.push('/dashboard/admin');
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
          <p className="text-gray-900 mb-4">Your account has been created.</p>
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded p-4 mb-4">
            <p className="text-sm text-gray-900">Your Company Code:</p>
            <p className="text-2xl font-bold text-emerald-600">{companyCode}</p>
            <p className="text-xs text-gray-700 mt-2">Share this with your team members</p>
          </div>
          <p className="text-sm text-gray-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Signup</h1>
        <p className="text-gray-700 mb-6">Create your Fundex admin account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="admin@company.com"
            />
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
              Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
            className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-700 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-emerald-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
