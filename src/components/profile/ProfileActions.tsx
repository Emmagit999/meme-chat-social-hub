
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, UserPlus, UserCheck, Clock, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { usePalRequests } from '@/hooks/use-pal-requests';
import { useChat } from '@/hooks/use-chat';
import { User } from '@/types';
import { useAuth } from '@/hooks/use-auth';

interface ProfileActionsProps {
  profileUser: User;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({ profileUser }) => {
  const { user } = useAuth();
  const { startNewChat } = useChat();
  const { getPalStatus, sendPalRequest } = usePalRequests();
  const navigate = useNavigate();
  
  const [palStatus, setPalStatus] = useState<'none' | 'pending' | 'requested' | 'accepted'>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPalStatus = async () => {
      setIsLoading(true);
      const status = await getPalStatus(profileUser.id);
      setPalStatus(status);
      setIsLoading(false);
    };
    
    if (user && profileUser && profileUser.id !== user.id) {
      checkPalStatus();
    }
  }, [user, profileUser, getPalStatus]);

  const handleMessageUser = async () => {
    const chatId = await startNewChat(profileUser.id);
    if (chatId) {
      navigate('/chat');
    }
  };

  const handleSendPalRequest = async () => {
    setIsLoading(true);
    const success = await sendPalRequest(profileUser.id);
    if (success) {
      setPalStatus('requested');
    }
    setIsLoading(false);
  };

  if (!user || profileUser.id === user.id) return null;

  return (
    <div className="mt-6 flex justify-center gap-3">
      <Button 
        onClick={handleMessageUser}
        className="bg-yellow-500 hover:bg-yellow-600 text-black flex items-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Message
      </Button>

      {isLoading ? (
        <Button disabled variant="outline" className="border-yellow-300 text-yellow-500">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </Button>
      ) : palStatus === 'accepted' ? (
        <Button 
          disabled 
          variant="outline" 
          className="border-green-500 text-green-500"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Pals
        </Button>
      ) : palStatus === 'requested' ? (
        <Button 
          disabled 
          variant="outline" 
          className="border-yellow-300 text-yellow-500"
        >
          <Clock className="h-4 w-4 mr-2" />
          Request Sent
        </Button>
      ) : palStatus === 'pending' ? (
        <Button 
          onClick={() => navigate('/pals')}
          variant="outline" 
          className="border-yellow-300 text-yellow-500"
        >
          <Clock className="h-4 w-4 mr-2" />
          Respond to Request
        </Button>
      ) : (
        <Button 
          onClick={handleSendPalRequest}
          variant="outline" 
          className="border-yellow-300 text-yellow-500"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add as Pal
        </Button>
      )}
    </div>
  );
};
