'use client';

import React from 'react';
import { Plus, Key, Layers, Workflow, Play } from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui-kit/tabs';
import { WorkflowsTab } from './tabs/WorkflowsTab';
import { ExecutionsTab } from './tabs/ExecutionsTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { LogsTab } from './tabs/LogsTab';
import { CredentialsTab } from './tabs/CredentialsTab';

interface MainContentProps {
  userName: string;
  activeTab: string;
}

export function MainContent({ userName, activeTab }: MainContentProps) {
  if (activeTab === 'credentials') {
    return (
      <div className="flex-1 bg-[var(--background)] overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl flex items-center gap-3 mb-2">
                  <Key className="h-10 w-10" />
                  Credentials
                </h1>
                <p className="text-[var(--text-muted)] text-lg">
                  Manage your API keys and credentials
                </p>
              </div>
            </div>
          </div>

          <CredentialsTab />
        </div>
      </div>
    );
  }

  if (activeTab === 'templates') {
    return (
      <div className="flex-1 bg-[var(--background)] overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl flex items-center gap-3 mb-2">
                  <Layers className="h-10 w-10" />
                  Templates
                </h1>
                <p className="text-[var(--text-muted)] text-lg">
                  Start with pre-built workflow templates
                </p>
              </div>
            </div>
          </div>

          <TemplatesTab />
        </div>
      </div>
    );
  }

  if (activeTab === 'logs') {
    return <LogsTab />;
  }

  return (
    <div className="flex-1 bg-[var(--background)] overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl flex items-center gap-3 mb-2">
                <Workflow className="h-10 w-10" />
                Overview
              </h1>
              <p className="text-[var(--text-muted)] text-lg">
                Manage your workflows and executions
              </p>
            </div>
            <Button size="lg" onClick={() => (window.location.href = '/workflow')}>
              <Plus className="h-5 w-5" />
              Create Workflow
            </Button>
          </div>
        </div>

        <Tabs defaultValue="workflows" className="space-y-6" id="main-tabs">
          <TabsList className="rounded-[5px]" style={{ backgroundColor: '#211F2D' }}>
            <TabsTrigger value="workflows">
              <Workflow className="h-3 w-3" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="executions">
              <Play className="h-3 w-3" />
              Executions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <WorkflowsTab userName={userName} />
          </TabsContent>

          <TabsContent value="executions">
            <ExecutionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

