
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { PostCard } from "@/components/posts/post-card";
import { Camera, Crown, Edit, LogOut } from "lucide-react";
import { toast } from "sonner";

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { posts } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  
  const userPosts = posts.filter(post => post.userId === user?.id);
  
  const handleUpgradeAccount = () => {
    toast("Premium upgrade would be implemented here!");
  };
  
  const handleUpdateProfile = () => {
    // In a real app, save the bio to the user's profile
    toast.success("Profile updated!");
    setIsEditing(false);
  };
  
  const handleChangeAvatar = () => {
    // In a real app, implement avatar upload
    toast("Avatar change would be implemented here!");
  };
  
  if (!user) {
    return null;
  }

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader className="relative pb-0">
          <div className="absolute right-4 top-4 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="text-2xl">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-4 right-0 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleChangeAvatar}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <CardTitle className="text-2xl">
              {user.displayName || user.username}
              {user.isPro && (
                <Crown className="h-5 w-5 text-yellow-500 inline ml-2" />
              )}
            </CardTitle>
            <CardDescription className="text-lg">@{user.username}</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                className="w-full p-2 rounded-md bg-secondary text-foreground resize-none min-h-[100px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBio(user.bio || "");
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-memeGreen hover:bg-memeGreen/90"
                  onClick={handleUpdateProfile}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center">
              {user.bio || "No bio yet. Click edit to add one!"}
            </p>
          )}
          
          {!user.isPro && (
            <div className="mt-6 p-4 rounded-lg bg-memeGreen/10 border border-memeGreen/30">
              <h3 className="font-medium flex items-center mb-2">
                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                Upgrade to Pro
              </h3>
              <p className="text-sm mb-3">Get access to exclusive features, premium memes, and more!</p>
              <Button 
                className="w-full bg-memeGreen hover:bg-memeGreen/90"
                onClick={handleUpgradeAccount}
              >
                Become a Pro Memer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="posts">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">My Posts</TabsTrigger>
          <TabsTrigger value="liked" className="flex-1">Liked</TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-6">
          {userPosts.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-xl mb-2">No posts yet</h2>
              <p className="text-muted-foreground">You haven't created any posts yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked" className="mt-6">
          <div className="text-center py-10">
            <h2 className="text-xl mb-2">No liked posts</h2>
            <p className="text-muted-foreground">You haven't liked any posts yet.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <div className="text-center py-10">
            <h2 className="text-xl mb-2">No saved posts</h2>
            <p className="text-muted-foreground">You haven't saved any posts yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
