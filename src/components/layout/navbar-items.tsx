
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessagesSquare, Search, Bell, Users, Settings, Info, Heart } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useMessageNotifications } from '@/hooks/use-message-notifications';
import { PalRequestContext } from '@/App';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavbarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
  active?: boolean;
  onClick?: () => void;
}

export const NavbarItem: React.FC<NavbarItemProps> = ({ to, icon, label, badgeCount, active, onClick }) => {
  const showBadge = badgeCount && badgeCount > 0;
  const isMobile = useIsMobile();

  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "relative flex flex-col items-center justify-center transition-colors",
        isMobile ? "px-3 py-2" : "px-5 py-2 hover:bg-muted rounded-md",
        (isActive || active) && "text-yellow-500"
      )}
      onClick={onClick}
    >
      <div className="relative">
        {icon}
        {showBadge && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      {!isMobile && <span className="mt-1 text-xs">{label}</span>}
    </NavLink>
  );
};

export const NavbarItems: React.FC = () => {
  const { unreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessageNotifications();
  const requestCount = useContext(PalRequestContext);
  const isMobile = useIsMobile();

  const navItems = [
    { to: "/home", icon: <Home className="h-6 w-6" />, label: "Home" },
    { 
      to: "/chat", 
      icon: <MessagesSquare className="h-6 w-6" />, 
      label: "Chat",
      badgeCount: messageUnreadCount 
    },
    { to: "/search", icon: <Search className="h-6 w-6" />, label: "Search" },
    { 
      to: "/notifications", 
      icon: <Bell className="h-6 w-6" />, 
      label: "Notifications",
      badgeCount: unreadCount 
    },
    { 
      to: "/pals", 
      icon: <Heart className="h-6 w-6" />, 
      label: "Pals",
      badgeCount: requestCount 
    }
  ];

  // Add settings and about for mobile
  if (isMobile) {
    navItems.push(
      { to: "/settings", icon: <Settings className="h-6 w-6" />, label: "Settings" },
      { to: "/about", icon: <Info className="h-6 w-6" />, label: "About" }
    );
  }

  return (
    <div className={`flex ${isMobile ? 'flex-row w-full justify-around' : 'flex-row space-x-1'}`}>
      {navItems.map((item) => (
        <NavbarItem 
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          badgeCount={item.badgeCount}
        />
      ))}
    </div>
  );
};
