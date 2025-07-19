import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface AuthPromptProps {
  message?: string;
  description?: string;
}

export const AuthPrompt: React.FC<AuthPromptProps> = ({ 
  message = "Sign up to continue", 
  description = "Create an account to access more content and features"
}) => {
  const navigate = useNavigate();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">{message}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Sign Up for Free
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/auth')}
          className="w-full"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Already have an account? Sign In
        </Button>
      </CardContent>
    </Card>
  );
};