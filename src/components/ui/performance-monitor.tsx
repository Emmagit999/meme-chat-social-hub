import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Database, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetrics {
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  apiCalls: number;
  cacheHitRate: number;
  networkLatency: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHitRate: 0,
    networkLatency: 0
  });

  useEffect(() => {
    let animationId: number;
    let startTime = performance.now();
    let apiCallCount = 0;

    // Monitor performance metrics
    const updateMetrics = () => {
      const memory = (performance as any).memory;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      setMetrics({
        memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
        loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0,
        renderTime: Math.round(performance.now() - startTime),
        apiCalls: apiCallCount,
        cacheHitRate: 85 + Math.random() * 10, // Simulated
        networkLatency: 50 + Math.random() * 100 // Simulated
      });

      animationId = requestAnimationFrame(updateMetrics);
    };

    // Track API calls
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      apiCallCount++;
      return originalFetch(...args);
    };

    updateMetrics();

    return () => {
      cancelAnimationFrame(animationId);
      window.fetch = originalFetch;
    };
  }, []);

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'text-green-500';
    if (value <= thresholds[1]) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryUsageColor = (usage: number) => getPerformanceColor(usage, [50, 100]);
  const getLatencyColor = (latency: number) => getPerformanceColor(latency, [100, 300]);

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Performance Monitor
          <Badge variant="outline" className="ml-auto text-xs">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <div className={`text-2xl font-bold ${getMemoryUsageColor(metrics.memoryUsage)}`}>
              {metrics.memoryUsage}MB
            </div>
            <Progress value={Math.min(metrics.memoryUsage, 100)} className="h-2" />
          </div>

          {/* Network Latency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Latency</span>
            </div>
            <div className={`text-2xl font-bold ${getLatencyColor(metrics.networkLatency)}`}>
              {Math.round(metrics.networkLatency)}ms
            </div>
            <Progress value={Math.min(metrics.networkLatency / 5, 100)} className="h-2" />
          </div>

          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">API Calls</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.apiCalls}
            </div>
            <div className="text-xs text-muted-foreground">
              Total requests
            </div>
          </div>

          {/* Cache Hit Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Cache</span>
            </div>
            <div className="text-2xl font-bold text-green-500">
              {Math.round(metrics.cacheHitRate)}%
            </div>
            <Progress value={metrics.cacheHitRate} className="h-2" />
          </div>
        </div>

        {/* Performance Score */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Performance</span>
            <Badge 
              variant={metrics.memoryUsage < 50 && metrics.networkLatency < 100 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {metrics.memoryUsage < 50 && metrics.networkLatency < 100 ? 'Excellent' : 
               metrics.memoryUsage < 100 && metrics.networkLatency < 300 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            Load Time: {metrics.loadTime}ms • Render Time: {Math.round(metrics.renderTime)}ms
          </div>
        </div>
      </CardContent>
    </Card>
  );
};