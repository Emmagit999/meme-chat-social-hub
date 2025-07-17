import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Copy, Check, Mail, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

const OpaySupport: React.FC = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleEmailDeveloper = () => {
    const subject = encodeURIComponent("MemChat Support - Thank you!");
    const body = encodeURIComponent("Hi Emmanuel,\n\nI love using MemChat and wanted to support the project!\n\nBest regards");
    window.open(`mailto:emzywoo89@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-yellow-900/20 py-8">
      <div className="container max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/about')}
          className="mb-6 text-yellow-500 hover:text-yellow-400 hover:bg-gray-800/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to About
        </Button>

        <div className={`transition-all duration-1000 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="border-yellow-500/30 bg-black/80 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full blur-lg animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-full">
                    <Heart className="h-8 w-8 text-black animate-bounce" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Support MemChat Development
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Help keep this amazing platform free and constantly improving!
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-semibold text-yellow-500">Send support via Opay</span>
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-gray-300 text-sm">
                  Your support helps keep MemChat running and enables new features!
                </p>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-yellow-500 mb-4">Opay Account Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Account Number</p>
                        <p className="text-lg font-bold text-yellow-500">8109595054</p>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard('8109595054', 'Account Number')}
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        {copiedField === 'Account Number' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Account Name</p>
                        <p className="text-lg font-bold text-yellow-500">UCHECHUKWU EMMANUEL</p>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard('UCHECHUKWU EMMANUEL', 'Account Name')}
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        {copiedField === 'Account Name' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Bank</p>
                        <p className="text-lg font-bold text-yellow-500">Opay</p>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard('Opay', 'Bank')}
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        {copiedField === 'Bank' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-gray-400">
                  Any amount is appreciated and goes directly towards improving MemChat!
                </p>
                
                <Button 
                  onClick={handleEmailDeveloper}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Developer
                </Button>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Why Support MemChat?</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Keep the platform completely free for all users</li>
                  <li>• Fund new features and improvements</li>
                  <li>• Support independent development</li>
                  <li>• Maintain high security and privacy standards</li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 italic">
                  Made with ❤️ by Gods Love Network
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpaySupport;