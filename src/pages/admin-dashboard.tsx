import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitor } from '@/components/ui/performance-monitor';
import { NetworkStatus } from '@/components/ui/network-status';
import { useOptimizedPresence } from '@/hooks/use-optimized-presence';
import { useNetworkOptimizer } from '@/hooks/use-network-optimizer';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Database, Zap, Eye } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { totalOnline, onlineUsers } = useOptimizedPresence();
  const { getNetworkStats } = useNetworkOptimizer();
  
  const networkStats = getNetworkStats();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Real-time app monitoring and performance analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <NetworkStatus />
            <Badge variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-500">
                <Users className="h-5 w-5" />
                Online Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalOnline}</div>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-500">
                <Activity className="h-5 w-5" />
                Connection Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground capitalize">
                {networkStats.connection.connectionQuality}
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round(networkStats.connection.latency)}ms latency
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-500">
                <Database className="h-5 w-5" />
                Cache Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(networkStats.cache.hitRate * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">
                {networkStats.cache.size} cached items
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <Zap className="h-5 w-5" />
                Real-time Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {networkStats.activeChannels}
              </div>
              <p className="text-sm text-muted-foreground">Active connections</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <PerformanceMonitor />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Online Users ({totalOnline})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onlineUsers.map((user) => (
                    <div 
                      key={user.user_id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          user.status === 'online' ? 'bg-green-500' : 
                          user.status === 'away' ? 'bg-yellow-500' : 
                          user.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={networkStats.connection.isConnected ? 'default' : 'destructive'}>
                      {networkStats.connection.isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality:</span>
                    <span className="font-medium capitalize">{networkStats.connection.connectionQuality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="font-medium">{Math.round(networkStats.connection.latency)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Ping:</span>
                    <span className="font-medium">
                      {new Date(networkStats.connection.lastPing).toLocaleTimeString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache Size:</span>
                    <span className="font-medium">{networkStats.cache.size} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hit Rate:</span>
                    <span className="font-medium">{Math.round(networkStats.cache.hitRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Accesses:</span>
                    <span className="font-medium">{networkStats.cache.totalAccesses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Age:</span>
                    <span className="font-medium">{Math.round(networkStats.cache.averageAge / 1000)}s</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;