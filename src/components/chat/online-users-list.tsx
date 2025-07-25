import React from 'react';
import { usePresence } from '@/hooks/use-presence';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { OnlineIndicator } from '@/components/ui/online-indicator';

export const OnlineUsersList: React.FC = () => {
  const { onlineUsers } = usePresence();

  if (onlineUsers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No users online
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Online Now</h3>
      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div key={user.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <OnlineIndicator userId={user.user_id} className="bottom-0 right-0" size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};