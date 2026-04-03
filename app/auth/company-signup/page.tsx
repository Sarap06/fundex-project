import { Suspense } from 'react';
import { CompanySignUpForm } from './company-sign-up-form';

export default function CompanySignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-fundex-cream to-fundex-cream flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CompanySignUpForm />
    </Suspense>
  );
}
