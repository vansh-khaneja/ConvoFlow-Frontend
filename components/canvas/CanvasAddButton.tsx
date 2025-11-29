'use client';

import React from 'react';
import { Panel } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui-kit/tooltip';

interface CanvasAddButtonProps {
  onAddNode?: () => void;
}

export default function CanvasAddButton({ onAddNode }: CanvasAddButtonProps) {
  return (
    <Panel position="top-right" className="bg-transparent shadow-none border-none p-0" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onAddNode}
              size="default"
              className="flex items-center gap-2.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_12px_rgba(139,92,246,0.4)] transition-all duration-200 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 group"
              aria-label="Add Node"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Node</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to add a new node to your workflow</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Panel>
  );
}
