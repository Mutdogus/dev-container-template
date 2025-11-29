export interface SpeckitTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  story: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
  metadata: Record<string, unknown>;
}