'use client';

import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export default function ProtectedWrapper({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}