
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { PostCard } from "@/components/posts/post-card";
import { Camera, Crown, Edit, LogOut, MessageSquare, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/auth/avatar-upload";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/hooks/use-chat";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";

// Storage key for avatar in localStorage
const AVATAR_STORAGE_KEY = 'memechat_user_avatar';
const BIO_STORAGE_KEY = 'memechat_user_bio';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { posts } = useData();
  const { getFriends, startNewChat } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const navigate = useNavigate();

  // Load saved avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
    
    const savedBio = localStorage.getItem(BIO_STORAGE_KEY);
    if (savedBio) {
      setBio(savedBio);
    }
    
    // Load friends
    const loadFriends = async () => {
      setIsLoadingFriends(true);
      try {
        const friendsList = await getFriends();
        setFriends(friendsList);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setIsLoadingFriends(false);
      }
    };
    
    loadFriends();
  }, [getFriends]);

  // Add updating avatar (save to profile)
  const handleUploadedAvatar = async (url: string) => {
    setAvatar(url);
    
    // Save to localStorage to persist across refreshes
    localStorage.setItem(AVATAR_STORAGE_KEY, url);
    
    // Here, also call Supabase to update their profile!
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user?.id);
    
    if (error) {
      toast.error("Avatar update failed.");
    } else {
      toast.success("Avatar updated successfully!");
    }
  };

  const handleUpdateProfile = async () => {
    // Save bio to localStorage
    localStorage.setItem(BIO_STORAGE_KEY, bio);
    
    // Save to Supabase
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ bio })
        .eq("id", user.id);
      
      if (error) {
        toast.error("Profile update failed.");
      } else {
        toast.success("Profile updated successfully!");
      }
    }
    
    setIsEditing(false);
  };
  
  const handleUpgradeAccount = () => {
    toast("Premium upgrade would be implemented here!");
  };
  
  const handleMessageFriend = async (friendId: string) => {
    const chatId = await startNewChat(friendId);
    if (chatId) {
      navigate('/chat');
    }
  };
  
  if (!user) return null;

  const userPosts = posts.filter(post => post.userId === user?.id);
  
  return (
    <div className="container py-6">
      <Card className="mb-6 border-yellow-400 shadow-gold">
        <CardHeader className="relative pb-0">
          <div className="absolute right-4 top-4 flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-5 w-5 text-yellow-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5 text-yellow-500" />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            {isEditing ? (
              <AvatarUpload onUpload={handleUploadedAvatar} currentAvatar={avatar || user.avatar} />
            ) : (
              <div className="relative group">
                <Avatar className="h-24 w-24 mb-4 border-2 border-yellow-400 shadow-gold">
                  <AvatarImage src={avatar || user.avatar} alt={user.username} />
                  <AvatarFallback className="text-2xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            )}
            <CardTitle className="text-2xl text-yellow-500">
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
              {bio || "No bio yet. Click edit to add one!"}
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
          <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
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
        
        <TabsContent value="friends" className="mt-6">
          {isLoadingFriends ? (
            <div className="flex justify-center py-10">
              <div className="animate-pulse text-lg">Loading friends...</div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-xl mb-2">No friends yet</h2>
              <p className="text-muted-foreground mb-4">Go to the Merge page to connect with people!</p>
              <Button 
                onClick={() => navigate('/merge')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Find Friends
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.map(friend => (
                <Card key={friend.id} className="border-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-yellow-400">
                        <AvatarImage src={friend.avatar} alt={friend.username} />
                        <AvatarFallback className="text-lg">{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{friend.displayName || friend.username}</h3>
                        <p className="text-sm text-muted-foreground">@{friend.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-yellow-400 text-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => handleMessageFriend(friend.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 border-yellow-400 text-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => navigate(`/profile/${friend.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
