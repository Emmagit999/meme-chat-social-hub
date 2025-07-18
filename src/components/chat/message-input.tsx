
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Send, AlertCircle, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<any>;
  isSending: boolean;
  isConnected: boolean;
}

const EMOJI_LIST = ["😀", "😂", "😊", "😍", "🥰", "😎", "🙌", "👍", "❤️", "🔥", "👋", "🎉", "🤔", "😢", "😭", "😡", "🤮", "🤯", "🥳", "😴", "👍", "👏", "🙌", "🤣", "😎", "🙄", "😘", "💯", "🔥", "👀"];

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isSending, 
  isConnected 
}) => {
  const [messageText, setMessageText] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARACTERS = 500;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Focus input on mount and when scrolled into view
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    focusInput();
    
    // Detect if mobile keyboard should be shown (when scrolled to bottom)
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 10;
      if (isAtBottom) {
        focusInput();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting || isSending || !messageText.trim() || !isConnected) return;
    
    try {
      setIsSubmitting(true);
      await onSendMessage(messageText);
      setMessageText('');
      setCharacterCount(0);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    if (characterCount + emoji.length <= MAX_CHARACTERS) {
      setMessageText(prev => prev + emoji);
      setCharacterCount(prev => prev + emoji.length);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARACTERS) {
      setMessageText(newText);
      setCharacterCount(newText.length);
    }
  };

  const isOverLimit = characterCount > MAX_CHARACTERS;
  const isNearLimit = characterCount > MAX_CHARACTERS * 0.9;

  return (
    <div className="p-3 border-t border-gray-700 bg-black sticky bottom-0 z-10">
      {!isConnected && (
        <div className="flex items-center justify-center mb-2 bg-red-900/20 text-red-500 p-2 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Connection lost. Reconnecting...</span>
        </div>
      )}
      
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-900">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_LIST.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
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
        
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Send a message"
            value={messageText}
            onChange={handleInputChange}
            className={`flex-1 border-gray-700 bg-gray-900 text-yellow-500 rounded-full placeholder-yellow-500/50 pr-16 ${
              isNearLimit ? 'border-yellow-500' : ''
            } ${
              isOverLimit ? 'border-red-500' : ''
            }`}
            autoFocus
            disabled={!isConnected || isSending || isSubmitting}
          />
          <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${
            isNearLimit ? 'text-yellow-500' : 'text-gray-500'
          } ${
            isOverLimit ? 'text-red-500' : ''
          }`}>
            {characterCount}/{MAX_CHARACTERS}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-full h-10 w-10 p-0 flex items-center justify-center"
          disabled={!messageText.trim() || !isConnected || isSending || isSubmitting}
        >
          {isSending || isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};
