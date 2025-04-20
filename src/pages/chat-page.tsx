
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/context/auth-context";
import { Smile, Send } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User } from '@/types';

const EMOJI_LIST = ["😀", "😂", "😊", "😍", "🥰", "😎", "🙌", "👍", "❤️", "🔥", "👋", "🎉", "🤔", "😢", "😭", "😡", "🤮", "🤯", "🥳", "😴"];

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
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
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
  
  if (!user) return null;
  
  // Find the other user in the active chat
  const getOtherUser = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return "Unknown User";
    
    const otherUserId = chat.participants.find(id => id !== user.id);
    if (!otherUserId) return "Unknown User";
    
    // Get mock username from messages
    const message = messages.find(m => m.senderId === otherUserId || m.receiverId === otherUserId);
    if (!message) return "Unknown User";
    
    return message.senderId === otherUserId 
      ? `@${message.senderId === "2" ? "roast_master" : "meme_lord"}` 
      : `@${message.receiverId === "2" ? "roast_master" : "meme_lord"}`;
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)] border-2 border-yellow-400 rounded-lg overflow-hidden shadow-gold">
        {/* Chat List */}
        <div className="md:col-span-1 border-r border-yellow-400 bg-white">
          <div className="p-4 border-b border-yellow-400 bg-gradient-to-r from-yellow-100 to-yellow-50">
            <h2 className="font-semibold text-yellow-700">Conversations</h2>
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
                    className={`w-full p-3 flex items-center gap-3 hover:bg-yellow-50 transition-colors ${
                      activeChat === chat.id ? 'bg-yellow-100' : ''
                    }`}
                    onClick={() => setActiveChat(chat.id)}
                  >
                    <Avatar>
                      <AvatarImage 
                        src={chat.participants.includes("2") 
                          ? "/assets/avatar2.jpg" 
                          : "/assets/avatar1.jpg"} 
                      />
                      <AvatarFallback>
                        {getOtherUser(chat.id).substring(1, 3).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{getOtherUser(chat.id)}</p>
                      {chat.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage}
                        </p>
                      )}
                    </div>
                    {chat.lastMessageDate && (
                      <div className="text-xs text-muted-foreground">
                        {format(chat.lastMessageDate, 'hh:mm a')}
                      </div>
                    )}
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
        
        {/* Chat Messages */}
        <div className="md:col-span-2 flex flex-col bg-gradient-to-b from-yellow-50 to-white">
          {activeChat ? (
            <>
              <div className="p-4 border-b border-yellow-400 bg-gradient-to-r from-yellow-100 to-yellow-50 flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage 
                    src={messages[0]?.senderId === user.id 
                      ? messages[0]?.receiverId === "2" ? "/assets/avatar2.jpg" : "/assets/avatar1.jpg"
                      : messages[0]?.senderId === "2" ? "/assets/avatar2.jpg" : "/assets/avatar1.jpg"} 
                  />
                  <AvatarFallback>
                    {getOtherUser(activeChat).substring(1, 3).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-semibold">{getOtherUser(activeChat)}</h2>
              </div>
              
              <ScrollArea className="flex-1 p-4 bg-opacity-30 bg-pattern-subtle">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.senderId === user.id
                              ? 'bg-memeGreen text-white rounded-tr-none'
                              : 'bg-white border border-yellow-200 rounded-tl-none'
                          }`}
                        >
                          <p>{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              message.senderId === user.id
                                ? 'text-white/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {format(message.createdAt, 'hh:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <form onSubmit={handleSendMessage} className="p-3 border-t border-yellow-200 flex gap-2 bg-white">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="text-yellow-500">
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-5 gap-2">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="text-xl hover:bg-yellow-100 p-1 rounded cursor-pointer"
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
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 border-yellow-200 focus:border-yellow-400"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  className="bg-memeGreen hover:bg-memeGreen/90 shadow-sm"
                  disabled={!messageText.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col p-4 text-muted-foreground">
              <p className="mb-2 text-yellow-700">Select a conversation to start chatting</p>
              <p className="text-sm">Or create a new conversation from the Merge section</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
