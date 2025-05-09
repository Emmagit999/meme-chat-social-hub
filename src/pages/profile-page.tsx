import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { PostCard } from "@/components/posts/post-card";
import { Crown, Edit, LogOut, MessageCircle, UserPlus, UserCheck, UserClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/auth/avatar-upload";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/hooks/use-chat";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@/types";
import { usePalRequests } from "@/hooks/use-pal-requests";

const AVATAR_STORAGE_KEY = 'memechat_user_avatar';
const BIO_STORAGE_KEY = 'memechat_user_bio';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { posts, likedPosts, deletePost } = useData();
  const { getFriends, startNewChat } = useChat();
  const { requestCount, getPalStatus, sendPalRequest } = usePalRequests();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>("");
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const navigate = useNavigate();
  const { userId: profileId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [palStatus, setPalStatus] = useState<'none' | 'pending' | 'requested' | 'accepted'>('none');
  const [isLoadingPalStatus, setIsLoadingPalStatus] = useState(true);
  
  const isOwnProfile = !profileId || (user && profileId === user.id);

  useEffect(() => {
    const fetchProfileUser = async () => {
      setIsLoading(true);
      try {
        if (!profileId) {
          // If no profileId, we're viewing the current user's profile
          if (user) {
            const userWithCreatedAt: User = {
              id: user.id,
              username: user.username || '',
              displayName: user.username || '',
              avatar: user.avatar || "",
              bio: user.bio || "",
              isPro: user.isPro || false,
              createdAt: new Date() // Add createdAt to fix TypeScript error
            };
            setProfileUser(userWithCreatedAt);
            setBio(user.bio || "");
            setAvatar(user.avatar);
          }
        } else {
          // Otherwise, fetch the profile data for the requested user
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", profileId)
            .single();
            
          if (error) throw error;
          
          if (data) {
            const profileData: User = {
              id: data.id,
              username: data.username || "",
              displayName: data.username || "",
              avatar: data.avatar_url || "",
              bio: data.bio || "",
              isPro: data.is_pro || false,
              createdAt: new Date(data.updated_at || Date.now()) // Use updated_at as createdAt
            };
            setProfileUser(profileData);
            setBio(profileData.bio || "");
            setAvatar(profileData.avatar);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile information", {
          duration: 10000 // Auto-disappear after 10 seconds
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileUser();
  }, [profileId, user]);

  useEffect(() => {
    if (isOwnProfile) {
      const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
      
      const savedBio = localStorage.getItem(BIO_STORAGE_KEY);
      if (savedBio) {
        setBio(savedBio);
      }
    }
    
    const loadProfileFriends = async () => {
      setIsLoadingFriends(true);
      try {
        const targetUserId = profileId || user?.id;
        if (!targetUserId) return;
        
        // Try to get pals from friends table in Supabase
        console.log(`Fetching friends data for profile: ${targetUserId}`);
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', targetUserId);
          
        if (friendsError) {
          console.error("Error fetching friends for profile:", friendsError);
          throw friendsError;
        }
        
        console.log("Profile friends data received:", friendsData);
        
        // If we have pals in the database
        if (friendsData && friendsData.length > 0) {
          const palIds = friendsData.map(f => f.friend_id);
          
          // Get the profile data for each pal
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', palIds);
            
          if (profilesError) {
            console.error("Error fetching profiles for friends:", profilesError);
            throw profilesError;
          }
          
          if (profilesData) {
            const formattedFriends = profilesData.map(profile => ({
              id: profile.id,
              username: profile.username || 'pal',
              displayName: profile.username || 'Pal',
              avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
              bio: profile.bio || '',
              isPro: profile.is_pro || false,
              createdAt: new Date(profile.updated_at || new Date())
            }));
            
            console.log("Formatted profile friends:", formattedFriends);
            setFriends(formattedFriends);
            return;
          }
        } else {
          console.log("No profile friends found in database, trying getFriends method");
        }
        
        // Fallback to getFriends method for own profile
        if (isOwnProfile) {
          const friendsList = await getFriends();
          setFriends(friendsList);
        } else {
          setFriends([]);
        }
      } catch (error) {
        console.error('Error loading profile friends:', error);
        setFriends([]);
      } finally {
        setIsLoadingFriends(false);
      }
    };
    
    if (profileUser) {
      loadProfileFriends();
    }
  }, [getFriends, isOwnProfile, profileId, profileUser, user?.id]);

  // Check pal status when viewing another user's profile
  useEffect(() => {
    const checkPalStatus = async () => {
      if (!isOwnProfile && user && profileUser) {
        setIsLoadingPalStatus(true);
        try {
          const status = await getPalStatus(profileUser.id);
          setPalStatus(status);
        } catch (error) {
          console.error("Error checking pal status:", error);
        } finally {
          setIsLoadingPalStatus(false);
        }
      }
    };
    
    checkPalStatus();
  }, [isOwnProfile, user, profileUser, getPalStatus]);

  const handleUploadedAvatar = async (url: string) => {
    setAvatar(url);
    
    localStorage.setItem(AVATAR_STORAGE_KEY, url);
    
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user?.id);
    
    if (error) {
      toast.error("Avatar update failed.", {
        duration: 10000
      });
    } else {
      toast.success("Avatar updated successfully!", {
        duration: 10000
      });
    }
  };

  const handleUpdateProfile = async () => {
    localStorage.setItem(BIO_STORAGE_KEY, bio);
    
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          avatar_url: avatar,
          username: user.username,
          bio: bio
        })
        .eq("id", user.id);
      
      if (error) {
        toast.error("Profile update failed.", {
          duration: 10000
        });
        console.error("Profile update error:", error);
      } else {
        toast.success("Profile updated successfully!", {
          duration: 10000
        });
      }
    }
    
    setIsEditing(false);
  };
  
  const handleUpgradeAccount = () => {
    toast("Premium upgrade would be implemented here!", {
      duration: 10000
    });
  };
  
  const handleMessageFriend = async (friendId: string) => {
    const chatId = await startNewChat(friendId);
    if (chatId) {
      navigate('/chat');
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success("Post deleted successfully!", {
        duration: 10000
      });
    } catch (error) {
      toast.error("Failed to delete post.", {
        duration: 10000
      });
    }
  };

  const handleSendPalRequest = async () => {
    if (!profileUser) return;
    
    setIsLoadingPalStatus(true);
    const success = await sendPalRequest(profileUser.id);
    if (success) {
      setPalStatus('requested');
    }
    setIsLoadingPalStatus(false);
  };
  
  if (isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <div className="animate-pulse text-lg">Loading profile...</div>
      </div>
    );
  }
  
  if (!user || !profileUser) return null;

  // Get user posts for the profile we're viewing
  const userPosts = posts.filter(post => post.userId === profileUser.id);
  
  // Get posts that the current user has liked (only shown on own profile)
  const userLikedPosts = posts.filter(post => likedPosts.includes(post.id));
  
  return (
    <div className="container py-6">
      <Card className="mb-6 border-yellow-400 shadow-gold">
        <CardHeader className="relative pb-0">
          {isOwnProfile && (
            <div className="absolute right-4 top-4 flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-5 w-5 text-yellow-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5 text-yellow-500" />
              </Button>
            </div>
          )}
          <div className="flex flex-col items-center">
            {isEditing && isOwnProfile ? (
              <AvatarUpload onUpload={handleUploadedAvatar} currentAvatar={avatar || user.avatar} />
            ) : (
              <div className="relative group">
                <Avatar className="h-24 w-24 mb-4 border-2 border-yellow-400 shadow-gold">
                  <AvatarImage src={avatar || profileUser.avatar} alt={profileUser.username} />
                  <AvatarFallback className="text-2xl">{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            )}
            <CardTitle className="text-2xl text-yellow-500">
              {profileUser.displayName || profileUser.username}
              {profileUser.isPro && (
                <Crown className="h-5 w-5 text-yellow-500 inline ml-2" />
              )}
            </CardTitle>
            <CardDescription className="text-lg">@{profileUser.username}</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isEditing && isOwnProfile ? (
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
                    setBio(profileUser.bio || "");
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
              {bio || "No bio yet."}
              {isOwnProfile && !bio && " Click edit to add one!"}
            </p>
          )}
          
          {/* Chat and Add Pal buttons for non-own profiles */}
          {!isOwnProfile && (
            <div className="mt-6 flex justify-center gap-3">
              <Button 
                onClick={() => handleMessageFriend(profileUser.id)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>

              {isLoadingPalStatus ? (
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
                  <UserClock className="h-4 w-4 mr-2" />
                  Request Sent
                </Button>
              ) : palStatus === 'pending' ? (
                <Button 
                  onClick={() => navigate('/pals')}
                  variant="outline" 
                  className="border-yellow-300 text-yellow-500"
                >
                  <UserClock className="h-4 w-4 mr-2" />
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
          )}
          
          {isOwnProfile && !profileUser.isPro && (
            <div className="mt-6 p-4 rounded-lg bg-memeGreen/10 border border-memeGreen/30">
              <h3 className="font-medium flex items-center mb-2">
                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                Become a Pro Memer
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
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="pals" className="flex-1">
            Pals
            {isOwnProfile && requestCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                {requestCount}
              </span>
            )}
          </TabsTrigger>
          {isOwnProfile && (
            <>
              <TabsTrigger value="liked" className="flex-1">Liked</TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="posts" className="mt-6">
          {userPosts.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-xl mb-2">No posts yet</h2>
              <p className="text-muted-foreground">
                {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't created any posts yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {userPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  showDeleteButton={isOwnProfile}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pals" className="mt-6">
          {isOwnProfile && requestCount > 0 && (
            <div className="mb-6 p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/10">
              <h3 className="font-medium text-yellow-500 mb-2">Pal Requests</h3>
              <p className="text-sm text-gray-300 mb-3">
                You have {requestCount} pending pal {requestCount === 1 ? 'request' : 'requests'}
              </p>
              <Button 
                onClick={() => navigate('/pals')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black w-full"
              >
                View Requests
              </Button>
            </div>
          )}
          
          {isLoadingFriends ? (
            <div className="flex justify-center py-10">
              <div className="animate-pulse text-lg">Loading pals...</div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-xl mb-2">No pals yet</h2>
              <p className="text-muted-foreground mb-4">Go to the Merge page to connect with people!</p>
              <Button 
                onClick={() => navigate('/merge')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Find Pals
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
                        <MessageCircle className="h-4 w-4 mr-2" />
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
        
        {isOwnProfile && (
          <>
            <TabsContent value="liked" className="mt-6">
              {userLikedPosts.length === 0 ? (
                <div className="text-center py-10">
                  <h2 className="text-xl mb-2">No liked posts</h2>
                  <p className="text-muted-foreground">You haven't liked any posts yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userLikedPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="saved" className="mt-6">
              <div className="text-center py-10">
                <h2 className="text-xl mb-2">No saved posts</h2>
                <p className="text-muted-foreground">You haven't saved any posts yet.</p>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ProfilePage;
