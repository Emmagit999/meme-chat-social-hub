import React, { useState } from 'react';
import { Wifi, WifiOff, Activity, Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useConnectionManager } from '@/hooks/use-connection-manager';
import { useNetworkOptimizer } from '@/hooks/use-network-optimizer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const NetworkStatus: React.FC = () => {
  const { connectionState, forceReconnect } = useConnectionManager();
  const { getNetworkStats } = useNetworkOptimizer();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (!connectionState.isOnline) return 'text-red-500';
    switch (connectionState.connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'poor': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getStatusIcon = () => {
    if (!connectionState.isOnline) return <WifiOff className="h-4 w-4" />;
    switch (connectionState.connectionQuality) {
      case 'excellent': return <Zap className="h-4 w-4" />;
      case 'good': return <Wifi className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (!connectionState.isOnline) return 'Offline';
    return connectionState.connectionQuality.charAt(0).toUpperCase() + 
           connectionState.connectionQuality.slice(1);
  };

  const stats = getNetworkStats();

  return (
    <Popover open={showDetails} onOpenChange={setShowDetails}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`${getStatusColor()} hover:bg-primary/10 transition-all duration-300`}
        >
          {getStatusIcon()}
          <span className="ml-2 text-xs font-medium">{getStatusText()}</span>
          {connectionState.latency > 0 && (
            <Badge variant="outline" className="ml-2 text-xs">
              {Math.round(connectionState.latency)}ms
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4 bg-card border border-border rounded-xl shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Network Status</h3>
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Connection</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Online: {connectionState.isOnline ? '✓' : '✗'}</div>
                <div>Connected: {connectionState.isConnected ? '✓' : '✗'}</div>
                <div>Latency: {Math.round(connectionState.latency)}ms</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Cache</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Size: {stats.cache.size} items</div>
                <div>Hit Rate: {Math.round(stats.cache.hitRate * 100)}%</div>
                <div>Avg Age: {Math.round(stats.cache.averageAge / 1000)}s</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Optimization</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Active Channels: {stats.activeChannels}</div>
              <div>Total Accesses: {stats.cache.totalAccesses}</div>
              <div>Last Ping: {new Date(connectionState.lastPing).toLocaleTimeString()}</div>
            </div>
          </div>

          {(!connectionState.isConnected || connectionState.connectionQuality === 'poor') && (
            <Button 
              onClick={forceReconnect} 
              className="w-full bg-gradient-to-r from-primary to-accent text-white
                         hover:scale-105 transition-all duration-300"
              size="sm"
            >
              Reconnect Now
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};