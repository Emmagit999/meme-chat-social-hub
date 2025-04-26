import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { User, Message, Chat } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

export const useMessaging = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  // Track subscription for cleanup and reconnection
  const channelRef = useRef<any>(null);
  
  // Connection status tracking
  const [isConnected, setIsConnected] = useState(true);
  const reconnectTimer = useRef<any>(null);

  // Setup real-time connection and fetch initial data
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    
    const loadData = async () => {
      try {
        await fetchUsers();
        await fetchChats();
        
        // Initial data load complete
        setIsLoading(false);
        
        // Setup real-time subscription
        setupRealtimeSubscription();
        
      } catch (error) {
        console.error('Error in loadData:', error);
        setIsLoading(false);
        toast.error("Failed to load messages. Please refresh.");
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [user, reconnectAttempt]);
  
  // Handle reconnection on network changes
  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      
      // Trigger reconnection
      setReconnectAttempt(prev => prev + 1);
      toast.success("Connection restored");
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      toast.error("Connection lost. Attempting to reconnect...");
      
      // Set reconnect timer
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      
      reconnectTimer.current = setTimeout(() => {
        if (!isConnected) {
          setReconnectAttempt(prev => prev + 1);
        }
      }, 5000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [isConnected]);

  // Setup real-time message subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;
    
    // Clean up any existing subscription
    cleanupRealtimeSubscription();
    
    // Create new subscription - Fix: Added a third parameter for the subscription config
    const messagesChannel = supabase
      .channel('public:messages', {
        config: {
          broadcast: { self: true },
          presence: { key: user.id }
        }
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        handleNewMessage(payload.new as any);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        handleMessageUpdate(payload.new as any);
      })
      .on('error', (error) => {
        console.error('Realtime subscription error:', error);
        setIsConnected(false);
        
        // Schedule reconnection
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }
        
        reconnectTimer.current = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
        }, 3000);
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.error('Realtime subscription failed');
        }
      });
    
    channelRef.current = messagesChannel;
  }, [user]);
  
  // Clean up real-time subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);
  
  // Handle a new message from real-time subscription
  const handleNewMessage = useCallback((newMessage: any) => {
    if (!user) return;
    
    if (newMessage && (newMessage.sender_id === user.id || newMessage.receiver_id === user.id)) {
      const formattedMessage: Message = {
        id: newMessage.id,
        senderId: newMessage.sender_id,
        receiverId: newMessage.receiver_id,
        content: newMessage.content,
        read: newMessage.read || false,
        createdAt: new Date(newMessage.created_at)
      };
      
      setMessages(prevMessages => {
        // Avoid duplicates
        if (prevMessages.some(m => m.id === formattedMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, formattedMessage];
      });
      
      updateChatWithLastMessage(formattedMessage);
      
      if (newMessage.receiver_id === user.id && newMessage.sender_id !== user.id) {
        const sender = users.find(u => u.id === newMessage.sender_id);
        toast(`New message from ${sender?.displayName || sender?.username || 'Someone'}`);
      }
    }
  }, [user, users]);
  
  // Handle a message update from real-time subscription
  const handleMessageUpdate = useCallback((updatedMessage: any) => {
    if (!user) return;
    
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === updatedMessage.id
          ? {
              ...msg,
              read: updatedMessage.read,
              content: updatedMessage.content
            }
          : msg
      )
    );
  }, [user]);
  
  // Fetch users from Supabase
  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error('Error fetching profiles from Supabase:', profilesError);
        throw profilesError;
      }
      
      if (profilesData && profilesData.length > 0) {
        const formattedUsers = profilesData.map((profile: any) => ({
          id: profile.id,
          username: profile.username || 'user',
          displayName: profile.username || 'User',
          avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
          createdAt: new Date(profile.updated_at || new Date()),
          bio: profile.bio || '',
          isPro: profile.is_pro || false
        }));
        
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };
  
  // Fetch chats from Supabase
  const fetchChats = async () => {
    if (!user) return;
    
    try {
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`participant1.eq.${user.id},participant2.eq.${user.id}`);
      
      if (chatsError) {
        console.error('Error fetching chats from Supabase:', chatsError);
        throw chatsError;
      }
      
      if (chatsData && chatsData.length > 0) {
        const formattedChats = chatsData.map((chat: any) => {
          const otherParticipantId = chat.participant1 === user.id ? chat.participant2 : chat.participant1;
          return {
            id: chat.id,
            participants: [user.id, otherParticipantId],
            lastMessage: chat.last_message || '',
            lastMessageDate: chat.last_message_date ? new Date(chat.last_message_date) : undefined,
            unreadCount: chat.unread_count || 0
          };
        });
        
        setChats(formattedChats);
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  };
  
  // Fetch messages from Supabase
  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching messages from Supabase:', messagesError);
        throw messagesError;
      }
      
      const formattedMessages = messagesData.map((message: any) => ({
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.content,
        read: message.read || false,
        createdAt: new Date(message.created_at)
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  };

  // Update chat with last message
  const updateChatWithLastMessage = useCallback((message: Message) => {
    setChats(prevChats => {
      const existingChat = prevChats.find(c => 
        c.participants.includes(message.senderId) && 
        c.participants.includes(message.receiverId)
      );
      
      if (existingChat) {
        return prevChats.map(c => 
          c.id === existingChat.id 
            ? { 
                ...c, 
                lastMessage: message.content, 
                lastMessageDate: message.createdAt,
                unreadCount: message.receiverId === user?.id && !message.read 
                  ? c.unreadCount + 1 
                  : c.unreadCount
              } 
            : c
        );
      } else {
        const newChatId = Date.now().toString();
        const newChat: Chat = {
          id: newChatId,
          participants: [message.senderId, message.receiverId],
          lastMessage: message.content,
          lastMessageDate: message.createdAt,
          unreadCount: message.receiverId === user?.id && !message.read ? 1 : 0
        };
        
        return [...prevChats, newChat];
      }
    });
  }, [user?.id]);

  // Filter messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      const chatMessages = messages.filter(message => {
        const chat = chats.find(c => c.id === activeChat);
        if (!chat) return false;
        
        return chat.participants.includes(message.senderId) && 
               chat.participants.includes(message.receiverId);
      });
      
      setFilteredMessages(chatMessages);
      
      if (user) {
        const unreadMessages = messages.filter(msg => 
          msg.receiverId === user.id && 
          !msg.read && 
          chats.find(c => c.id === activeChat)?.participants.includes(msg.senderId)
        );
        
        if (unreadMessages.length > 0) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              unreadMessages.some(unread => unread.id === msg.id)
                ? { ...msg, read: true }
                : msg
            )
          );
          
          unreadMessages.forEach(async (msg) => {
            try {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', msg.id);
            } catch (error) {
              console.error('Error updating message read status:', error);
            }
          });
          
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === activeChat 
                ? { ...chat, unreadCount: 0 }
                : chat
            )
          );
        }
      }
    } else {
      setFilteredMessages([]);
    }
  }, [activeChat, messages, chats, user]);

  // Send message function with optimistic UI updates and error handling
  const sendMessage = async (content: string) => {
    if (!user || !activeChat || !content.trim()) {
      if (!content.trim()) {
        toast.error("Cannot send empty message");
      } else {
        toast.error("Cannot send message");
      }
      return;
    }

    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;

    const receiver = chat.participants.find(id => id !== user.id);
    if (!receiver) return;

    const messageId = uuidv4();
    const newMessage: Message = {
      id: messageId,
      senderId: user.id,
      receiverId: receiver,
      content,
      read: false,
      createdAt: new Date()
    };

    // Show sending state
    setIsSending(true);

    try {
      // Optimistically update UI
      setMessages(prev => [...prev, newMessage]);
      updateChatWithLastMessage(newMessage);
      
      // Actual API call
      const { data, error } = await supabase
        .from('messages')
        .insert({
          id: newMessage.id,
          sender_id: newMessage.senderId,
          receiver_id: newMessage.receiverId,
          content: newMessage.content,
          read: newMessage.read,
          created_at: newMessage.createdAt.toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      const chatToUpdate = chats.find(c => 
        c.participants.includes(user.id) && 
        c.participants.includes(receiver)
      );
      
      if (chatToUpdate) {
        await supabase
          .from('chats')
          .update({
            last_message: content,
            last_message_date: new Date().toISOString()
          })
          .eq('id', chatToUpdate.id);
      } else {
        await supabase
          .from('chats')
          .insert({
            id: chat.id,
            participant1: user.id,
            participant2: receiver,
            last_message: content,
            last_message_date: new Date().toISOString(),
            unread_count: 0
          });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message. Retrying...");
      
      // Retry once after a short delay
      setTimeout(async () => {
        try {
          const { error: retryError } = await supabase
            .from('messages')
            .insert({
              id: newMessage.id,
              sender_id: newMessage.senderId,
              receiver_id: newMessage.receiverId,
              content: newMessage.content,
              read: newMessage.read,
              created_at: newMessage.createdAt.toISOString()
            });
            
          if (retryError) {
            throw retryError;
          }
          
          toast.success("Message sent successfully");
        } catch (retryErr) {
          console.error('Error sending message (retry):', retryErr);
          toast.error("Failed to send message. Please try again later.");
          
          // Remove the optimistic message from the UI
          setMessages(prev => prev.filter(m => m.id !== newMessage.id));
          
          // Revert chat last message if needed
          const originalChat = chats.find(c => c.id === activeChat);
          if (originalChat) {
            setChats(prev => 
              prev.map(c => 
                c.id === activeChat ? originalChat : c
              )
            );
          }
        }
      }, 2000);
    } finally {
      setIsSending(false);
    }
  };

  // Start a new chat with a user
  const startNewChat = useCallback(async (userId: string) => {
    if (!user) {
      toast.error("You must be logged in to start a chat");
      return null;
    }

    try {
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*')
        .or(`and(participant1.eq.${user.id},participant2.eq.${userId}),and(participant1.eq.${userId},participant2.eq.${user.id})`)
        .limit(1);

      if (existingChats && existingChats.length > 0) {
        setActiveChat(existingChats[0].id);
        return existingChats[0].id;
      }

      const newChatId = uuidv4();
      const { data, error } = await supabase
        .from('chats')
        .insert({
          id: newChatId,
          participant1: user.id,
          participant2: userId,
          created_at: new Date().toISOString(),
          unread_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating chat:", error);
        toast.error("Failed to create chat");
        return null;
      }

      const newChat: Chat = {
        id: data.id,
        participants: [data.participant1, data.participant2],
        lastMessage: null,
        lastMessageDate: null,
        unreadCount: 0
      };

      setChats(prev => [...prev, newChat]);
      setActiveChat(newChat.id);
      
      return newChat.id;
    } catch (error) {
      console.error("Error in startNewChat:", error);
      toast.error("Failed to start chat");
      return null;
    }
  }, [user, setActiveChat]);

  // Get user by ID
  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    
    // First check in already loaded users
    const cachedUser = users.find(u => u.id === userId);
    if (cachedUser) return cachedUser;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const newUser = {
          id: data.id,
          username: data.username || 'user',
          displayName: data.username || 'User',
          avatar: data.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
          isPro: data.is_pro || false,
          bio: data.bio || '',
          createdAt: new Date(data.updated_at || new Date())
        };
        
        // Add to users cache
        setUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);
        
        return newUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }, [users]);

  // Get suggested users for new chats
  const getSuggestedUsers = async (): Promise<User[]> => {
    if (!user) return [];
    
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);
      
      if (error) {
        console.error('Error fetching profiles from Supabase:', error);
        return [];
      }
      
      if (profilesData && profilesData.length > 0) {
        return profilesData.map((profile: any) => ({
          id: profile.id,
          username: profile.username || 'user',
          displayName: profile.username || 'User',
          avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
          createdAt: new Date(profile.updated_at || new Date()),
          bio: profile.bio || '',
          isPro: profile.is_pro || false
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error in getSuggestedUsers:', error);
      return [];
    }
  };

  // Register a new user in the messaging system
  const registerUser = async (newUser: User) => {
    if (!newUser.id || !newUser.username) {
      console.error("Invalid user data");
      return;
    }
    
    const existingUser = users.find(u => u.id === newUser.id);
    if (existingUser) {
      return;
    }
    
    // Add to local state
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: newUser.id,
          username: newUser.username,
          avatar_url: newUser.avatar,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success(`${newUser.displayName || newUser.username} added to chat system`);
    } catch (error) {
      console.error('Error registering user in Supabase:', error);
      toast.error(`Failed to register ${newUser.username} in the system`);
    }
  };

  // Get friend list
  const getFriends = async (): Promise<User[]> => {
    if (!user) return [];
    
    try {
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      if (!friendsData || friendsData.length === 0) {
        return [];
      }
      
      const friendIds = friendsData.map(f => f.friend_id);
      const friendUsers: User[] = [];
      
      for (const friendId of friendIds) {
        const friendUser = await getUserById(friendId);
        if (friendUser) {
          friendUsers.push(friendUser);
        }
      }
      
      return friendUsers;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  };

  return {
    chats,
    messages: filteredMessages,
    allMessages: messages,
    activeChat,
    isLoading,
    isSending,
    isConnected,
    setActiveChat,
    sendMessage,
    startNewChat,
    getSuggestedUsers,
    getUserById,
    registerUser,
    getFriends,
    reconnect: () => setReconnectAttempt(prev => prev + 1)
  };
};

export default useMessaging;
