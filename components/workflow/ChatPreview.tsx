'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Card, CardContent, CardHeader } from '@/components/ui-kit/card';

interface ChatPreviewProps {
  userMessage?: string;
  botMessage?: string;
  onClose: () => void;
}

export default function ChatPreview({ userMessage, botMessage, onClose }: ChatPreviewProps) {
  if (!userMessage && !botMessage) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[90vw]">
      <Card className="shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--card-hover)]/50">
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Run preview</div>
          <Button
            onClick={onClose}
            variant="outline"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Messages */}
        <CardContent className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
          {userMessage && (
            <div className="flex justify-end">
              <div 
                className="max-w-[80%] rounded-[5px] px-4 py-2.5 text-sm relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  border: '1.5px solid #22d3ee',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {userMessage}
              </div>
            </div>
          )}
          {botMessage && (
            <div className="flex justify-start">
              <div 
                className="max-w-[80%] rounded-[5px] px-4 py-2.5 text-sm relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #1f1f1f 0%, #27272a 100%)',
                  border: '1.5px solid #10b981',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                {botMessage}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


