'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui-kit/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui-kit/tabs';
import { Button } from '@/components/ui-kit/button';
import { Card, CardContent } from '@/components/ui-kit/card';

interface ExecutionResultsProps {
  results: any;
  onClose: () => void;
}

export default function ExecutionResults({ results, onClose }: ExecutionResultsProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'errors'>('results');

  if (!results) return null;

  const isSuccess = results.success !== false;
  const data = results.data || {};
  
  // Collect errors from multiple sources
  const allErrors: Record<string, string> = {};
  
  // Errors from backend exceptions (data.errors)
  if (data.errors) {
    Object.entries(data.errors).forEach(([nodeId, error]: [string, any]) => {
      allErrors[nodeId] = String(error);
    });
  }
  
  // Errors from node outputs (metadata.error, success: false)
  if (data.response_inputs) {
    Object.entries(data.response_inputs).forEach(([nodeId, nodeData]: [string, any]) => {
      if (nodeData.success === false) {
        const errorMsg = nodeData.metadata?.error || nodeData.error || 'Node execution failed';
        allErrors[nodeId] = errorMsg;
      } else if (nodeData.metadata?.error) {
        allErrors[nodeId] = nodeData.metadata.error;
      }
    });
  }
  
  const hasErrors = Object.keys(allErrors).length > 0;
  const hasResults = Object.keys(data.response_inputs || {}).length > 0;

  return (
    <Dialog open={!!results} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Execution Results</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'results' | 'errors')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">
              Results ({Object.keys(data.response_inputs || {}).length})
            </TabsTrigger>
            {hasErrors && (
              <TabsTrigger value="errors">
                Errors ({Object.keys(data.errors || {}).length})
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {!isSuccess ? (
              <Card className="border-red-600 bg-red-900/30">
                <CardContent className="p-4">
                  <h3 className="text-red-300 font-medium mb-2">Execution Failed</h3>
                  <p className="text-red-200 text-sm">{results.error || 'Unknown error occurred'}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <TabsContent value="results" className="mt-0">
                  <div className="space-y-4">
                    {hasResults && data?.response_inputs ? (
                      Object.entries(data.response_inputs).map(([nodeId, inputs]: [string, any]) => {
                        // Determine if this is a DebugNode based on the output keys
                        const isDebugNode = inputs && 'debug_info' in inputs;
                        const nodeType = isDebugNode ? 'Debug Node' : 'Response Node';
                        const borderColor = isDebugNode ? 'border-orange-500' : 'border-green-500';

                        return (
                          <Card key={nodeId} className={borderColor}>
                            <CardContent className="p-4">
                              <h3 className="text-white font-medium mb-2">{nodeType}: {nodeId}</h3>
                              <div className="space-y-2">
                                {Object.entries(inputs || {}).map(([key, value]: [string, any]) => (
                                  <div key={key} className="flex items-start space-x-2">
                                    <span className="text-gray-300 text-sm font-medium min-w-[100px]">{key}:</span>
                                    <div className="flex-1">
                                      {typeof value === 'object' ? (
                                        <pre className="text-gray-200 text-sm bg-[#1a1a1a] border border-[#404040] p-2 rounded-[5px] overflow-x-auto">
                                          {JSON.stringify(value, null, 2)}
                                        </pre>
                                      ) : (
                                        <span className="text-gray-200 text-sm">{String(value)}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-gray-300 text-center py-8">
                        No response data available
                      </div>
                    )}
                  </div>
                </TabsContent>

                {hasErrors && (
                  <TabsContent value="errors" className="mt-0">
                    <div className="space-y-4">
                      {Object.entries(allErrors).map(([nodeId, error]: [string, string]) => (
                        <Card key={nodeId} className="border-red-600 bg-red-900/30">
                          <CardContent className="p-4">
                            <h3 className="text-red-300 font-medium mb-2">Node: {nodeId}</h3>
                            <p className="text-red-200 text-sm whitespace-pre-wrap">{error}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {isSuccess && !hasResults && !hasErrors && data && (
                  <div className="text-gray-300 text-center py-8">
                    No execution data available
                  </div>
                )}
              </>
            )}
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            Executed {data.executed_nodes?.length || 0} nodes
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(results, null, 2))}
            >
              Copy Results
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
