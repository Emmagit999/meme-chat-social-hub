
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { User, Message, Chat } from "@/types";
import { useChat } from "@/hooks/use-chat";
import { v4 as uuidv4 } from 'uuid';

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

  // Set up real-time listeners for messages with improved error handling
  useEffect(() => {
    if (!user) return;

    console.log("Setting up real-time listeners for user:", user.id);

    // First ensure we're subscribed to messages via realtime
    const messagesChannel = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          console.log('New message received:', payload);
          // Refresh messages when the user receives a new message
          if (getFriends) {
            getFriends().catch(err => {
              console.error('Error refreshing friends after message:', err);
            });
          }
        }
      )
      .subscribe();
      
    // Also listen for chat updates
    const chatsChannel = supabase
      .channel('chats-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          console.log('Chat updated:', payload);
          // Ensure both participants in the chat are refreshed
          if (getFriends) {
            getFriends().catch(err => {
              console.error('Error refreshing friends after chat update:', err);
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [user, getFriends]);

  // Enhanced message sending with better error handling and prevention of double sending
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeChat || isSending) return null;
    
    try {
      setIsSending(true);
      setLastError(null);
      
      const chat = chats.find(c => c.id === activeChat);
      if (!chat || !user) {
        throw new Error("Chat or user not found");
      }
      
      const receiverId = chat.participants.find(id => id !== user.id);
      if (!receiverId) {
        throw new Error("Receiver not found");
      }
      
      const messageId = uuidv4();
      const messageData = {
        id: messageId,
        content,
        sender_id: user.id,
        receiver_id: receiverId,
        created_at: new Date().toISOString()
      };
      
      // Use a transaction-like approach to prevent duplicate sends
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update chat last message
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_date: new Date().toISOString()
        })
        .eq('id', activeChat);
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      setLastError(error instanceof Error ? error : new Error("Failed to send message"));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Delete a message with proper error handling and feedback
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (isSending) return false; // Prevent operation if already sending
    
    try {
      setIsSending(true);
      console.log("Attempting to delete message with ID:", messageId);
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: '[deleted]'
        })
        .eq('id', messageId);
        
      if (error) {
        console.error("Error deleting message:", error);
        throw error;
      }
      
      console.log("Message successfully deleted");
      
      // Update UI - trigger a refresh via getFriends to reload chats and messages
      if (getFriends) {
        await getFriends();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      setLastError(error instanceof Error ? error : new Error("Failed to delete message"));
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // Edit a message with proper error handling and feedback
  const editMessage = async (messageId: string, newContent: string): Promise<boolean> => {
    if (isSending || !newContent.trim()) return false;
    
    try {
      setIsSending(true);
      setLastError(null);
      console.log("Attempting to edit message with ID:", messageId);
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);
        
      if (error) {
        console.error("Error editing message:", error);
        throw error;
      }
      
      console.log("Message successfully edited");
      
      // Update UI - trigger a refresh via getFriends to reload chats and messages
      if (getFriends) {
        await getFriends();
      }
      
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      setLastError(error instanceof Error ? error : new Error("Failed to edit message"));
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // Better connection status monitoring
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

  const reconnect = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      // Silent reconnection attempt
      setIsConnected(false);
      
      // Try to re-establish connection with Supabase
      await supabase.auth.refreshSession();
      
      // Try to fetch friends data to verify connection
      if (getFriends) {
        await getFriends();
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error during reconnection:', error);
    }
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
    deleteMessage,
    editMessage,
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
