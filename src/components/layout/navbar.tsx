import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Home, MessageSquare, Search, User, LogOut, Bell, Github, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLogo from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export const Navbar = () => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  
  const getNotifications = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        id: 1,
        type: 'message',
        from: 'joke_master',
        avatar: '/assets/avatar2.jpg',
        content: 'Hey, check out my new meme!',
        time: '10m ago',
        read: false
      },
      {
        id: 2,
        type: 'like',
        from: 'meme_lover',
        avatar: '/assets/avatar1.jpg',
        content: 'liked your post about programming memes',
        time: '1h ago',
        read: true
      }
    ];
  };
  
  const [notifications, setNotifications] = useState(getNotifications());
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };
  
  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    toast.success('All notifications cleared');
  };
  
  const getUserAvatar = () => {
    if (user && user.avatar) {
      return user.avatar;
    }
    return "/assets/avatar1.jpg";
  };
  
  const getUserInitials = () => {
    if (user && user.displayName) {
      return user.displayName.substring(0, 2).toUpperCase();
    }
    if (user && user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "ME";
  };
  
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5" /> },
    { name: 'Merge', path: '/merge', icon: <Github className="h-5 w-5" /> },
    { name: 'Pals', path: '/pals', icon: <UserPlus className="h-5 w-5" /> },
    { name: 'Chat', path: '/chat', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Search', path: '/search', icon: <Search className="h-5 w-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="h-5 w-5" /> },
  ];

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <Link to="/" className="flex items-center gap-2">
            <AppLogo size={32} />
            <h1 className="text-xl font-bold text-yellow-500">Meme Chat</h1>
          </Link>
        </div>
        <div className="px-4">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto p-4">
        <Button
          variant="outline"
          className="w-full justify-start text-red-500"
          onClick={() => {
            logout();
            toast.success("Logged out successfully");
          }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              {navContent}
            </SheetContent>
          </Sheet>
        ) : null}
        
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <AppLogo size={24} />
            <h1 className="hidden md:block text-lg font-bold text-yellow-500">
              Meme Chat
            </h1>
          </Link>
        </div>
        
        {!isMobile && (
          <nav className="flex items-center space-x-2 ml-6">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  size="sm"
                  className="text-base"
                >
                  {item.icon}
                  <span className="ml-1">{item.name}</span>
                </Button>
              </Link>
            ))}
          </nav>
        )}
        
        <div className="flex items-center ml-auto gap-2">
          <Popover 
            open={showNotifications} 
            onOpenChange={setShowNotifications}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 bg-memeGreen text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 mt-2 p-0"
              align="end"
            >
              <Card>
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearNotifications}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b last:border-0 hover:bg-muted/50 flex items-start gap-3 cursor-pointer ${
                            !notification.read ? 'bg-muted/20' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={notification.avatar} />
                            <AvatarFallback>
                              {notification.from.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm">
                              <span className="font-medium">@{notification.from}</span>{' '}
                              {notification.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-memeGreen mt-1.5"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </PopoverContent>
          </Popover>
          
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:mr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getUserAvatar()} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </Link>
          
          {!isMobile && (
            <Button
              variant="ghost"
              className="text-red-500"
              onClick={() => {
                logout();
                toast.success("Logged out successfully");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
