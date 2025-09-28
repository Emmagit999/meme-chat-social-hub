
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessaging } from "@/hooks/use-messaging";
import { useAuth } from "@/context/auth-context";
import { MessageCircle, Plus, Search, Users, RefreshCw, WifiOff, AlertTriangle, ChevronDown, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { MessageInput } from "@/components/chat/message-input";
import { useChatNotifications } from "@/hooks/use-chat-notifications";
import { User } from '@/types';
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OnlineUsersList } from "@/components/chat/online-users-list";
import { OnlineIndicator } from "@/components/ui/online-indicator";
import { NotificationBubble } from "@/components/ui/notification-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";

const EmptyState = () => (
  <div className="h-full flex items-center justify-center flex-col p-4 text-center">
    <div className="mb-6 p-6 rounded-full glow-pulse" 
         style={{ background: 'var(--gradient-primary)' }}>
      <MessageCircle className="h-12 w-12 text-white" />
    </div>
    <h3 className="text-2xl font-bold mb-3 text-primary">Your messages</h3>
    <p className="mb-6 text-muted-foreground max-w-sm">
      Send private messages to pals and connect with new people in our vibrant community
    </p>
    <Button 
      onClick={() => window.location.href = '/merge'}
      className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-full
                 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl
                 border-0 font-semibold"
    >
      Start a conversation
    </Button>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col gap-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    chats, 
    messages,
    activeChat, 
    setActiveChat,
    sendMessage,
    deleteMessage,
    editMessage,
    isLoading,
    isSending,
    isConnected,
    reconnect,
    getUserById,
    getSuggestedUsers,
    getFriends,
    lastError,
    optimisticMessages,
    deletingMessages
  } = useMessaging();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showChatList, setShowChatList] = useState(!isMobile || !activeChat);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { startNotification, stopNotification } = useChatNotifications({
    title: '🔴 New Message!'
  });
  
  useEffect(() => {
    // Fetch suggested users when component mounts
    const fetchSuggestedUsers = async () => {
      try {
        const users = await getSuggestedUsers();
        setSuggestedUsers(users);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        setSuggestedUsers([]);
      }
    };
    
    fetchSuggestedUsers();
  }, [getSuggestedUsers]);

  // Handle scrolling behavior
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShowScrollToBottom(!isNearBottom);
      
      // Track unread messages if not at bottom
      if (!isNearBottom && messages.length > 0) {
        const lastReadIndex = messages.findIndex(m => m.senderId !== user?.id && !m.read);
        if (lastReadIndex >= 0) {
          setUnreadCount(messages.length - lastReadIndex);
        }
      } else {
        setUnreadCount(0);
      }
    };
    
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => {
        messagesContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [messages, user?.id]);
  
  // Auto-scroll to bottom for new messages and handle notifications
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      if (isNearBottom) {
        scrollToBottom();
      }
      
      // Check for new unread messages and trigger tab notification
      const newUnreadMessages = messages.filter(m => m.senderId !== user?.id && !m.read);
      if (newUnreadMessages.length > 0 && document.hidden) {
        startNotification();
      }
    }
  }, [messages, user?.id, startNotification]);

  useEffect(() => {
    // Handle mobile view switching between chat list and active chat
    if (isMobile) {
      setShowChatList(!activeChat);
    } else {
      setShowChatList(true);
    }
    
    // Always scroll to bottom when chat changes
    if (activeChat) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isMobile, activeChat]);
  
  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
    setTimeout(scrollToBottom, 300);
  };
  
  const handleBackToList = () => {
    if (isMobile) {
      setActiveChat(null);
      setShowChatList(true);
    } else {
      navigate('/pals'); // On desktop, back button goes to pals page
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    return await deleteMessage(messageId);
  };
  
  const handleEditMessage = async (messageId: string, content: string) => {
    return await editMessage(messageId, content);
  };
  
  if (!user) return null;
  
  // Convert AuthUser to User type with the required createdAt property
  const currentUser: User = {
    ...user,
    createdAt: new Date(),
    username: user?.username || 'user',
  };
  
  // Find the other user in the active chat
  const getOtherUser = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return { name: "Unknown User", id: "", avatar: "/assets/avatar1.jpg" };
    
    const otherUserId = chat.participants.find(id => id !== user?.id);
    if (!otherUserId) return { name: "Unknown User", id: "", avatar: "/assets/avatar1.jpg" };
    
    const otherUser = suggestedUsers.find(u => u.id === otherUserId);
    if (otherUser) {
      return { 
        name: otherUser.displayName || otherUser.username,
        id: otherUser.id,
        avatar: otherUser.avatar || "/assets/avatar1.jpg"
      };
    }
    
    // If user not found in suggested users, return placeholder
    return { name: "Loading...", id: otherUserId, avatar: "/assets/avatar1.jpg" };
  };

  const getOtherUserAvatar = (chatId: string) => {
    const otherUser = getOtherUser(chatId);
    return otherUser.avatar;
  };

  // Only show optimistic messages that belong to the active chat
  const filteredOptimisticMessages = activeChat && user ? (
    optimisticMessages.filter((m) => {
      const otherId = getOtherUser(activeChat).id;
      return (
        (m.sender_id === user.id && m.receiver_id === otherId) ||
        (m.receiver_id === user.id && m.sender_id === otherId)
      );
    })
  ) : [];


  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    
    const otherUser = getOtherUser(chat.id);
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container py-16 pb-24 md:pb-16 max-w-6xl">
        <div className="flex h-[calc(100vh-8rem)] bg-card rounded-2xl border border-border 
                       overflow-hidden shadow-2xl relative"
             style={{ boxShadow: 'var(--shadow-bubble)' }}>
          {/* Chat List Sidebar */}
          <div className={`${isMobile && activeChat ? 'hidden' : 'flex'} w-full md:w-96 lg:w-80 border-r border-border flex-col bg-muted/30`}>
            <div className="p-4 border-b border-border chat-header-gradient">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white">Messages</h2>
                <div className="w-3 h-3 chat-online-indicator rounded-full"></div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-12 pr-4 py-3 text-sm bg-white/10 backdrop-blur-sm 
                           border border-white/20 rounded-xl text-white placeholder:text-white/70
                           focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20
                           transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1 overflow-y-auto">
              {isLoading ? (
                <LoadingState />
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <p className="mb-2">No conversations yet</p>
                  <p className="text-sm">Start chatting with someone from the Merge page!</p>
                  <Button 
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => navigate('/merge')}
                  >
                    Find People
                  </Button>
                </div>
              ) : (
                <div>
                  {filteredChats.map(chat => {
                    const otherUser = getOtherUser(chat.id);
                    return (
                      <button
                        key={chat.id}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-primary/10 
                                  transition-all duration-300 border-b border-border/50 relative
                                  ${activeChat === chat.id ? 'bg-primary/20 border-l-4 border-l-primary' : ''}
                                  hover:scale-[1.02] hover:shadow-md group`}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                              {otherUser.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 chat-online-indicator 
                                       rounded-full border-2 border-card"></div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {otherUser.name}
                            </p>
                            {chat.lastMessageDate && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(chat.lastMessageDate), 'h:mm a')}
                              </span>
                            )}
                          </div>
                          {chat.lastMessage ? (
                            chat.lastMessage.includes('[deleted]') ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground italic">
                                <Trash2 className="h-3 w-3" />
                                <span>Message deleted</span>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                                {chat.lastMessage}
                              </p>
                            )
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Messages Area */}
          {activeChat ? (
            <div className="flex-1 flex flex-col bg-background relative">
              <ChatHeader
                username={getOtherUser(activeChat).name}
                avatarSrc={getOtherUser(activeChat).avatar}
                userId={getOtherUser(activeChat).id}
                onBackClick={handleBackToList}
                showBackButton={true}
                isConnected={isConnected}
              />
              
              <ScrollArea ref={messagesContainerRef} className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {/* Real messages from database */}
                    {messages.map(message => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        currentUser={currentUser}
                        otherUserAvatar={getOtherUserAvatar(activeChat)}
                        onDeleteMessage={handleDeleteMessage}
                        onEditMessage={handleEditMessage}
                        isDeleting={deletingMessages.has(message.id)}
                      />
                    ))}
                    
                    {/* Optimistic messages for immediate feedback */}
                    {filteredOptimisticMessages.map(optMessage => (
                      <ChatMessage
                        key={`optimistic-${optMessage.id}`}
                        message={{
                          id: optMessage.id,
                          content: optMessage.content,
                          senderId: optMessage.sender_id,
                          receiverId: optMessage.receiver_id,
                          createdAt: new Date(optMessage.created_at),
                          edited: false,
                          read: false
                        }}
                        currentUser={currentUser}
                        otherUserAvatar={getOtherUserAvatar(activeChat)}
                        isOptimistic={true}
                        status={optMessage.status}
                      />
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <div className="border-t border-border">
                <MessageInput 
                  onSendMessage={sendMessage}
                  isSending={isSending}
                  isConnected={isConnected}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Notification Bubbles */}
      <NotificationBubble />
    </div>
  );
};

export default ChatPage;
