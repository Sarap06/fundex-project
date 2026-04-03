'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logOut } from '@/lib/auth';
import { Clock, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fundex-cream to-fundex-cream p-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-lg shadow-2xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-display font-bold text-center text-foreground mb-2">
            Pending Approval
          </h1>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6">
            Your account is currently pending approval by an administrator. You'll receive an email once your account has been reviewed and approved.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  What happens next?
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  An administrator will review your information and send you an email notification once your account is approved.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>

          {/* Return to Landing Link */}
          <p className="text-center text-muted-foreground text-sm mt-4">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Return to homepage
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
