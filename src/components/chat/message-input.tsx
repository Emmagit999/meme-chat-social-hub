
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

const EMOJI_LIST = ["😀", "😂", "😊", "😍", "🥰", "😎", "🙌", "👍", "❤️", "🔥", "👋", "🎉", "🤔", "😢", "😭", "😡", "🤮", "🤯", "🥳", "😴", "👍", "👏", "🙌", "🤣", "😎", "🙄", "😘", "💯", "🔥", "👀"];

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [messageText, setMessageText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    onSendMessage(messageText);
    setMessageText('');
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-black flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-900">
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
        className="flex-1 border-gray-700 bg-gray-900 text-yellow-500 rounded-full placeholder-yellow-500/50"
        autoFocus
      />
      <Button 
        type="submit" 
        className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-full h-10 w-10 p-0 flex items-center justify-center"
        disabled={!messageText.trim()}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};
