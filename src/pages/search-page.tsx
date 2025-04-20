
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useChat } from "@/hooks/use-chat";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, MessageCircle } from "lucide-react";
import { User } from "@/types";

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { getSuggestedUsers, startNewChat } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const suggestedUsers = getSuggestedUsers();
  
  const filteredUsers = searchQuery.trim() ? 
    suggestedUsers.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : 
    suggestedUsers;
  
  if (!user) return null;
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">Search Users</h1>
      
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-yellow-200 focus:border-yellow-400"
        />
        <Button className="bg-memeGreen hover:bg-memeGreen/90">
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(suggestedUser => (
            <Card key={suggestedUser.id} className="border-yellow-200 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={suggestedUser.avatar} alt={suggestedUser.username} />
                    <AvatarFallback>{suggestedUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{suggestedUser.displayName || suggestedUser.username}</p>
                    <p className="text-sm text-muted-foreground">@{suggestedUser.username}</p>
                  </div>
                </div>
                
                {suggestedUser.bio && (
                  <p className="mt-2 text-sm">{suggestedUser.bio}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0 border-t border-yellow-100 mt-4">
                <Button 
                  variant="outline"
                  asChild
                  className="text-yellow-600 border-yellow-300"
                >
                  <Link to={`/profile/${suggestedUser.id}`}>View Profile</Link>
                </Button>
                <Button 
                  onClick={() => startNewChat(suggestedUser.id)}
                  className="bg-memeGreen hover:bg-memeGreen/90"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
