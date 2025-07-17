import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  username: string;
  content: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ 
  isOpen, 
  onClose, 
  postId, 
  username, 
  content 
}) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/post/${postId}`;
  const shareText = `Check out this post by ${username}: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent('Check out this MemChat post')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(emailUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">Share Post</DialogTitle>
          <DialogDescription>
            Share this post with others
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={shareUrl}
              className="flex-1 bg-gray-800 border-gray-700 text-yellow-500"
            />
            <Button 
              onClick={copyToClipboard}
              size="sm" 
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={shareViaWhatsApp}
              variant="outline" 
              className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={shareViaEmail}
              variant="outline" 
              className="flex-1 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            <Link className="h-3 w-3 inline mr-1" />
            Anyone with this link can view the post
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};