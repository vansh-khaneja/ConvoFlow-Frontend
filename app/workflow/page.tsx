'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWorkflowState } from '@/hooks/useWorkflowState';
import { useWorkflow } from '@/hooks/useWorkflowQueries';
import { useWorkflowNav } from '@/contexts/WorkflowNavContext';
import WorkflowManager from '@/components/workflow/WorkflowManager';
import NodeConfigStorage from '@/utils/nodeConfigStorage';
import ChatPreview from '@/components/workflow/ChatPreview';
import ExecutionResults from '@/components/workflow/ExecutionResults';
import { WorkflowLoadingAnimation } from '@/components/workflow/WorkflowLoadingAnimation';
import { WorkflowCanvasContainer } from '@/components/workflow/WorkflowCanvasContainer';
import { useWorkflowChangeDetection } from '@/hooks/useWorkflowChangeDetection';
import { useWorkflowLoader } from '@/hooks/useWorkflowLoader';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { useWorkflowDeployment } from '@/hooks/useWorkflowDeployment';
import { LoadingSpinner } from '@/components/ui-kit/loading-spinner';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Force dynamic rendering - this page uses searchParams and is always dynamic
export const dynamic = 'force-dynamic';

function WorkflowBuilderContent() {
  const searchParams = useSearchParams();
  const [workflowIdState, setWorkflowIdState] = useState<string | null>(searchParams?.get('id') || null);
  const workflowId = workflowIdState || searchParams?.get('id');
  const templateId = searchParams?.get('template');
  
  // Update workflowId state when searchParams changes
  useEffect(() => {
    const idFromParams = searchParams?.get('id');
    if (idFromParams) {
      setWorkflowIdState(idFromParams);
    }
  }, [searchParams]);
  
  // 🚀 React Query: Fetch workflow with stale-while-revalidate
  const { data: workflowData, isLoading: isLoadingWorkflow } = useWorkflow(workflowId);
  
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [chatPreview, setChatPreview] = useState<{ user?: string; bot?: string } | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const { setWorkflowMeta, clearWorkflowMeta } = useWorkflowNav();
  
  // Use the custom hook for workflow state management
  const {
    nodesData,
    showNodeSidebar,
    executingEdges,
    executingNodes,
    loading,
    nodes,
    edges,
    setNodes,
    setEdges,
    setShowNodeSidebar,
    setExecutingEdges,
    setExecutingNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    handleNodeSelect,
    handleNodeClick,
    handleNodeDelete
  } = useWorkflowState();

  // Use deployment hook
  const {
    deploymentStatus,
    isDeploying,
    setIsDeploying,
    updateDeploymentStatusImmediately,
    setDeploymentStatus
  } = useWorkflowDeployment(workflowId);

  // Use change detection hook
  const {
    savedWorkflowSnapshot,
    isInitialLoad,
    hasUnsavedChanges,
    updateSnapshot,
    resetInitialLoad,
    clearSnapshot,
    setSavedWorkflowSnapshot,
    setHasUnsavedChanges
  } = useWorkflowChangeDetection({
    nodes,
    edges,
    isLoadingWorkflow
  });

  // Use workflow loader hook
  const { handleLoadWorkflow } = useWorkflowLoader({
    workflowId,
    templateId,
    workflowData,
    isLoadingWorkflow,
    handleNodeDelete,
    setNodes,
    setEdges,
    setWorkflowName,
    onWorkflowLoaded: (loadedNodes, loadedEdges, shouldMarkUnsaved = false) => {
      resetInitialLoad();
      updateSnapshot(loadedNodes, loadedEdges);
      if (shouldMarkUnsaved) {
        // For templates and file loads, mark as unsaved after snapshot is created
        setTimeout(() => {
          setHasUnsavedChanges(true);
        }, 250);
      }
    }
  });

  // Clear workflow state when no ID
  useEffect(() => {
    if (!workflowId) {
      setDeploymentStatus(null);
      clearSnapshot();
      setWorkflowName('Untitled Workflow');
    }
    // Only run when workflowId changes (when switching between workflows or creating new one)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Update snapshot when workflow ID changes (after save/deploy)
  useEffect(() => {
    if (workflowId && nodes.length > 0) {
      setHasUnsavedChanges(false);
      updateSnapshot(nodes, edges);
      resetInitialLoad();
    }
  }, [workflowId]); // Only when workflowId changes

  // Use workflow execution hook
  const {
    isExecuting,
    executionResults,
    handleExecuteWorkflow,
    handleContinueConversation,
    setExecutionResults
  } = useWorkflowExecution({
    nodes,
    edges,
    setNodes,
    setExecutingEdges,
    setExecutingNodes,
    onChatPreview: setChatPreview,
    conversationHistory,
    onConversationUpdate: setConversationHistory
  });

  // Initialize workflow management
  const handleRenameWorkflow = useCallback(
    async (newName: string) => {
      const trimmed = newName.trim() || 'Untitled Workflow';
      if (trimmed === workflowName) {
        return;
      }

      if (!workflowId) {
        // For new workflows, update immediately
        setWorkflowName(trimmed);
        toast.success('Workflow renamed');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/v1/workflows/${workflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed })
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to rename workflow');
        }
        setWorkflowName(trimmed);
        toast.success('Workflow renamed');
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to rename workflow');
      }
    },
    [workflowId, workflowName]
  );

  useEffect(() => {
    setWorkflowMeta({ id: workflowId, name: workflowName, onRename: handleRenameWorkflow });
  }, [workflowId, workflowName, handleRenameWorkflow, setWorkflowMeta]);

  useEffect(() => () => clearWorkflowMeta(), [clearWorkflowMeta]);

  const workflowManager = WorkflowManager({
    nodes,
    edges,
    onSaveWorkflow: () => {},
    onSaveWorkflowToBackend: () => {},
    onLoadWorkflow: handleLoadWorkflow,
    workflowId: workflowId,
    workflowName,
    onDeploymentComplete: () => {
      // Immediately update UI to show deployed state (optimistic update)
      updateDeploymentStatusImmediately();
      // Clear unsaved changes flag since deployment saves the workflow
      setHasUnsavedChanges(false);
      // Update snapshot to current state after deployment
      updateSnapshot(nodes, edges);
    },
    onDeploymentStatusChange: (deploying: boolean) => {
      setIsDeploying(deploying);
    },
    onSaveStatusChange: (saving: boolean) => {
      setIsSaving(saving);
    },
    onSaveComplete: () => {
      // Clear unsaved changes flag after successful save
      setHasUnsavedChanges(false);
      // Update snapshot to current state after save
      updateSnapshot(nodes, edges);
    },
    onWorkflowNameChange: (name: string) => {
      if (name && name.trim()) {
        setWorkflowName(name.trim());
      }
    },
    onWorkflowIdChange: (id: string | null) => {
      // Update workflowId state when a new workflow is saved
      if (id) {
        setWorkflowIdState(id);
      }
    }
  });

  // Handler for updating node parameters (e.g., collection selection)
  const handleUpdateParameters = (nodeId: string, parameters: any) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        // Save to memory cache using nodeId directly
        NodeConfigStorage.saveNodeConfig(nodeId, parameters);

        return {
          ...node,
          data: {
            ...node.data,
            parameters: {
              ...(node.data as any).parameters,
              ...parameters
            }
          }
        };
      }
      return node;
    });

    // Update the nodes state
    setNodes(updatedNodes);
  };

  // Show loading animation while nodes are being fetched
  if (loading) {
    return <WorkflowLoadingAnimation />;
  }

  return (
    <div className="flex flex-col h-screen pt-16" style={{ background: 'var(--background)' }}>
      {/* Main Content Area */}
      <WorkflowCanvasContainer
        nodes={nodes}
        edges={edges}
        executingNodes={executingNodes}
        executingEdges={executingEdges}
        showNodeSidebar={showNodeSidebar}
        nodesData={nodesData}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onSaveWorkflow={workflowManager.handleSaveWorkflow}
        onSaveWorkflowToBackend={workflowManager.handleSaveWorkflowToBackend}
        onLoadWorkflow={workflowManager.handleUploadWorkflow}
        onExecute={handleExecuteWorkflow}
        onDeployWorkflow={workflowManager.handleDeployWorkflow}
        onAddNode={handleAddNode}
        isExecuting={isExecuting}
        onUpdateParameters={handleUpdateParameters}
        deploymentStatus={deploymentStatus}
        isDeploying={isDeploying}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onNodeSelect={handleNodeSelect}
        onCloseNodeSidebar={() => setShowNodeSidebar(false)}
        workflowName={workflowName}
        onRename={handleRenameWorkflow}
      />

      {/* Chat Preview */}
      {chatPreview && (chatPreview.user || chatPreview.bot) && (
        <ChatPreview
          messages={conversationHistory}
          onClose={() => {
            setChatPreview(null);
            setConversationHistory([]);
          }}
          onSendMessage={handleContinueConversation}
          isExecuting={isExecuting}
          isSidebarOpen={showNodeSidebar}
        />
      )}

      {/* Execution Results - Only show on errors */}
      {executionResults && !executionResults.success && (
        <ExecutionResults
          results={executionResults}
          onClose={() => setExecutionResults(null)}
          onRetry={handleExecuteWorkflow}
        />
      )}
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen" style={{ background: '#0D0C14', color: '#a1a1aa' }}>
        <LoadingSpinner size="lg" text="Loading ..." />
      </div>
    }>
      <WorkflowBuilderContent />
    </Suspense>
  );
}
