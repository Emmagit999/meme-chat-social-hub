
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Trash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    isLoading 
  } = useNotifications();
  const isMobile = useIsMobile();

  // Ask for notification permissions when the page loads
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400">Like</Badge>;
      case 'comment':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400">Comment</Badge>;
      case 'friend':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400">Friend</Badge>;
      case 'message':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">Message</Badge>;
      default:
        return <Badge variant="outline" className="bg-purple-500/20 text-purple-400">Alert</Badge>;
    }
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={clearNotifications}>
            <Trash className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse-subtle text-lg">Loading notifications...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl mb-2">No notifications yet</h2>
          <p className="text-muted-foreground">We'll notify you when something happens</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-lg ${notification.read ? 'bg-card' : 'bg-muted'} border border-border hover:border-accent transition-colors`}
            >
              <div className="flex items-center gap-4">
                <Link to={`/profile/${notification.fromUserId}`}>
                  <Avatar>
                    <AvatarImage src={notification.avatar} />
                    <AvatarFallback>{notification.from.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${notification.fromUserId}`} className="font-medium hover:underline">
                      {notification.from}
                    </Link>
                    {getNotificationIcon(notification.type)}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{notification.content}</p>
                </div>
                
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
