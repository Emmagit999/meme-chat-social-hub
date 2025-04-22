
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Message, Chat, User } from '@/types';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Storage keys for localStorage
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

  // Load data from localStorage on initial render
  useEffect(() => {
    if (user) {
      const loadData = () => {
        // Load users - only real users, no bots
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
          try {
            const parsedUsers = JSON.parse(savedUsers);
            // Convert string dates back to Date objects and filter out bot accounts
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
          // Initialize with empty users array - we don't want to use fake users anymore
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
          setUsers([]);
        }
        
        // Load chats - only chats with real users
        const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats);
            // Convert string dates back to Date objects
            const formattedChats = parsedChats.map((chat: any) => ({
              ...chat,
              lastMessageDate: chat.lastMessageDate ? new Date(chat.lastMessageDate) : undefined
            }));
            
            // Filter chats for current user and only real users
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
        
        // Load messages - only messages with real users
        const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages);
            // Convert string dates back to Date objects and filter out bot messages
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
        
        setIsLoading(false);
      };
      
      loadData();
    }
  }, [user]);

  // Update localStorage whenever the data changes
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

  // When active chat changes, load the messages for that chat
  useEffect(() => {
    if (activeChat) {
      // In a real app, this would be a server request
      const chatMessages = messages.filter(message => {
        const chat = chats.find(c => c.id === activeChat);
        if (!chat) return false;
        
        // A message belongs to this chat if both the sender and receiver
        // are participants in the chat
        return chat.participants.includes(message.senderId) && 
               chat.participants.includes(message.receiverId);
      });
      
      setFilteredMessages(chatMessages);
      
      // Mark all unread messages as read
      if (user) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.receiverId === user.id && !msg.read && 
            chats.find(c => c.id === activeChat)?.participants.includes(msg.senderId)
              ? { ...msg, read: true }
              : msg
          )
        );
        
        // Update unread count in chat
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === activeChat 
              ? { ...chat, unreadCount: 0 }
              : chat
          )
        );
      }
    } else {
      setFilteredMessages([]);
    }
  }, [activeChat, messages, chats, user]);

  const sendMessage = (content: string) => {
    if (!user || !activeChat) {
      toast.error("Cannot send message");
      return;
    }

    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;

    const receiver = chat.participants.find(id => id !== user.id);
    if (!receiver) return;

    // Create new message
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: receiver,
      content,
      read: false,
      createdAt: new Date()
    };

    // Update messages
    setMessages(prev => [...prev, newMessage]);

    // Update chat with last message
    setChats(prev => 
      prev.map(c => 
        c.id === activeChat 
          ? { 
              ...c, 
              lastMessage: content, 
              lastMessageDate: new Date() 
            } 
          : c
      )
    );

    // In a real app, this is where we would send the message to the server
    
    toast.success("Message sent");
  };

  // Helper to check if a user is a real user (not a bot account)
  const isRealUser = (userId: string) => {
    // Real users have IDs that are UUIDs from Supabase auth
    // Bot accounts have simple string IDs like "user1", "user2"
    return userId.includes('-') || userId === user?.id;
  };

  const startNewChat = (userId: string) => {
    if (!user) {
      toast.error("You must be logged in to start a chat");
      return;
    }

    if (userId === user.id) {
      toast.error("You cannot chat with yourself");
      return;
    }

    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.includes(user.id) && 
      chat.participants.includes(userId)
    );

    if (existingChat) {
      setActiveChat(existingChat.id);
      return existingChat.id;
    }

    // Create new chat
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      participants: [user.id, userId],
      unreadCount: 0
    };

    setChats(prev => [...prev, newChat]);
    setActiveChat(newChatId);
    toast.success("Chat started");
    
    return newChatId;
  };

  // Function to get user suggestions for the Merge feature - only real users
  const getSuggestedUsers = (): User[] => {
    if (!user) return [];
    
    // Get real users from Supabase
    // In a real app, you would make a Supabase query here
    // For now, we'll get all users from localStorage and filter out bots
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        // Convert string dates back to Date objects and filter out bot accounts
        const formattedUsers = parsedUsers
          .map((u: any) => ({
            ...u,
            createdAt: new Date(u.createdAt)
          }))
          .filter((u: User) => isRealUser(u.id) && u.id !== user.id);
        
        return formattedUsers;
      } catch (error) {
        console.error('Error parsing saved users:', error);
      }
    }
    
    // If no users in storage, return empty array
    return [];
  };

  // Function to register a new real user in the chat system
  const registerUser = (newUser: User) => {
    if (!newUser.id || !newUser.username) {
      console.error("Invalid user data");
      return;
    }
    
    // Check if user already exists
    const existingUsers = users;
    if (existingUsers.some(u => u.id === newUser.id)) {
      // User already exists, don't add again
      return;
    }
    
    // Add new user to storage
    const updatedUsers = [...existingUsers, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    toast.success(`${newUser.displayName || newUser.username} added to chat system`);
  };

  // Function to get user by ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
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
    registerUser
  };
};
