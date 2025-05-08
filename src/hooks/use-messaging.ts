
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { User, Message, Chat } from "@/types";
import { toast } from "sonner";
import { useChat } from "@/hooks/use-chat";

export const useMessaging = () => {
  const { chats, messages, activeChat, setActiveChat, sendMessage: chatSendMessage, startNewChat, getSuggestedUsers, getUserById, registerUser, getFriends } = useChat();
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Calculate unread messages count
  useEffect(() => {
    if (chats && user) {
      const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadMessages(totalUnread);
    }
  }, [chats, user]);

  // Set up real-time listeners for messages
  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => {
          // Refresh messages when the user receives a new message
          if (chatSendMessage) {
            const refreshChats = async () => {
              try {
                await getFriends();
              } catch (error) {
                console.error('Error refreshing chats:', error);
              }
            };
            refreshChats();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, chatSendMessage, getFriends]);

  // Message sending wrapper with optimistic update
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeChat) return;
    
    try {
      setIsSending(true);
      setLastError(null);
      
      // Get the other user's ID from the active chat
      const chat = chats.find(c => c.id === activeChat);
      if (!chat || !user) {
        throw new Error("Chat or user not found");
      }
      
      // Find the other participant's ID
      const receiverId = chat.participants.find(id => id !== user.id);
      if (!receiverId) {
        throw new Error("Receiver not found");
      }
      
      // Prepare the message object
      const messageData = {
        content,
        sender_id: user.id,
        receiver_id: receiverId,
        created_at: new Date().toISOString()
      };
      
      // Directly insert into the messages table instead of using UUID from Date.now()
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
        
      if (error) {
        console.error("Error inserting message:", error);
        throw error;
      }
      
      // Update the last message in the chat
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_date: new Date().toISOString()
        })
        .eq('id', activeChat);
        
      // Now call the chat function to update the UI
      await chatSendMessage(content);
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      setLastError(error instanceof Error ? error : new Error("Failed to send message"));
      toast.error("Failed to send message. Please try again.", {
        duration: 3000
      });
      throw error;
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
      toast.error("No internet connection", {
        duration: 3000
      });
      return;
    }
    
    toast.loading("Reconnecting...", {
      duration: 2000
    });
    
    // Simulate reconnection
    setTimeout(() => {
      setIsConnected(true);
      toast.success("Reconnected successfully", {
        duration: 2000
      });
      
      // Refresh data
      if (getFriends) {
        getFriends();
      }
    }, 1000);
  }, [getFriends]);

  // Set loading state to false once we have data
  useEffect(() => {
    if (chats !== undefined) {
      setIsLoading(false);
    }
  }, [chats]);

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
    unreadMessages,
    isLoading,
    lastError
  };
};
