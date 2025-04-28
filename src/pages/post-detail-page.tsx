
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/context/data-context';
import { PostCard } from '@/components/posts/post-card';
import { CommentSection } from '@/components/posts/comment-section';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { posts, isLoading } = useData();
  const navigate = useNavigate();
  
  const post = posts.find(p => p.id === postId);
  
  if (isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <div className="animate-pulse-subtle text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container py-6">
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
    <div className="container py-6 max-w-3xl">
      <Button 
        variant="ghost"
        className="mb-4 flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>
      
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
