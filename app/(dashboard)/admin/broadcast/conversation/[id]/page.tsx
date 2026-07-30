'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConversationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/broadcast');
  }, [router]);

  return null;
}
