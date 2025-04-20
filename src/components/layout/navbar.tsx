
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { Bell, Home, MessageCircle, TriangleIcon, User, LogOut, Search } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Get the avatar from localStorage if available
  const savedAvatar = localStorage.getItem('memechat_user_avatar');
  const avatarUrl = savedAvatar || user?.avatar;
  
  if (!user) return null;
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={user.username} />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-bold text-xl text-yellow-600">Memes Official</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'default' : 'ghost'} 
              className={location.pathname === '/' ? 'bg-memeGreen hover:bg-memeGreen/90' : ''}
            >
              <Home className="h-5 w-5 mr-2" />
              Home
            </Button>
          </Link>
          
          <Link to="/merge">
            <Button 
              variant={location.pathname === '/merge' ? 'default' : 'ghost'} 
              className={location.pathname === '/merge' ? 'bg-memeGreen hover:bg-memeGreen/90' : ''}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Merge
            </Button>
          </Link>
          
          <Link to="/roast">
            <Button 
              variant={location.pathname === '/roast' ? 'default' : 'ghost'} 
              className={location.pathname === '/roast' ? 'bg-memeGreen hover:bg-memeGreen/90' : ''}
            >
              <TriangleIcon className="h-5 w-5 mr-2" />
              Roast
            </Button>
          </Link>
          
          <Link to="/search">
            <Button 
              variant={location.pathname === '/search' ? 'default' : 'ghost'} 
              className={location.pathname === '/search' ? 'bg-memeGreen hover:bg-memeGreen/90' : ''}
            >
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Link to="/chat">
            <Button 
              variant={location.pathname === '/chat' ? 'default' : 'ghost'} 
              className={location.pathname === '/chat' ? 'bg-memeGreen hover:bg-memeGreen/90 text-white' : ''}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={avatarUrl} alt={user.username} />
                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <nav className="flex justify-around">
          <Link to="/" className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none ${location.pathname === '/' ? 'border-t-2 border-memeGreen' : ''}`}
            >
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/merge" className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none ${location.pathname === '/merge' ? 'border-t-2 border-memeGreen' : ''}`}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/search" className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none ${location.pathname === '/search' ? 'border-t-2 border-memeGreen' : ''}`}
            >
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/roast" className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none ${location.pathname === '/roast' ? 'border-t-2 border-memeGreen' : ''}`}
            >
              <TriangleIcon className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/profile" className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none ${location.pathname === '/profile' ? 'border-t-2 border-memeGreen' : ''}`}
            >
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
