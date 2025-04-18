
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Message, Chat, User } from '@/types';
import { toast } from "sonner";

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
  }
];

export const useChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // In a real app, fetch chats from backend
      const userChats = mockChats.filter(chat => 
        chat.participants.includes(user.id)
      );
      setChats(userChats);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      // In a real app, fetch messages for the active chat
      const chatMessages = mockMessages.filter(message => {
        const chat = mockChats.find(c => c.id === activeChat);
        if (!chat) return false;
        
        return chat.participants.includes(message.senderId) && 
               chat.participants.includes(message.receiverId);
      });
      
      setMessages(chatMessages);
    }
  }, [activeChat]);

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

    toast.success("Message sent");
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
      return;
    }

    // Create new chat
    const newChat: Chat = {
      id: Date.now().toString(),
      participants: [user.id, userId],
      unreadCount: 0
    };

    setChats(prev => [...prev, newChat]);
    setActiveChat(newChat.id);
    toast.success("Chat started");
  };

  // Function to get user suggestions for the Merge feature
  const getSuggestedUsers = () => {
    if (!user) return [];
    
    // In a real app, this would have an algorithm for suggestions
    // For now, return all users except the current user
    return users.filter(u => u.id !== user.id);
  };

  return {
    chats,
    messages,
    activeChat,
    isLoading,
    setActiveChat,
    sendMessage,
    startNewChat,
    getSuggestedUsers
  };
};
