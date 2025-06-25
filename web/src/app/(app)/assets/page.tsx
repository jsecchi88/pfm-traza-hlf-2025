"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page can act as a redirect or a general asset overview.
// For now, let's redirect to "My Assets".
export default function AssetsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/assets/my-assets');
  }, [router]);

  return <p>Redirecting to your assets...</p>;
}
