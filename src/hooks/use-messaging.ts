
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { User, Message, Chat } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { useChat } from "@/hooks/use-chat";

export const useMessaging = () => {
  const { chats, messages, activeChat, setActiveChat, sendMessage: chatSendMessage, startNewChat, getSuggestedUsers, getUserById, registerUser, getFriends } = useChat();
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();

  // Calculate unread messages count
  useEffect(() => {
    if (chats && user) {
      const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadMessages(totalUnread);
    }
  }, [chats, user]);

  // Message sending wrapper
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeChat) return;
    
    try {
      setIsSending(true);
      await chatSendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Connection status check
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', () => setIsConnected(true));
    window.addEventListener('offline', () => setIsConnected(false));
    
    checkConnection();
    
    return () => {
      window.removeEventListener('online', () => setIsConnected(true));
      window.removeEventListener('offline', () => setIsConnected(false));
    };
  }, []);

  const reconnect = useCallback(() => {
    if (!navigator.onLine) {
      toast.error("No internet connection");
      return;
    }
    
    toast.loading("Reconnecting...");
    
    setTimeout(() => {
      setIsConnected(true);
      toast.success("Reconnected successfully");
    }, 1000);
  }, []);

  return {
    chats,
    messages,
    activeChat,
    setActiveChat,
    sendMessage,
    startNewChat,
    getSuggestedUsers,
    getUserById,
    registerUser,
    getFriends,
    isSending,
    isConnected,
    reconnect,
    unreadMessages
  };
};
