'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  useEffect(() => {
    // Redirect to create page with edit parameter
    router.replace(`/provider/services/create?edit=${serviceId}`);
  }, [serviceId, router]);

  // Return null or loading state while redirecting
  return null;
}
