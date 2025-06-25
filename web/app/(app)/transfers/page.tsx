"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransfersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/transfers/view');
  }, [router]);

  return <p>Redirecting to view transfers...</p>;
}
