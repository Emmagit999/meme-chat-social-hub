
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/context/auth-context";
import { Send } from "lucide-react";
import { format } from "date-fns";

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    chats, 
    messages,
    activeChat, 
    setActiveChat,
    sendMessage,
    isLoading 
  } = useChat();
  const [messageText, setMessageText] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessage(messageText);
    setMessageText('');
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
      <h1 className="text-2xl font-bold mb-6">Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Chat List */}
        <div className="md:col-span-1 border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-card">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          
          <ScrollArea className="h-[calc(100%-4rem)]">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-pulse-subtle">Loading...</div>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div>
                {chats.map(chat => (
                  <button
                    key={chat.id}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-secondary transition-colors ${
                      activeChat === chat.id ? 'bg-secondary' : ''
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
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Chat Messages */}
        <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
          {activeChat ? (
            <>
              <div className="p-4 border-b bg-card">
                <h2 className="font-semibold">{getOtherUser(activeChat)}</h2>
              </div>
              
              <ScrollArea className="flex-1 p-4">
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
                              ? 'bg-memeGreen text-white'
                              : 'bg-secondary'
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
              
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" className="bg-memeGreen hover:bg-memeGreen/90">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col p-4 text-muted-foreground">
              <p className="mb-2">Select a conversation to start chatting</p>
              <p className="text-sm">Or create a new conversation from the Merge section</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
