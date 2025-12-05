'use client';

import React, { useState, useEffect } from 'react';

interface FinalTourMessageProps {
  onClose?: () => void;
  sidebarOffset?: number; // Sidebar offset to match ChatPreview position
}

export default function FinalTourMessage({ onClose, sidebarOffset = 0 }: FinalTourMessageProps) {
  const [chatPreviewPos, setChatPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 1080);

  useEffect(() => {
    // Find the ChatPreview element in the DOM
    const findChatPreview = () => {
      // Method 1: Find by data attribute (most reliable)
      const chatPreview = document.querySelector('[data-chat-preview="true"]') as HTMLElement;
      if (chatPreview) {
        const rect = chatPreview.getBoundingClientRect();
        // Return the left edge and vertical center for positioning the tip
        return {
          x: rect.left, // Left edge of chat preview
          y: rect.top + rect.height / 2 // Vertical center
        };
      }

      // Method 2: Find by looking for fixed positioned divs with specific width (380px)
      const fixedDivs = Array.from(document.querySelectorAll('div[style*="fixed"]'));
      const chatPreviewByWidth = fixedDivs.find(div => {
        const style = (div as HTMLElement).style;
        const width = style.width || '';
        return width.includes('380') || width.includes('90vw');
      }) as HTMLElement | undefined;

      if (chatPreviewByWidth) {
        const rect = chatPreviewByWidth.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top + rect.height / 2
        };
      }

      // Method 3: Find by text content "Chat Preview" or "Run preview"
      const allDivs = Array.from(document.querySelectorAll('div'));
      const chatPreviewByText = allDivs.find(el => {
        const text = el.textContent || '';
        return (text.includes('Chat Preview') || text.includes('Run preview')) && 
               el.closest('[style*="fixed"]');
      });

      if (chatPreviewByText) {
        const container = chatPreviewByText.closest('[style*="fixed"]') as HTMLElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + rect.height / 2
          };
        }
      }

      // Fallback: Calculate position based on ChatPreview's expected position
      const chatPreviewWidth = 380; // w-[380px]
      const bottomOffset = 16; // bottom-4 = 16px
      const rightPosition = sidebarOffset + 16; // margin
      
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate position (left edge and vertical center of chat preview)
      const x = viewportWidth - rightPosition - chatPreviewWidth;
      const y = viewportHeight - bottomOffset - 200; // Approximate center
      
      return { x, y };
    };

    // Use a polling approach to find ChatPreview when it appears
    let attempts = 0;
    const maxAttempts = 30; // Try for 3 seconds (30 * 100ms)
    
    const findAndSetPosition = () => {
      const pos = findChatPreview();
      // Always set position, even if it's the fallback
      if (pos) {
        setChatPreviewPos(pos);
        // If we found a valid position (not fallback), stop polling
        if (pos.x > 0 && pos.y > 0 && pos.x < window.innerWidth && pos.y < window.innerHeight) {
          return; // Found valid position, stop
        }
      }
      
      // Continue polling if we haven't found a good position yet
      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(findAndSetPosition, 100);
      } else {
        // Use fallback after max attempts - always show something
        const fallbackPos = findChatPreview();
        setChatPreviewPos(fallbackPos || { x: window.innerWidth - 400, y: window.innerHeight - 200 });
      }
    };

    // Initial check
    findAndSetPosition();

    // Update on resize
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setViewportWidth(window.innerWidth);
        setViewportHeight(window.innerHeight);
      }
      const pos = findChatPreview();
      if (pos) setChatPreviewPos(pos);
    };

    // Set initial viewport dimensions
    if (typeof window !== 'undefined') {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOffset]);

  // Always show the tip, even if position isn't perfect
  // Use fallback position if chatPreviewPos is null
  const displayPos = chatPreviewPos || { 
    x: viewportWidth - 400, 
    y: viewportHeight - 200 
  };

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* Overlay - subtle, only blocks interactions */}
      <div 
        className="absolute inset-0 bg-black/20"
        style={{ pointerEvents: 'auto' }}
        onClick={onClose}
      />
      
      {/* Tour tip pointing to ChatPreview */}
      <div 
        className="fixed z-[71] pointer-events-none"
        style={{
          left: `${Math.max(16, Math.min(displayPos.x - 300, viewportWidth - 320))}px`, // Position to the left of chat preview, with margin, ensure it's on screen
          top: `${Math.max(16, Math.min(displayPos.y, viewportHeight - 200))}px`, // Vertically centered, ensure it's on screen
          transform: 'translateY(-50%)'
        }}
      >
        <div className="relative w-72 rounded-lg border border-[var(--primary)]/40 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 px-3 py-2.5 text-xs shadow-lg pointer-events-auto">
          {/* Arrow pointing right to ChatPreview */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-[var(--primary)]/40"
            style={{
              right: '-8px' // Arrow tip points to chat preview
            }}
          ></div>
          <p className="font-semibold text-[var(--foreground)] mb-1">
            Step 7 · Chat Preview
          </p>
          <p className="text-[var(--text-muted)] mb-2">
            Users can see their <span className="font-semibold">chat preview</span> here for testing and debugging. <span className="font-semibold">Tour complete! 🎉</span>
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-medium px-2 py-1 rounded bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

