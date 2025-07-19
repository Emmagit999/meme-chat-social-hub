import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Coffee, Star, Github, Mail, Shield, Code, Users } from "lucide-react";
import { toast } from "sonner";

const AboutPage: React.FC = () => {
  const handleSupport = () => {
    // You can replace this with actual payment/donation links
    toast.success("Thank you for your interest in supporting us! Feature coming soon.");
  };

  const handleContactDeveloper = () => {
    // Contact developer at the specified email
    window.open('mailto:emzywoo89@gmail.com', '_blank');
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-memeGreen mb-4">About MemChat</h1>
        <p className="text-lg text-muted-foreground">
          Connecting people through humor and authentic conversations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* About the App */}
        <Card className="border-memeGreen/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-memeGreen">
              <Users className="h-5 w-5" />
              What is MemChat?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              MemChat is a revolutionary social platform that brings people together through 
              shared humor and genuine connections. Our unique matching system helps you find 
              friends who share your sense of humor and interests.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-memeGreen">Key Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Smart friend matching based on humor compatibility</li>
                <li>• Real-time messaging with emoji reactions</li>
                <li>• Meme sharing and social posting</li>
                <li>• Secure, private conversations</li>
                <li>• Cross-platform compatibility</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Support the Developer */}
        <Card className="border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Heart className="h-5 w-5" />
              Support the Developer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              MemChat is built with love by an independent developer who believes 
              in creating meaningful connections. Your support helps keep this platform 
              free and constantly improving.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-500">Why Support Us?</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Keep the app completely free for all users</span>
                </div>
                <div className="flex items-start gap-2">
                  <Code className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Fund new features and improvements</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Maintain high security and privacy standards</span>
                </div>
                <div className="flex items-start gap-2">
                  <Coffee className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Support independent development</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <Button 
                onClick={() => window.location.href = '/opay-support'}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Heart className="h-4 w-4 mr-2" />
                Support MemChat
              </Button>
              <Button 
                variant="outline"
                onClick={handleContactDeveloper}
                className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Developer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Free Forever */}
        <Card className="border-green-500/20 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500 text-center justify-center">
              <Shield className="h-5 w-5" />
              Free Forever Promise
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              MemChat will always remain free for core features. We believe that meaningful 
              connections shouldn't be locked behind paywalls. While we may introduce 
              premium features in the future, the heart of MemChat - finding friends and 
              having conversations - will always be free.
            </p>
            
            <div className="bg-memeGreen/10 border border-memeGreen/30 rounded-lg p-4">
              <h4 className="font-semibold text-memeGreen mb-2">Our Commitment</h4>
              <p className="text-sm text-muted-foreground">
                "We're building MemChat to create genuine human connections in a digital world. 
                Your support helps us maintain this vision while keeping the platform accessible 
                to everyone, everywhere."
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                - Made with ❤️ by Gods Love Network
              </p>
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info("MemChat is proudly built by Gods Love Network")}
                className="border-gray-500/30"
              >
                <Github className="h-4 w-4 mr-2" />
                About Developer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info("Version 1.0.0 - More features coming soon!")}
                className="border-gray-500/30"
              >
                Version 1.0.0
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;