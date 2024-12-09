import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { useAuth } from '../Auth';
import { checkAdminStatus } from '../services/auth';
import ShoutEmbed from '../components/ShoutEmbed';

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  isFollowersOnly: boolean;
  likes: string[];
  userId: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
}

interface PostsProps {
  userId: string;
  isCurrentUser: boolean;
}

const Posts = forwardRef<{ loadPosts: () => Promise<void> }, PostsProps>(({ userId, isCurrentUser }, ref) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { isLoggedIn, userId: currentUserId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUserId) {
        const isUserAdmin = await checkAdminStatus(currentUserId);
        setIsAdmin(isUserAdmin);
      }
    };
    checkAdmin();
  }, [currentUserId]);

  const loadPosts = async () => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const response = await axios.get(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/posts?viewerId=${currentUserId}`
      );
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [userId]);

  useImperativeHandle(ref, () => ({
    loadPosts
  }));

  const handleDelete = async (postId: string) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/posts/${postId}`,
        {
          params: { userId: currentUserId }
        }
      );
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handlePrivacyToggle = async (postId: string, currentPrivacy: boolean) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/posts/${postId}/privacy`,
        {
          isFollowersOnly: !currentPrivacy
        }
      );
      await loadPosts();
    } catch (error) {
      console.error('Error updating post privacy:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/posts/${postId}/like`,
        { userId: currentUserId }
      );

      await loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {posts.map((post) => (
        <ShoutEmbed
          key={post._id}
          shout={post}
          onLike={handleLike}
          onDelete={handleDelete}
          onPrivacyToggle={handlePrivacyToggle}
          isCurrentUser={isCurrentUser}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
});

export default Posts;