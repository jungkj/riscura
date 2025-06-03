'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Risk } from '@/types';

interface ExecutiveSummaryProps {
  data: any;
  risks: Risk[];
  viewMode: string;
}

export function ExecutiveSummary({ data, risks, viewMode }: ExecutiveSummaryProps) {
  return (
    <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#191919] font-inter">
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#A8A8A8] font-inter">
          Your personalized risk management summary will appear here.
        </p>
      </CardContent>
    </Card>
  );
} 