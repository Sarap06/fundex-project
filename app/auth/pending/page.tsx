'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logOut } from '@/lib/auth';
import { Clock, AlertCircle } from 'lucide-react';
import { FadeIn } from '@/components/motion-wrapper';

export default function Pending() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    try {
      await logOut();
      router.push('/');
    } catch (err) {
      setError('Failed to logout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white font-sans flex items-center justify-center p-4">
      <div className="pointer-events-none fixed right-0 top-0 z-0 h-[700px] w-[800px]" style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-[500px] w-[600px]" style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }} />
      <div className="relative z-10 w-full max-w-md">
        <FadeIn className=" border border-stone-100 bg-white shadow-sm p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-fundex-gold/10 ">
              <Clock className="w-8 h-8 text-fundex-forest" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-display font-semibold text-center text-stone-900 mb-2">
            Pending Approval
          </h1>

          {/* Description */}
          <p className="text-center text-stone-500 mb-6">
            Your account is currently pending approval by an administrator. You'll receive an email once your account has been reviewed and approved.
          </p>

          {/* Info Box */}
          <div className="bg-stone-50 border border-stone-200  p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-stone-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-stone-900">
                  What happens next?
                </p>
                <p className="text-sm text-stone-600 mt-1">
                  An administrator will review your information and send you an email notification once your account is approved.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200  p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-fundex-forest to-fundex-green hover:from-fundex-green hover:to-fundex-forest disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 px-4  transition-all duration-200"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>

          {/* Return to Landing Link */}
          <p className="text-center text-stone-500 text-sm mt-4">
            <button
              onClick={() => router.push('/')}
              className="text-fundex-forest hover:text-fundex-green underline"
            >
              Return to homepage
            </button>
          </p>
        </FadeIn>
      </div>
    </div>
  );
}
