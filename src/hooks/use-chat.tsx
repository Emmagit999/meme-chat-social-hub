
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Message, Chat, User } from '@/types';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Storage keys for localStorage - we'll use these as fallback only
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

  // Load data on initial render
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Try to fetch users from Supabase
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
          
          if (profilesError) {
            console.error('Error fetching profiles from Supabase:', profilesError);
            fallbackToLocalStorage();
            return;
          }
          
          // Convert Supabase profiles to User objects
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
            
            // Fetch chats from Supabase
            fetchChatsFromSupabase(realUsers);
          } else {
            // No profiles found, fall back to localStorage
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
      
      // Set up real-time listener for new messages
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
            
            // Update chat with last message
            updateChatWithLastMessage(formattedMessage);
            
            // Show notification if message is for current user and not from them
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
  
  // Function to fetch chats from Supabase
  const fetchChatsFromSupabase = async (usersList: User[]) => {
    if (!user) return;
    
    try {
      // First try to get chats from Supabase
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
        // Convert Supabase chats to Chat objects
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
        
        // Now fetch messages for all chats
        fetchMessagesFromSupabase(formattedChats);
      } else {
        // No chats found, fall back to localStorage
        loadChatsAndMessagesFromLocalStorage(usersList);
      }
    } catch (error) {
      console.error('Error fetching chats from Supabase:', error);
      loadChatsAndMessagesFromLocalStorage(usersList);
    }
  };
  
  // Function to fetch messages from Supabase
  const fetchMessagesFromSupabase = async (chatsList: Chat[]) => {
    if (!user || chatsList.length === 0) return;
    
    try {
      // Fetch messages for current user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching messages from Supabase:', messagesError);
        return;
      }
      
      if (messagesData && messagesData.length > 0) {
        // Convert Supabase messages to Message objects
        const formattedMessages = messagesData.map((message: any) => ({
          id: message.id,
          senderId: message.sender_id,
          receiverId: message.receiver_id,
          content: message.content,
          read: message.read || false,
          createdAt: new Date(message.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages from Supabase:', error);
    }
  };

  // Fallback to localStorage if Supabase fails
  const fallbackToLocalStorage = () => {
    console.log('Falling back to localStorage for user data');
    
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
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      setUsers([]);
    }
    
    // Load chats and messages
    loadChatsAndMessagesFromLocalStorage(users);
  };

  // Load chats and messages from localStorage
  const loadChatsAndMessagesFromLocalStorage = (usersList: User[]) => {
    // Load chats - only chats with real users
    const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
    if (savedChats && user) {
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
  };

  // Update chat with last message
  const updateChatWithLastMessage = (message: Message) => {
    setChats(prevChats => {
      const existingChat = prevChats.find(c => 
        c.participants.includes(message.senderId) && 
        c.participants.includes(message.receiverId)
      );
      
      if (existingChat) {
        // Update existing chat
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
        // Create new chat
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
        const unreadMessages = messages.filter(msg => 
          msg.receiverId === user.id && 
          !msg.read && 
          chats.find(c => c.id === activeChat)?.participants.includes(msg.senderId)
        );
        
        if (unreadMessages.length > 0) {
          // Mark messages as read in state
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              unreadMessages.some(unread => unread.id === msg.id)
                ? { ...msg, read: true }
                : msg
            )
          );
          
          // Update read status in Supabase
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
          
          // Update unread count in chat
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

    // Create new message
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: receiver,
      content,
      read: false,
      createdAt: new Date()
    };

    // Save message to Supabase
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
      
      // If message was saved successfully, the real-time channel will handle adding it to the UI
      toast.success("Message sent");
      
      // Also update the chat record in Supabase
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
        // Create new chat if it doesn't exist
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
      
      // Fall back to local state if Supabase fails
      setMessages(prev => [...prev, newMessage]);
      
      updateChatWithLastMessage(newMessage);
    }
  };

  // Helper to check if a user is a real user (not a bot account)
  const isRealUser = (userId: string) => {
    // Real users have IDs that are UUIDs from Supabase auth
    // Bot accounts have simple string IDs like "user1", "user2"
    return userId.includes('-') || userId === user?.id;
  };

  const startNewChat = async (userId: string) => {
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

    try {
      // Save chat to Supabase
      const { data, error } = await supabase
        .from('chats')
        .insert({
          id: newChatId,
          participant1: user.id,
          participant2: userId,
          unread_count: 0
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      setChats(prev => [...prev, newChat]);
      setActiveChat(newChatId);
      toast.success("Chat started");
      
      return newChatId;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error("Failed to start chat");
      
      // Fallback to local state
      setChats(prev => [...prev, newChat]);
      setActiveChat(newChatId);
      
      return newChatId;
    }
  };

  // Function to get user suggestions - only real users from Supabase
  const getSuggestedUsers = async (): Promise<User[]> => {
    if (!user) return [];
    
    try {
      // Get real users from Supabase
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);
      
      if (error) {
        console.error('Error fetching profiles from Supabase:', error);
        return [];
      }
      
      // Convert Supabase profiles to User objects
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
      
      // Fallback to localStorage if no Supabase profiles found
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          // Convert string dates back to Date objects and filter out bot accounts and current user
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

  // Function to register a new real user in the chat system
  const registerUser = async (newUser: User) => {
    if (!newUser.id || !newUser.username) {
      console.error("Invalid user data");
      return;
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.id === newUser.id);
    if (existingUser) {
      // User already exists, don't add again
      return;
    }
    
    // Add new user to local state
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    // Add to localStorage as backup
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    try {
      // Update user profile in Supabase
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

  // Function to get user by ID
  const getUserById = async (userId: string): Promise<User | undefined> => {
    // First check local state
    const localUser = users.find(u => u.id === userId);
    if (localUser) return localUser;
    
    // If not found, try to fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        throw error;
      }
      
      const user: User = {
        id: data.id,
        username: data.username || 'user',
        displayName: data.username || 'User',
        avatar: data.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
        createdAt: new Date(data.updated_at || new Date()),
        bio: data.bio || '',
        isPro: false
      };
      
      // Update local state
      setUsers(prevUsers => {
        if (prevUsers.some(u => u.id === user.id)) {
          return prevUsers.map(u => u.id === user.id ? user : u);
        } else {
          return [...prevUsers, user];
        }
      });
      
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  };

  // Function to get all friends for a user
  const getFriends = async (): Promise<User[]> => {
    if (!user) return [];
    
    try {
      // Get friends from Supabase
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
      
      // Get friend user details
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
