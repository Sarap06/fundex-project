'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logIn } from '@/lib/auth';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await logIn(email, password);
      
      // Store session
      if (result.session) {
        document.cookie = `sb-auth-token=${result.session.access_token}; path=/`;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Failed to get user:', userError);
        setError('Failed to retrieve user information');
        return;
      }

      // Get user profile directly from Supabase
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('No profile found for user:', profileError);
        setError('User profile not found. Please contact support.');
        return;
      }

      // Redirect based on role - check role first (most reliable)
      const userRole = profile.role;

      if (userRole === 'admin') {
        // Admins ALWAYS go directly to dashboard (no approval needed)
        router.push('/admin');
      } else if (userRole === 'partner') {
        router.push('/company');
      } else if (userRole === 'investor') {
        router.push('/investor');
      } else {
        // pending role - goes to pending page
        router.push('/auth/pending');
      }
    } catch (err: Error | unknown) {
      if (err instanceof Error) {
        console.error('Login error:', err);
        setError(err.message || 'Login failed');
      } else {
        console.error('Login error:', err);
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fundex-cream to-fundex-cream flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Login</h1>
        <p className="text-muted-foreground mb-6">Sign in to your Fundex account</p>

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              suppressHydrationWarning
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              suppressHydrationWarning
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
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
            suppressHydrationWarning
            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted-foreground transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 border-t pt-6">
          <p className="text-sm text-muted-foreground mb-3">New to Fundex?</p>
          <Link
            href="/auth/signup"
            className="block w-full text-center bg-fundex-cream/50 text-primary py-2 rounded-lg hover:bg-primary/10 transition text-sm"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
