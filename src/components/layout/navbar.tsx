import React from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Users, Bell, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "@/components/layout/user-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationBadge from '../ui/notification-badge';
import { useNotifications } from '@/hooks/use-notifications';
import { useMessaging } from '@/hooks/use-messaging';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadMessages } = useMessaging();
  const { unreadCount } = useNotifications();
  const isMobile = useIsMobile();

  const navigationItems = [
    {
      path: '/home',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      activeIcon: <Home className="h-5 w-5 text-yellow-500" />,
    },
    {
      path: '/search',
      label: 'Search',
      icon: <Search className="h-5 w-5" />,
      activeIcon: <Search className="h-5 w-5 text-yellow-500" />,
    },
    {
      path: '/pals',
      label: 'Pals',
      icon: <Users className="h-5 w-5" />,
      activeIcon: <Users className="h-5 w-5 text-yellow-500" />,
    },
    {
      path: '/chat',
      label: 'Chat',
      icon: <MessageCircle className="h-5 w-5" />,
      activeIcon: <MessageCircle className="h-5 w-5 text-yellow-500" />,
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      activeIcon: <Bell className="h-5 w-5 text-yellow-500" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-gray-900 border-t md:border-t-0 md:border-b border-gray-800 z-10">
      <div className="container flex items-center justify-between py-2 md:py-3">
        <div className="hidden md:flex items-center gap-2">
          <button 
            onClick={() => navigate('/home')}
            className="text-xl font-bold text-yellow-500 flex items-center"
          >
            MemChat
          </button>
        </div>

        <div className={`flex ${isMobile ? 'w-full justify-around' : 'gap-1'}`}>
          {/* Navigation Items */}
          {navigationItems.map((item) => (
            <NavItem 
              key={item.path} 
              {...item} 
              isMobile={isMobile}
              badge={item.path === '/chat' ? unreadMessages : item.path === '/notifications' ? unreadCount : 0}
            />
          ))}
        </div>

        {/* User Menu (Desktop) */}
        <div className="hidden md:block">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  isMobile?: boolean;
  badge?: number;
}

const NavItem = ({ path, label, icon, activeIcon, isMobile, badge = 0 }: NavItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.split('/')[1] === path.split('/')[1];
  
  return (
    <button 
      className={`relative flex flex-col items-center justify-center ${isMobile ? 'p-1' : 'px-3 py-2'} rounded-md transition-colors ${
        isActive 
          ? 'text-yellow-500' 
          : 'text-gray-400 hover:text-gray-200'
      }`} 
      onClick={() => navigate(path)}
    >
      <div className="relative">
        {isActive ? activeIcon || icon : icon}
        {badge > 0 && <NotificationBadge count={badge} />}
      </div>
      {isMobile && (
        <span className="text-[10px] mt-1">{label}</span>
      )}
    </button>
  );
};

