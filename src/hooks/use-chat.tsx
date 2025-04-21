
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Message, Chat, User } from '@/types';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Mock data
const mockChats: Chat[] = [
  {
    id: "1",
    participants: ["1", "2"],
    lastMessage: "Hey, did you see that new meme?",
    lastMessageDate: new Date(2024, 3, 15, 18, 30),
    unreadCount: 0
  }
];

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "2",
    receiverId: "1",
    content: "Hey, did you see that new meme?",
    read: true,
    createdAt: new Date(2024, 3, 15, 18, 30)
  },
  {
    id: "2",
    senderId: "1",
    receiverId: "2",
    content: "Yeah, it was hilarious! 😂",
    read: true,
    createdAt: new Date(2024, 3, 15, 18, 32)
  }
];

const mockUsers: User[] = [
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
  },
  {
    id: "3",
    username: "joke_king",
    displayName: "Joke King",
    bio: "I've got jokes for days",
    avatar: "/assets/avatar3.jpg",
    isPro: false,
    createdAt: new Date(2023, 9, 10)
  },
  {
    id: "user1",
    username: "meme_lover",
    displayName: "Meme Lover",
    bio: "I live for the dankest memes",
    avatar: "/assets/avatar1.jpg",
    isPro: false,
    createdAt: new Date()
  },
  {
    id: "user2",
    username: "joke_master",
    displayName: "Joke Master",
    bio: "Making people laugh since 2010",
    avatar: "/assets/avatar2.jpg",
    isPro: true,
    createdAt: new Date()
  }
];

// Storage keys for localStorage
const CHATS_STORAGE_KEY = 'memechat_chats';
const MESSAGES_STORAGE_KEY = 'memechat_messages';
const USERS_STORAGE_KEY = 'memechat_users';

export const useChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    if (user) {
      const loadData = () => {
        // Load users
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
          try {
            const parsedUsers = JSON.parse(savedUsers);
            // Convert string dates back to Date objects
            const formattedUsers = parsedUsers.map((u: any) => ({
              ...u,
              createdAt: new Date(u.createdAt)
            }));
            setUsers(formattedUsers);
          } catch (error) {
            console.error('Error parsing saved users:', error);
            setUsers(mockUsers);
          }
        } else {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
          setUsers(mockUsers);
        }
        
        // Load chats
        const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats);
            // Convert string dates back to Date objects
            const formattedChats = parsedChats.map((chat: any) => ({
              ...chat,
              lastMessageDate: chat.lastMessageDate ? new Date(chat.lastMessageDate) : undefined
            }));
            
            // Filter chats for current user
            const userChats = formattedChats.filter((chat: Chat) => 
              chat.participants.includes(user.id)
            );
            
            setChats(userChats);
          } catch (error) {
            console.error('Error parsing saved chats:', error);
            
            const userMockChats = mockChats.filter(chat => 
              chat.participants.includes(user.id)
            );
            
            setChats(userMockChats);
          }
        } else {
          const userMockChats = mockChats.filter(chat => 
            chat.participants.includes(user.id)
          );
          
          localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(mockChats));
          setChats(userMockChats);
        }
        
        // Load messages
        const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages);
            // Convert string dates back to Date objects
            const formattedMessages = parsedMessages.map((message: any) => ({
              ...message,
              createdAt: new Date(message.createdAt)
            }));
            setMessages(formattedMessages);
          } catch (error) {
            console.error('Error parsing saved messages:', error);
            setMessages(mockMessages);
          }
        } else {
          localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(mockMessages));
          setMessages(mockMessages);
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
    
    // Simulate a reply after a random delay in 0.5-3 seconds
    if (Math.random() > 0.3) {
      const replyDelay = Math.floor(Math.random() * 2500) + 500;
      
      setTimeout(() => {
        const replyOptions = [
          "Hey, that's cool!",
          "Thanks for messaging me!",
          "What's up?",
          "Nice to hear from you!",
          "I was just thinking about that!",
          "Absolutely!",
          "That's a great idea!",
          "I'll get back to you soon on that.",
          "Interesting thought!",
          "Let's talk more about this later."
        ];
        
        const replyMessage: Message = {
          id: (Date.now() + 1).toString(),
          senderId: receiver,
          receiverId: user.id,
          content: replyOptions[Math.floor(Math.random() * replyOptions.length)],
          read: true, // Marked as read since the chat is active
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, replyMessage]);
        
        // Update chat with last message
        setChats(prev => 
          prev.map(c => 
            c.id === activeChat 
              ? { 
                  ...c, 
                  lastMessage: replyMessage.content, 
                  lastMessageDate: new Date() 
                } 
              : c
          )
        );
      }, replyDelay);
    }
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

  // Function to get user suggestions for the Merge feature
  const getSuggestedUsers = (): User[] => {
    if (!user) return [];
    
    // In a real app, this would have an algorithm for suggestions
    // For now, return all users except the current user
    
    // Include users from localStorage if they've been created in the app
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        // Convert string dates back to Date objects
        const formattedUsers = parsedUsers.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt)
        }));
        
        // Filter out the current user
        return formattedUsers.filter((u: User) => u.id !== user.id);
      } catch (error) {
        console.error('Error parsing saved users:', error);
      }
    }
    
    // Fallback to mock users
    return users.filter(u => u.id !== user.id);
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
    getUserById
  };
};
