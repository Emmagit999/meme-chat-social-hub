import React from 'react';
import { RefreshCw, Phone, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Support</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Support Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                Get help via email. We typically respond within 24 hours.
              </p>
              <Button 
                onClick={() => window.open('mailto:emzywoo89@gmail.com?subject=MemChat Support Request')}
                className="w-full"
              >
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                Chat with our support team in real-time.
              </p>
              <Button 
                variant="outline"
                onClick={() => navigate('/chat')}
                className="w-full"
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-500" />
                Contact Developer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                Contact the developer directly for technical issues.
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => window.open('mailto:emzywoo89@gmail.com')}
                  className="w-full"
                >
                  Email: emzywoo89@gmail.com
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/about')}
                  className="w-full"
                >
                  About & More Info
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How do I reset my password?</h4>
                <p className="text-muted-foreground text-sm">
                  Go to the login page and click "Forgot Password" to receive a reset link.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Why can't I see my messages?</h4>
                <p className="text-muted-foreground text-sm">
                  Try refreshing the page or check your internet connection. Real-time sync should update automatically.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">How do I report a bug?</h4>
                <p className="text-muted-foreground text-sm">
                  Email us at emzywoo89@gmail.com with details about the issue and steps to reproduce it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;