
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/context/data-context';
import { PostCard } from '@/components/posts/post-card';
import { CommentSection } from '@/components/posts/comment-section';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { posts, isLoading, refreshData } = useData();
  const navigate = useNavigate();
  
  const post = posts.find(p => p.id === postId);
  
  useEffect(() => {
    // Scroll to top when the component mounts
    window.scrollTo(0, 0);
  }, []);

  // Remove auto-refresh to prevent interruption during commenting
  // Rely on Supabase real-time updates instead

  const handleRefresh = () => {
    // Manual refresh only when user explicitly requests it
    refreshData();
  };

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <div className="animate-pulse text-lg">Loading post...</div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container py-16 mb-20 md:mb-0">
        <Button 
          variant="ghost"
          className="mb-4 flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div className="text-center py-10">
          <h2 className="text-xl mb-2">Post not found</h2>
          <p className="text-muted-foreground">The post you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-16 pb-24 md:pb-16 max-w-2xl mb-16 md:mb-0">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={handleRefresh}
          aria-label="Refresh post"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mb-6">
        <PostCard post={post} hideCommentLink />
      </div>
      
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
};

export default PostDetailPage;
