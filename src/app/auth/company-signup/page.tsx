import { Suspense } from 'react';
import { CompanySignUpForm } from './CompanySignUpForm';

export default function CompanySignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    }>
      <CompanySignUpForm />
    </Suspense>
  );
}
