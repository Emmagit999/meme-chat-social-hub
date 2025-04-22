
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/context/auth-context";
import { MessageCircle, Plus, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { MessageInput } from "@/components/chat/message-input";
import { User } from '@/types';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const EmptyState = () => (
  <div className="h-full flex items-center justify-center flex-col p-4 text-center">
    <div className="mb-4 p-4 rounded-full bg-gray-800">
      <MessageCircle className="h-10 w-10 text-yellow-500" />
    </div>
    <h3 className="text-xl font-medium mb-2 text-yellow-500">Your messages</h3>
    <p className="mb-4 text-gray-400">Send private messages to friends and connect with new people</p>
    <Button 
      onClick={() => window.location.href = '/merge'}
      className="bg-yellow-500 hover:bg-yellow-600 text-black"
    >
      Start a conversation
    </Button>
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
    isLoading,
    getSuggestedUsers,
    getUserById
  } = useChat();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showChatList, setShowChatList] = useState(!isMobile || !activeChat);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  
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
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Handle mobile view switching between chat list and active chat
    if (isMobile) {
      setShowChatList(!activeChat);
    } else {
      setShowChatList(true);
    }
  }, [isMobile, activeChat]);
  
  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
  };
  
  const handleBackToList = () => {
    if (isMobile) {
      setActiveChat(null);
      setShowChatList(true);
    }
  };
  
  if (!user) return null;
  
  // Fix: Convert AuthUser to User type with the required createdAt property
  const currentUser: User = {
    ...user,
    createdAt: new Date(), // Add missing createdAt property
    username: user.username || 'user',
  };
  
  // Find the other user in the active chat
  const getOtherUser = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return { name: "Unknown User", id: "", avatar: "/assets/avatar1.jpg" };
    
    const otherUserId = chat.participants.find(id => id !== user.id);
    if (!otherUserId) return { name: "Unknown User", id: "", avatar: "/assets/avatar1.jpg" };
    
    const otherUser = suggestedUsers.find(u => u.id === otherUserId);
    if (otherUser) {
      return { 
        name: otherUser.displayName || otherUser.username,
        id: otherUser.id,
        avatar: otherUser.avatar || "/assets/avatar1.jpg"
      };
    }
    
    // If user not found in suggested users, use backup method
    if (otherUserId === "2") {
      return { name: "Roast Master", id: "2", avatar: "/assets/avatar2.jpg" };
    } else {
      return { name: "Meme Lord", id: "1", avatar: "/assets/avatar1.jpg" };
    }
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
    <div className="container py-4 px-0 md:px-4 md:py-6 max-w-full md:max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-[calc(100vh-8rem)] overflow-hidden shadow-lg rounded-lg border border-gray-700">
        {/* Chat List */}
        {showChatList && (
          <div className={`${isMobile ? 'col-span-1' : 'md:col-span-1'} bg-gray-900 border-r border-gray-700`}>
            <div className="p-4 border-b border-gray-700 bg-black text-yellow-500">
              <h2 className="font-semibold flex items-center">
                <span>{user.displayName || user.username}</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-800"
                    onClick={() => navigate('/search')}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <div 
                    className="bg-yellow-500 text-black h-7 w-7 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={() => navigate('/merge')}
                  >
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </h2>
            </div>
            
            <div className="p-2 border-b border-gray-700">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 text-yellow-500 placeholder:text-yellow-500/50"
              />
            </div>
            
            <ScrollArea className="h-[calc(100%-8rem)]">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse text-yellow-500">Loading...</div>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <p className="mb-2">No conversations yet</p>
                  <p className="text-sm">Start chatting with someone from the Merge page!</p>
                  <Button 
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => navigate('/merge')}
                  >
                    Find people
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
                                {format(chat.lastMessageDate, 'h:mm a')}
                              </span>
                            )}
                          </div>
                          {chat.lastMessage && (
                            <p className="text-sm text-gray-400 truncate">
                              {chat.lastMessage}
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
                onClick={() => navigate('/merge')}
              >
                <Users className="h-4 w-4" />
                Find New Friends
              </Button>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        <div className={`${isMobile ? 'col-span-1' : 'md:col-span-2'} flex flex-col bg-gray-900 ${(!isMobile || !showChatList) ? 'block' : 'hidden'}`}>
          {activeChat ? (
            <>
              <ChatHeader 
                username={getOtherUser(activeChat).name}
                avatarSrc={getOtherUser(activeChat).avatar}
                userId={getOtherUser(activeChat).id}
                onBackClick={handleBackToList}
                showBackButton={isMobile}
              />
              
              <ScrollArea className="flex-1 p-4 bg-gray-900">
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
                      />
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <MessageInput onSendMessage={sendMessage} />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
