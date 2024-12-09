import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../Auth';
import ShoutEmbed from '../components/ShoutEmbed';
import { checkAdminStatus } from '../services/auth';

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

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();
  const [topShout, setTopShout] = useState<Post | null>(null);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recentUserShout, setRecentUserShout] = useState<Post | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchTopShout = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/top-shout`);
      setTopShout(response.data);
    } catch (error) {
      console.error('Error fetching top shout:', error);
    }
  };

  useEffect(() => {
    fetchTopShout();
    const interval = setInterval(fetchTopShout, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadFeed = async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      setLoading(true);
      const currentUserId = localStorage.getItem('userId');

      const feedResponse = await axios.get(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/feed`,
        {
          params: {
            viewerId: currentUserId,
            page: pageNum
          }
        }
      );

      if (isLoadMore) {
        setPosts(prev => [...prev, ...feedResponse.data]);
      } else {
        setPosts(feedResponse.data);
      }

      setHasMore(feedResponse.data.length === 3);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    loadFeed(0, false);

    return () => {
      setPosts([]);
      setPage(0);
      setHasMore(true);
    };
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage, true);
  };

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      if (topShout && topShout._id === postId) {
        setTopShout(prev => {
          if (!prev || !userId) return prev;
          const isLiked = prev.likes.includes(userId);
          return {
            ...prev,
            likes: isLiked
              ? prev.likes.filter(id => id !== userId)
              : [...prev.likes, userId]
          };
        });
      }

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id === postId && userId) {
            const isLiked = post.likes.includes(userId);
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter(id => id !== userId)
                : [...post.likes, userId]
            };
          }
          return post;
        })
      );

      setFollowingPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id === postId && userId) {
            const isLiked = post.likes.includes(userId);
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter(id => id !== userId)
                : [...post.likes, userId]
            };
          }
          return post;
        })
      );

      await axios.post(`${process.env.REACT_APP_REMOTE_SERVER}/api/posts/${postId}/like`, {
        userId
      });

    } catch (error) {
      console.error('Error liking post:', error);
      loadFeed(page, false);
      loadFollowingPosts();
    }
  };

  const loadFollowingPosts = async () => {
    if (!isLoggedIn || !userId) return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/feed/following`,
        { params: { userId } }
      );
      setFollowingPosts(response.data);
    } catch (error) {
      console.error('Error loading following posts:', error);
    }
  };

  useEffect(() => {
    loadFollowingPosts();
  }, [isLoggedIn, userId]);

  const handleDelete = async (postId: string) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/posts/${postId}`,
        { params: { userId } }
      );
      loadFeed(page, false);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handlePrivacyToggle = async (postId: string, currentPrivacy: boolean) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/posts/${postId}/privacy`,
        { isFollowersOnly: !currentPrivacy }
      );
      loadFeed(page, false);
    } catch (error) {
      console.error('Error updating post privacy:', error);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (userId) {
        const isUserAdmin = await checkAdminStatus(userId);
        setIsAdmin(isUserAdmin);
      }
    };
    checkAdmin();
  }, [userId]);

  useEffect(() => {
    const fetchUserRecentShout = async () => {
      if (isLoggedIn && userId) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/posts/recent`
          );
          if (response.data) {
            setRecentUserShout(response.data);
          }
        } catch (error) {
          console.error('Error fetching recent user shout:', error);
        }
      }
    };
    fetchUserRecentShout();
  }, [isLoggedIn, userId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      {topShout && (
        <div style={styles.topShoutContainer}>
          <h3 style={styles.topShoutHeader}>Top Shout Today 🔥</h3>
          <ShoutEmbed
            shout={topShout}
            onLike={handleLike}
            onDelete={handleDelete}
            onPrivacyToggle={handlePrivacyToggle}
            isCurrentUser={userId === topShout.userId._id}
            isAdmin={isAdmin}
            isTopShout={true}
          />
        </div>
      )}

      {isLoggedIn && recentUserShout && (
        <div style={styles.recentActivityContainer}>
          <h3 style={styles.recentActivityHeader}>Your Recent Activity</h3>
          <ShoutEmbed
            shout={recentUserShout}
            onLike={handleLike}
            onDelete={handleDelete}
            onPrivacyToggle={handlePrivacyToggle}
            isCurrentUser={true}
            isAdmin={isAdmin}
            isTopShout={false}
          />
        </div>
      )}

      {isLoggedIn && followingPosts.length > 0 && (
        <>
          <h2 style={styles.header}>Recent from Your Following</h2>
          <div style={styles.posts}>
            {followingPosts.map((post) => (
              <ShoutEmbed
                key={post._id}
                shout={post}
                onLike={handleLike}
                onDelete={handleDelete}
                onPrivacyToggle={handlePrivacyToggle}
                isCurrentUser={userId === post.userId._id}
                isAdmin={isAdmin}
                isTopShout={false}
              />
            ))}
          </div>
        </>
      )}

      <div style={styles.sectionDivider}>
        <h2 style={styles.header}>Recent Shouts</h2>
        <div style={styles.posts}>
          {posts.map((post) => (
            <ShoutEmbed
              key={post._id}
              shout={post}
              onLike={handleLike}
              onDelete={handleDelete}
              onPrivacyToggle={handlePrivacyToggle}
              isCurrentUser={userId === post.userId._id}
              isAdmin={isAdmin}
              isTopShout={false}
            />
          ))}
        </div>

        {posts.length > 0 && (
          <button
            onClick={handleLoadMore}
            style={{
              ...styles.loadMoreButton,
              backgroundColor: hasMore ? '#007bff' : '#ccc',
              cursor: hasMore ? 'pointer' : 'default',
            }}
            disabled={loading || !hasMore}
          >
            {loading ? 'Loading...' : hasMore ? 'Load More Shouts' : 'No More Shouts!'}
          </button>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={styles.scrollTopButton}
        >
          Back to Top ↑
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  posts: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  loadMoreButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '20px',
    width: '100%',
    maxWidth: '200px',
    alignSelf: 'center',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#0056b3',
    },
    ':disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed',
    },
  },
  topShoutContainer: {
    marginBottom: '30px',
  },
  topShoutHeader: {
    textAlign: 'center' as const,
    color: '#333',
    marginBottom: '15px',
  },
  sectionDivider: {
    marginTop: '50px',
  },
  recentActivityContainer: {
    marginBottom: '30px',
  },
  recentActivityHeader: {
    textAlign: 'center' as const,
    color: '#333',
    marginBottom: '15px',
  },
  scrollTopButton: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    padding: '10px 20px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '1rem',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#555',
    },
  },
};

export default Home;