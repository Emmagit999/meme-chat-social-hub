
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { User, Message, Chat } from "@/types";
import { useChat } from "@/hooks/use-chat";
import { useOptimisticMessaging } from "@/hooks/use-optimistic-messaging";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export const useMessaging = () => {
  const { chats, messages, activeChat, setActiveChat, sendMessage: chatSendMessage, startNewChat, getSuggestedUsers, getUserById, registerUser, getFriends, refreshChatsAndMessages, updateMessageLocal, updateChatLastMessageLocal } = useChat();
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [deletingMessages, setDeletingMessages] = useState<Set<string>>(new Set());
  // Sidebar chat preview overrides for optimistic UI ("Sending...", "Deleting...")
  const [chatPreviewOverrides, setChatPreviewOverrides] = useState<Record<string, { text: string; kind: 'sending' | 'deleting' | 'info' }>>({});
  const { user } = useAuth();
  const { 
    optimisticMessages, 
    addOptimisticMessage, 
    updateMessageStatus, 
    removeOptimisticMessage,
    removeOptimisticMessageByContent 
  } = useOptimisticMessaging();

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

    // Listen for messages RECEIVED by the user
    const messagesToUserChannel = supabase
      .channel('messages-to-user')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          console.log('Message change (to user) detected:', payload);
          if (getFriends) {
            getFriends().catch(err => {
              console.error('Error refreshing friends after inbound message change:', err);
            });
          }
        }
      )
      .subscribe();

    // ALSO listen for messages SENT by the user (needed for edits/deletes to reflect immediately)
    const messagesFromUserChannel = supabase
      .channel('messages-from-user')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        (payload) => {
          console.log('Message change (from user) detected:', payload);
          if (getFriends) {
            getFriends().catch(err => {
              console.error('Error refreshing friends after outbound message change:', err);
            });
          }
        }
      )
      .subscribe();
      
    // Also listen for chat updates
    const chatsChannel = supabase
      .channel('chats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          console.log('Chat updated:', payload);
          if (getFriends) {
            getFriends().catch(err => {
              console.error('Error refreshing friends after chat update:', err);
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesToUserChannel);
      supabase.removeChannel(messagesFromUserChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [user, getFriends]);

  // Enhanced message sending with optimistic updates like WhatsApp
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeChat || isSending) return null;
    
    const chat = chats.find(c => c.id === activeChat);
    if (!chat || !user) {
      toast.error("Chat or user not found");
      return null;
    }
    
    const receiverId = chat.participants.find(id => id !== user.id);
    if (!receiverId) {
      toast.error("Receiver not found");
      return null;
    }

    // Update sidebar preview optimistically
    setChatPreviewOverrides(prev => ({ ...prev, [activeChat]: { text: 'Sending...', kind: 'sending' } }));

    // Add optimistic message immediately (like WhatsApp)
    const optimisticId = addOptimisticMessage(content, user.id, receiverId);
    
    try {
      setIsSending(true);
      setLastError(null);
      
      const messageId = uuidv4();
      const messageData = {
        id: messageId,
        content,
        sender_id: user.id,
        receiver_id: receiverId,
        created_at: new Date().toISOString()
      };
      
      // Send to database
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

      // Mark optimistic message as sent and clear sidebar override
      updateMessageStatus(optimisticId, 'sent');
      setChatPreviewOverrides(prev => {
        const next = { ...prev };
        delete next[activeChat];
        return next;
      });
      // Instantly reflect in chat list
      updateChatLastMessageLocal(activeChat, content);
      // Optionally remove optimistic message after real data arrives
      setTimeout(() => removeOptimisticMessage(optimisticId), 1500);
      
      // Background refresh to sync without UI flicker
      refreshChatsAndMessages?.();
      if (getFriends) {
        setTimeout(() => getFriends(), 500);
      }
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessageStatus(optimisticId, 'failed');
      setLastError(error instanceof Error ? error : new Error("Failed to send message"));
      toast.error("Failed to send message");
      // Clear sidebar override on failure
      setChatPreviewOverrides(prev => {
        const next = { ...prev };
        delete next[activeChat];
        return next;
      });
      // Keep failed message visible for retry
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Delete a message with immediate UI feedback like WhatsApp
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (deletingMessages.has(messageId)) return false; // Prevent duplicate deletes
    
    try {
      // Immediately mark as deleting for instant UI feedback
      setDeletingMessages(prev => new Set(prev).add(messageId));
      // Optimistically update sidebar preview
      if (activeChat) {
        setChatPreviewOverrides(prev => ({ ...prev, [activeChat]: { text: 'Deleting message...', kind: 'deleting' } }));
      }
      
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

      // Update chat preview immediately to reflect deletion
      if (activeChat) {
        try {
          await supabase
            .from('chats')
            .update({
              last_message: '[deleted]',
              last_message_date: new Date().toISOString()
            })
            .eq('id', activeChat);
        } catch (e) {
          console.warn('Failed to update chat last_message after deletion:', e);
        }
        // Update local state instantly
        updateMessageLocal(messageId, { content: '[deleted]' });
        updateChatLastMessageLocal(activeChat, '[deleted]');
      }
      
      // Clear sidebar override to show updated preview
      if (activeChat) {
        setChatPreviewOverrides(prev => {
          const next = { ...prev };
          delete next[activeChat];
          return next;
        });
      }
      // Background refresh for both sender and receiver without UI flicker
      refreshChatsAndMessages?.();
      if (getFriends) {
        await getFriends();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error("Failed to delete message");
      setLastError(error instanceof Error ? error : new Error("Failed to delete message"));
      // Clear sidebar override on failure
      if (activeChat) {
        setChatPreviewOverrides(prev => {
          const next = { ...prev };
          delete next[activeChat];
          return next;
        });
      }
      return false;
    } finally {
      // Remove from deleting set
      setDeletingMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
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
      
      // Update local state instantly
      updateMessageLocal(messageId, { content: newContent, edited: true, editedAt: new Date().toISOString() });
      if (activeChat) {
        updateChatLastMessageLocal(activeChat, newContent);
      }
      
      // Background refresh to sync fully
      refreshChatsAndMessages?.();
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
    const goOnline = () => setIsConnected(true);
    const goOffline = () => setIsConnected(false);
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    checkConnection();
    
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const reconnect = useCallback(async () => {
    // Only attempt if we're online and currently not connected
    if (!navigator.onLine) {
      setIsConnected(false);
      return;
    }
    try {
      console.log('Attempting to reconnect...');
      // Light-touch check; avoids tearing down channels unnecessarily
      await supabase.auth.getSession();
      // Verify connection by fetching lightweight data
      if (getFriends) {
        await getFriends();
      }
      setIsConnected(true);
      console.log('Reconnection successful');
    } catch (error) {
      console.error('Error during reconnection:', error);
      // Do not flip to false if we are online; keep previous state to avoid UI flicker
      if (!navigator.onLine) setIsConnected(false);
    }
  }, [getFriends]);

  // Wake/resubscribe when returning to the tab
  useEffect(() => {
    const handleFocus = () => {
      if (!isConnected && navigator.onLine) {
        console.log('Window focus: attempting reconnect');
        reconnect();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isConnected && navigator.onLine) {
        console.log('Visibility change to visible: attempting reconnect');
        reconnect();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [reconnect, isConnected]);

  // Set loading state to false once we have data
  useEffect(() => {
    if (chats !== undefined) {
      setIsLoading(false);
    }
  }, [chats]);

  // In-app background sync: periodically refresh chats/messages without UI flicker
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (navigator.onLine) {
        try {
          refreshChatsAndMessages?.();
        } catch (e) {
          console.warn('Background sync failed', e);
        }
      }
    }, 7000);
    return () => clearInterval(id);
  }, [user, refreshChatsAndMessages]);

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
    lastError,
    optimisticMessages,
    chatPreviewOverrides,
    deletingMessages
  };
};
