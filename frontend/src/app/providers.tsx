'use client'

import React from 'react'
import { StoreSync } from '@/components/StoreSync'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreSync />
      {children}
    </>
  )
}
