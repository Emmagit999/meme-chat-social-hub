
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessaging } from "@/hooks/use-messaging";
import { useAuth } from "@/context/auth-context";
import { MessageCircle, Plus, Search, Users, RefreshCw, WifiOff, AlertTriangle, ChevronDown } from "lucide-react";
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

const EmptyState = () => (
  <div className="h-full flex items-center justify-center flex-col p-4 text-center">
    <div className="mb-4 p-4 rounded-full bg-gray-800">
      <MessageCircle className="h-10 w-10 text-yellow-500" />
    </div>
    <h3 className="text-xl font-medium mb-2 text-yellow-500">Your messages</h3>
    <p className="mb-4 text-gray-400">Send private messages to pals and connect with new people</p>
    <Button 
      onClick={() => window.location.href = '/merge'}
      className="bg-yellow-500 hover:bg-yellow-600 text-black"
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
    lastError
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

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    
    const otherUser = getOtherUser(chat.id);
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16 pb-24 md:pb-16 max-w-6xl">
        <div className="flex h-[calc(100vh-8rem)] bg-card rounded-lg border border-border overflow-hidden">
          {/* Chat List Sidebar */}
          <div className={`${isMobile && activeChat ? 'hidden' : 'flex'} w-full md:w-96 lg:w-80 border-r border-border flex-col`}>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Messages</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    getFriends();
                    reconnect();
                  }}
                  title="Refresh messages"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                        className={`w-full p-3 flex items-center gap-3 hover:bg-gray-800 transition-colors border-b border-gray-800 ${
                          activeChat === chat.id ? 'bg-gray-800' : ''
                        }`}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser.avatar} />
                          <AvatarFallback className="bg-gray-700 text-yellow-500">
                            {otherUser.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="flex justify-between">
                            <p className="font-medium text-yellow-500">{otherUser.name}</p>
                            {chat.lastMessageDate && (
                              <span className="text-xs text-gray-400">
                                {format(new Date(chat.lastMessageDate), 'h:mm a')}
                              </span>
                            )}
                          </div>
                           {chat.lastMessage && (
                             <p className="text-sm text-muted-foreground truncate">
                               {/* Show 😁 for received messages, 😶 for sent messages */}
                               {chat.lastMessage.startsWith(user?.username || user?.email || '') ? '😶' : '😁'}: {chat.lastMessage}
                             </p>
                           )}
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-3 border-t border-gray-700 bg-black">
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black flex items-center gap-2"
                onClick={() => navigate('/pals')}
              >
                <Users className="h-4 w-4" />
                My Pals
              </Button>
            </div>
          </div>
          
          {/* Chat Messages Area */}
          <div className={`${!activeChat && isMobile ? 'hidden' : 'flex'} flex-1 flex-col`}>
          {activeChat ? (
            <>
              <ChatHeader 
                username={getOtherUser(activeChat).name}
                avatarSrc={getOtherUser(activeChat).avatar}
                userId={getOtherUser(activeChat).id}
                onBackClick={handleBackToList}
                showBackButton={true}
                isConnected={isConnected}
              />
              
              <ScrollArea className="flex-1 p-4">{/* scrollable message area */}
                {!isConnected && (
                  <div className="mb-4 p-3 bg-red-900/20 text-red-500 rounded-md flex items-center">
                    <WifiOff className="h-4 w-4 mr-2" />
                    <span className="flex-1">Connection lost. Messages may not be delivered.</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="ml-2 border-red-500 text-red-500 hover:bg-red-500/20"
                      onClick={() => reconnect()}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reconnect
                    </Button>
                  </div>
                )}
                
                {lastError && (
                  <div className="mb-4 p-3 bg-amber-900/20 text-amber-500 rounded-md flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="flex-1">There was an error sending your last message. Please try again.</span>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        currentUser={currentUser}
                        otherUserAvatar={getOtherUserAvatar(activeChat)}
                        onDeleteMessage={handleDeleteMessage}
                        onEditMessage={handleEditMessage}
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
            </>
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
      </div>
    </div>
  );
};

export default ChatPage;
