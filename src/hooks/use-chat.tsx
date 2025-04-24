import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { User, Message, Chat } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

const CHATS_STORAGE_KEY = 'memechat_chats';
const MESSAGES_STORAGE_KEY = 'memechat_messages';
const USERS_STORAGE_KEY = 'memechat_users';

export const useChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
          
          if (profilesError) {
            console.error('Error fetching profiles from Supabase:', profilesError);
            fallbackToLocalStorage();
            return;
          }
          
          if (profilesData && profilesData.length > 0) {
            const realUsers = profilesData.map((profile: any) => ({
              id: profile.id,
              username: profile.username || 'user',
              displayName: profile.username || 'User',
              avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
              createdAt: new Date(profile.updated_at || new Date()),
              bio: profile.bio || '',
              isPro: profile.is_pro || false
            }));
            
            setUsers(realUsers);
            
            fetchChatsFromSupabase(realUsers);
          } else {
            fallbackToLocalStorage();
          }
        } catch (error) {
          console.error('Error in loadData:', error);
          fallbackToLocalStorage();
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
      
      const messagesChannel = supabase
        .channel('public:messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, (payload) => {
          const newMessage = payload.new as any;
          
          if (newMessage && (newMessage.sender_id === user.id || newMessage.receiver_id === user.id)) {
            const formattedMessage: Message = {
              id: newMessage.id,
              senderId: newMessage.sender_id,
              receiverId: newMessage.receiver_id,
              content: newMessage.content,
              read: newMessage.read || false,
              createdAt: new Date(newMessage.created_at)
            };
            
            setMessages(prevMessages => [...prevMessages, formattedMessage]);
            
            updateChatWithLastMessage(formattedMessage);
            
            if (newMessage.receiver_id === user.id && newMessage.sender_id !== user.id) {
              const sender = users.find(u => u.id === newMessage.sender_id);
              toast(`New message from ${sender?.displayName || sender?.username || 'Someone'}`);
            }
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user]);
  
  const fetchChatsFromSupabase = async (usersList: User[]) => {
    if (!user) return;
    
    try {
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`participant1.eq.${user.id},participant2.eq.${user.id}`);
      
      if (chatsError) {
        console.error('Error fetching chats from Supabase:', chatsError);
        loadChatsAndMessagesFromLocalStorage(usersList);
        return;
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
        
        fetchMessagesFromSupabase(formattedChats);
      } else {
        loadChatsAndMessagesFromLocalStorage(usersList);
      }
    } catch (error) {
      console.error('Error fetching chats from Supabase:', error);
      loadChatsAndMessagesFromLocalStorage(usersList);
    }
  };
  
  const fetchMessagesFromSupabase = async (chatsList: Chat[]) => {
    if (!user || chatsList.length === 0) return;
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching messages from Supabase:', messagesError);
        return;
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
      console.error('Error fetching messages from Supabase:', error);
    }
  };

  const fallbackToLocalStorage = () => {
    console.log('Falling back to localStorage for user data');
    
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        const formattedUsers = parsedUsers
          .map((u: any) => ({
            ...u,
            createdAt: new Date(u.createdAt)
          }))
          .filter((u: User) => isRealUser(u.id));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error parsing saved users:', error);
        setUsers([]);
      }
    } else {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      setUsers([]);
    }
    
    loadChatsAndMessagesFromLocalStorage(users);
  };

  const loadChatsAndMessagesFromLocalStorage = (usersList: User[]) => {
    const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
    if (savedChats && user) {
      try {
        const parsedChats = JSON.parse(savedChats);
        const formattedChats = parsedChats.map((chat: any) => ({
          ...chat,
          lastMessageDate: chat.lastMessageDate ? new Date(chat.lastMessageDate) : undefined
        }));
        
        const userChats = formattedChats.filter((chat: Chat) => 
          chat.participants.includes(user.id) && 
          chat.participants.every(isRealUser)
        );
        
        setChats(userChats);
      } catch (error) {
        console.error('Error parsing saved chats:', error);
        setChats([]);
      }
    } else {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify([]));
      setChats([]);
    }
    
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        const formattedMessages = parsedMessages
          .map((message: any) => ({
            ...message,
            createdAt: new Date(message.createdAt)
          }))
          .filter((message: Message) => isRealUser(message.senderId) && isRealUser(message.receiverId));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        setMessages([]);
      }
    } else {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify([]));
      setMessages([]);
    }
  };

  const updateChatWithLastMessage = (message: Message) => {
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
  };

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    }
  }, [chats, isLoading, user]);
  
  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoading, user]);
  
  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading, user]);

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

  const sendMessage = async (content: string) => {
    if (!user || !activeChat) {
      toast.error("Cannot send message");
      return;
    }

    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;

    const receiver = chat.participants.find(id => id !== user.id);
    if (!receiver) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: receiver,
      content,
      read: false,
      createdAt: new Date()
    };

    try {
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
      
      toast.success("Message sent");
      
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
      toast.error("Failed to send message");
      
      setMessages(prev => [...prev, newMessage]);
      
      updateChatWithLastMessage(newMessage);
    }
  };

  const isRealUser = (userId: string) => {
    return userId.includes('-') || userId === user?.id;
  };

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
  }, [user, setActiveChat, setChats]);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        return {
          id: data.id,
          username: data.username || 'user',
          displayName: data.username || 'User',
          avatar: data.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
          isPro: false,
          bio: '',
          createdAt: new Date(data.updated_at || new Date())
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }, []);

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
      
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          return parsedUsers
            .map((u: any) => ({
              ...u,
              createdAt: new Date(u.createdAt)
            }))
            .filter((u: User) => isRealUser(u.id) && u.id !== user.id);
        } catch (error) {
          console.error('Error parsing saved users:', error);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error in getSuggestedUsers:', error);
      return [];
    }
  };

  const registerUser = async (newUser: User) => {
    if (!newUser.id || !newUser.username) {
      console.error("Invalid user data");
      return;
    }
    
    const existingUser = users.find(u => u.id === newUser.id);
    if (existingUser) {
      return;
    }
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
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
    setActiveChat,
    sendMessage,
    startNewChat,
    getSuggestedUsers,
    getUserById,
    registerUser,
    getFriends
  };
};
