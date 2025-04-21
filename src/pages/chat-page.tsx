
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/context/auth-context";
import { Smile, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const EMOJI_LIST = ["😀", "😂", "😊", "😍", "🥰", "😎", "🙌", "👍", "❤️", "🔥", "👋", "🎉", "🤔", "😢", "😭", "😡", "🤮", "🤯", "🥳", "😴", "👍", "👏", "🙌"];

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    chats, 
    messages,
    activeChat, 
    setActiveChat,
    sendMessage,
    isLoading,
    getSuggestedUsers
  } = useChat();
  const [messageText, setMessageText] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestedUsers = getSuggestedUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showChatList, setShowChatList] = useState(!isMobile || !activeChat);
  
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
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessage(messageText);
    setMessageText('');
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    inputRef.current?.focus();
  };
  
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
  
  // Find the other user in the active chat
  const getOtherUser = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return "Unknown User";
    
    const otherUserId = chat.participants.find(id => id !== user.id);
    if (!otherUserId) return "Unknown User";
    
    const otherUser = suggestedUsers.find(u => u.id === otherUserId);
    if (otherUser) {
      return otherUser.displayName || otherUser.username;
    }
    
    // If user not found in suggested users, use backup method
    return otherUserId === "2" ? "Roast Master" : "Meme Lord";
  };

  return (
    <div className="container py-4 px-0 md:px-4 md:py-6 max-w-full md:max-w-6xl mx-auto">
      <div className="grid grid-cols-1 gap-0 h-[calc(100vh-8rem)] overflow-hidden shadow-lg rounded-lg border border-gray-200">
        {/* Chat List */}
        {showChatList && (
          <div className={`${isMobile ? 'col-span-1' : 'md:col-span-1'} bg-white border-r border-gray-200`}>
            <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
              <h2 className="font-semibold flex items-center">
                <span>{user.displayName || user.username}</span>
                <div className="ml-auto bg-white text-blue-600 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer">
                  <span className="text-sm font-bold">+</span>
                </div>
              </h2>
            </div>
            
            <ScrollArea className="h-[calc(100%-4rem)]">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="mb-2">No conversations yet</p>
                  <p className="text-sm">Start chatting with someone from the Merge page!</p>
                </div>
              ) : (
                <div>
                  {chats.map(chat => (
                    <button
                      key={chat.id}
                      className={`w-full p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors border-b border-gray-100 ${
                        activeChat === chat.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={chat.participants.includes("2") 
                            ? "/assets/avatar2.jpg" 
                            : "/assets/avatar1.jpg"} 
                        />
                        <AvatarFallback>
                          {getOtherUser(chat.id).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex justify-between">
                          <p className="font-medium">{getOtherUser(chat.id)}</p>
                          {chat.lastMessageDate && (
                            <span className="text-xs text-gray-500">
                              {format(chat.lastMessageDate, 'h:mm a')}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage}
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="bg-memeGreen text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {chat.unreadCount}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
        
        {/* Chat Messages */}
        {(!isMobile || !showChatList) && (
          <div className={`${isMobile ? 'col-span-1' : 'md:col-span-2'} flex flex-col bg-gray-50`}>
            {activeChat ? (
              <>
                <div className="p-3 border-b border-gray-200 bg-white flex items-center">
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleBackToList}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage 
                      src={messages[0]?.senderId === user.id 
                        ? messages[0]?.receiverId === "2" ? "/assets/avatar2.jpg" : "/assets/avatar1.jpg"
                        : messages[0]?.senderId === "2" ? "/assets/avatar2.jpg" : "/assets/avatar1.jpg"} 
                    />
                    <AvatarFallback>
                      {getOtherUser(activeChat).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="font-semibold">{getOtherUser(activeChat)}</h2>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map(message => {
                        const isSentByMe = message.senderId === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isSentByMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!isSentByMe && (
                              <Avatar className="h-8 w-8 mr-2 self-end">
                                <AvatarImage 
                                  src={message.senderId === "2" ? "/assets/avatar2.jpg" : "/assets/avatar1.jpg"} 
                                />
                                <AvatarFallback>
                                  {message.senderId.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isSentByMe
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <p>{message.content}</p>
                              <div
                                className={`text-xs mt-1 ${
                                  isSentByMe
                                    ? 'text-white/70 text-right'
                                    : 'text-gray-500'
                                }`}
                              >
                                {format(message.createdAt, 'h:mm a')}
                              </div>
                            </div>
                            {isSentByMe && (
                              <Avatar className="h-8 w-8 ml-2 self-end">
                                <AvatarImage 
                                  src={user.avatar || "/assets/avatar1.jpg"} 
                                />
                                <AvatarFallback>
                                  {user.displayName?.substring(0, 2) || user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex gap-2 bg-white">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="text-gray-500">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            className="text-xl hover:bg-gray-100 p-1 rounded cursor-pointer"
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Input
                    ref={inputRef}
                    placeholder="Send a message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 border-gray-200 rounded-full"
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center flex-col p-4 text-muted-foreground">
                <p className="mb-2 text-gray-700">Select a conversation to start chatting</p>
                <p className="text-sm">Or create a new conversation from the Merge section</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
