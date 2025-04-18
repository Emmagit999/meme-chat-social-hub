
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { User } from "@/types";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for now
const mockUsers = [
  {
    id: "1",
    username: "meme_lord",
    displayName: "Meme Lord",
    bio: "I create the dankest memes on the internet",
    avatar: "/assets/avatar1.jpg",
    isPro: true,
    createdAt: new Date(2023, 5, 15)
  },
  {
    id: "2",
    username: "roast_master",
    displayName: "Roast Master",
    bio: "Roasting is my passion",
    avatar: "/assets/avatar2.jpg",
    isPro: false,
    createdAt: new Date(2023, 7, 20)
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for saved user
    const savedUser = localStorage.getItem('memeUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('memeUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock authentication
      const foundUser = mockUsers.find(u => u.username === username);
      
      if (foundUser && password === "password") { // In a real app, use proper password validation
        setUser(foundUser);
        localStorage.setItem('memeUser', JSON.stringify(foundUser));
        toast.success("Welcome back!");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check if username exists
      if (mockUsers.some(u => u.username === username)) {
        throw new Error("Username already taken");
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        username,
        displayName: username,
        bio: "",
        avatar: "",
        isPro: false,
        createdAt: new Date()
      };

      // In a real app, you'd save this to a database
      setUser(newUser);
      localStorage.setItem('memeUser', JSON.stringify(newUser));
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Registration failed", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('memeUser');
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
