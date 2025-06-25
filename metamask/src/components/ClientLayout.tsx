'use client';

import { Web3Provider } from '@/context/Web3Context';
import Header from '@/components/Header';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <Header />
      {children}
    </Web3Provider>
  );
}
