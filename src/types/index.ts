export type User = {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPro?: boolean;
  createdAt: Date;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  createdAt: Date;
  type: 'meme' | 'roast' | 'joke' | 'posts';
};

export type CommentReply = {
  id: string;
  commentId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  createdAt: Date;
};

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  createdAt: Date;
  replies?: CommentReply[];
}

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
  edited?: boolean;
  editedAt?: string;
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageDate?: Date;
  unreadCount: number;
};

export type Status = {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  created_at: string;
  expires_at: string;
};
