import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface OptimisticMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  status: 'sending' | 'sent' | 'failed';
  isOptimistic: boolean;
}

export const useOptimisticMessaging = () => {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  const addOptimisticMessage = useCallback((
    content: string,
    senderId: string,
    receiverId: string
  ): string => {
    const messageId = uuidv4();
    const optimisticMessage: OptimisticMessage = {
      id: messageId,
      content,
      sender_id: senderId,
      receiver_id: receiverId,
      created_at: new Date().toISOString(),
      status: 'sending',
      isOptimistic: true
    };

    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    return messageId;
  }, []);

  const updateMessageStatus = useCallback((
    messageId: string,
    status: 'sent' | 'failed'
  ) => {
    setOptimisticMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, status }
          : msg
      )
    );
  }, []);

  const removeOptimisticMessage = useCallback((messageId: string) => {
    setOptimisticMessages(prev =>
      prev.filter(msg => msg.id !== messageId)
    );
  }, []);

  const removeOptimisticMessageByContent = useCallback((content: string, senderId: string) => {
    setOptimisticMessages(prev =>
      prev.filter(msg => !(msg.content === content && msg.sender_id === senderId))
    );
  }, []);

  const clearOptimisticMessages = useCallback(() => {
    setOptimisticMessages([]);
  }, []);

  return {
    optimisticMessages,
    addOptimisticMessage,
    updateMessageStatus,
    removeOptimisticMessage,
    removeOptimisticMessageByContent,
    clearOptimisticMessages
  };
};