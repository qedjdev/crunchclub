import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Followers from './followers';
import Following from './following';
import CarList from './carlist';
import { useAuth } from '../Auth';
import Posts from './Posts';
import ProfilePicture from './ProfilePicture';

interface UserData {
  _id: string;
  userId: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  followers: string[];
  following: string[];
  followerCount: number;
  followingCount: number;
  profilePicture?: string;
}

interface ProfileProps {
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

interface FollowedUser {
  _id: string;
}

const Profile: React.FC<ProfileProps> = ({ sidebarVisible, onToggleSidebar }) => {
  const { uid } = useParams();
  const { isLoggedIn, userId } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [isFollowersOnly, setIsFollowersOnly] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const profileId = uid || userId;
  const isCurrentUser = !uid || uid === userId;

  const loadProfile = async () => {
    if (!isLoggedIn && !uid) {
      setError('Please log in to view your profile');
      setLoading(false);
      return;
    }

    if (!profileId) {
      setError('No user ID available. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${profileId}`, {
        withCredentials: true
      });
      console.log('Profile Data:', response.data);
      setUserData(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [uid, userId, isLoggedIn, profileId]);

  useEffect(() => {
    if (userData && userId) {
      const followers = userData.followers.map((follower: any) =>
        typeof follower === 'string' ? follower : follower._id
      );
      setIsFollowing(followers.includes(userId));
    }
  }, [userData, userId]);

  // posting shout
  const handleShout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !profileId) return;

    try {
      await axios.post(`${process.env.REACT_APP_REMOTE_SERVER}/api/posts`, {
        userId: profileId,
        content: newPost,
        isFollowersOnly
      });
      setNewPost('');
      setIsFollowersOnly(false);
      // trigger posts refresh
      if (postsRef.current?.loadPosts) {
        postsRef.current.loadPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId || !profileId) return;

    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      await axios.post(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${profileId}/${endpoint}`,
        { followerId: userId },
        { withCredentials: true }
      );

      // immediately reload the profile data to update followers list
      await loadProfile();
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setIsEditingUsername(false);
      return;
    }

    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        console.error('No user ID found');
        return;
      }

      console.log('Updating username:', {
        userId: currentUserId,
        newUsername: newUsername.trim(),
        url: `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${currentUserId}/username`
      });

      const response = await axios.put(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${currentUserId}/username`,
        { username: newUsername.trim() },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Update response:', response.data);
      await loadProfile();
    } catch (error: any) {
      console.error('Error updating username:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(error.response?.data?.error || 'Failed to update username');
    } finally {
      setIsEditingUsername(false);
      setNewUsername('');
    }
  };

  const renderFollowButton = () => {
    if (isCurrentUser || !isLoggedIn) return null;

    const profileOwnerFollowsMe = userId ? userData?.following?.some(
      (followedUser: string | FollowedUser) =>
        (typeof followedUser === 'string' ? followedUser : followedUser._id) === userId
    ) : false;

    console.log('Debug Follow Button:', {
      userId,
      userDataFollowing: userData?.following,
      isFollowing,
      profileOwnerFollowsMe
    });

    let buttonText = 'Follow';
    if (isFollowing) {
      buttonText = 'Unfollow';
    } else if (profileOwnerFollowsMe) {
      buttonText = 'Follow Back';
    }

    return (
      <button
        onClick={handleFollowToggle}
        style={{
          backgroundColor: isFollowing ? '#dc3545' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '8px 24px',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          marginTop: '10px',
          fontWeight: '500'
        }}
      >
        {buttonText}
      </button>
    );
  };

  const renderFollowerStats = () => {
    if (!userData) return null;

    return (
      <div style={styles.statsContainer}>
        <div style={styles.stat}>
          <strong>{userData.followerCount}</strong> followers
        </div>
        <div style={styles.stat}>
          <strong>{userData.followingCount}</strong> following
        </div>
      </div>
    );
  };

  const postsRef = useRef<any>(null);

  const mobileSidebarStyle = {
    ...styles.mobileSidebar,
    transform: sidebarVisible ? 'translateX(0)' : 'translateX(100%)',
  };

  if (loading) {
    return (
      <div style={styles.message}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>{error}</p>
        {!isLoggedIn && (
          <p>
            <a href="/login" style={styles.link}>Click here to log in</a>
          </p>
        )}
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={styles.error}>
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.mainContent}>
          {isCurrentUser && (
            <form onSubmit={handleShout} style={styles.form}>
              <div style={styles.shoutBox}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's on your mind?"
                  style={styles.shoutInput}
                />
                <div style={styles.shoutControls}>
                  <label style={styles.followersOnlyLabel}>
                    <input
                      type="checkbox"
                      checked={isFollowersOnly}
                      onChange={(e) => setIsFollowersOnly(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxText}>Followers Only</span>
                  </label>
                  <button
                    type="submit"
                    style={{
                      ...styles.shoutButton,
                      backgroundColor: newPost.trim() ? '#007bff' : '#ccc',
                      cursor: newPost.trim() ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!newPost.trim()}
                  >
                    shout
                  </button>
                </div>
              </div>
            </form>
          )}

          {profileId && (
            <Posts
              ref={postsRef}
              userId={profileId}
              isCurrentUser={isCurrentUser}
            />
          )}
        </div>

        <div style={styles.sidebar} className="d-none d-md-block">
          <div style={styles.profileInfo}>
            <ProfilePicture
              userId={userData?._id}
              imageUrl={userData?.profilePicture}
              isCurrentUser={isCurrentUser}
              onUpdate={(newImageUrl) => {
                setUserData(prev => prev ? { ...prev, profilePicture: newImageUrl } : null);
              }}
            />
            <h2 style={styles.name}>{userData?.name}</h2>
            <div style={styles.usernameSection}>
              {isCurrentUser ? (
                isEditingUsername ? (
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUsernameUpdate(e);
                      } else if (e.key === 'Escape') {
                        setIsEditingUsername(false);
                        setNewUsername('');
                      }
                    }}
                    onBlur={() => {
                      setIsEditingUsername(false);
                      setNewUsername('');
                    }}
                    placeholder={userData?.username}
                    style={styles.usernameInput}
                    autoFocus
                  />
                ) : (
                  <div style={styles.usernameWrapper}>
                    <p style={styles.username}>@{userData?.username}</p>
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>
                  </div>
                )
              ) : (
                <p style={styles.username}>@{userData?.username}</p>
              )}
            </div>
            {renderFollowerStats()}
            {renderFollowButton()}
            {isCurrentUser && <p style={styles.email}>{userData?.email}</p>}
            {userData?.bio && <p style={styles.bio}>{userData?.bio}</p>}
          </div>

          <CarList
            collectionName="dream-cars"
            userId={userData?._id}
            title="Dream Cars"
            isCurrentUser={isCurrentUser}
          />
          <CarList
            collectionName="owned-cars"
            userId={userData?._id}
            title="Owned Cars"
            isCurrentUser={isCurrentUser}
          />
          <div style={styles.socialSection}>
            <Followers userId={userData?._id} />
            <Following userId={userData?._id} />
          </div>
        </div>

        {sidebarVisible && (
          <div
            style={mobileSidebarStyle}
            className="d-md-none"
          >
            <div style={styles.profileInfo}>

              <ProfilePicture
                userId={userData?._id}
                imageUrl={userData?.profilePicture}
                isCurrentUser={isCurrentUser}
                onUpdate={(newImageUrl) => {
                  setUserData(prev => prev ? { ...prev, profilePicture: newImageUrl } : null);
                }}
              />
              <h2 style={styles.name}>{userData?.name}</h2>
              <p style={styles.username}>@{userData?.username}</p>
              {renderFollowerStats()}
              {renderFollowButton()}
            </div>

            <div style={styles.sidebarContent}>
              <CarList
                collectionName="dream-cars"
                userId={userData?._id}
                title="Dream Cars"
                isCurrentUser={isCurrentUser}
              />
              <CarList
                collectionName="owned-cars"
                userId={userData?._id}
                title="Owned Cars"
                isCurrentUser={isCurrentUser}
              />
              <div style={styles.socialSection}>
                <Followers userId={userData?._id} />
                <Following userId={userData?._id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  contentWrapper: {
    display: 'flex',
    gap: '20px',
    position: 'relative',
  },
  mainContent: {
    flex: '1',
    maxWidth: '800px',
    minWidth: 0, // allows content to shrink below its minimum content size
  },
  sidebar: {
    width: '300px',
    minWidth: '300px',
    height: 'fit-content',
    position: 'sticky' as const,
    top: '80px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    alignSelf: 'flex-start',
  },
  profileInfo: {
    textAlign: 'center' as const,
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mobileProfileHeader: {
    marginBottom: '20px',
    width: '100%',
  },
  username: {
    color: '#666',
    fontSize: '1.2rem',
    margin: '10px 0',
  },
  email: {
    color: '#888',
    fontSize: '1rem',
  },
  bio: {
    marginTop: '15px',
    fontSize: '1.1rem',
  },
  shoutBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    transition: 'box-shadow 0.3s ease',
    width: '100%',
  },
  shoutInput: {
    width: '100%',
    minHeight: '120px',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #e1e1e1',
    fontSize: '1.1rem',
    resize: 'vertical',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease',
    outline: 'none',
  },
  shoutControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
  },
  followersOnlyLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '0.95rem',
    color: '#666',
  },
  shoutButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '1.1rem',
    transition: 'all 0.2s ease',
  },
  socialSection: {
    marginTop: '30px',
  },
  loginPrompt: {
    textAlign: 'center',
    marginTop: '20px',
  },
  message: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '1.2rem',
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    margin: '20px',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    marginTop: '10px',
    display: 'inline-block',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    margin: '15px 0',
  },
  stat: {
    textAlign: 'center' as const,
    fontSize: '1.1rem',
  },
  form: {
    width: '100%',
    margin: '20px 0',
  },
  input: {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  followersOnly: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  usernameSection: {
    marginBottom: '15px',
  },
  usernameWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center',
  },
  usernameForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  usernameInput: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  mobileSidebar: {
    position: 'fixed' as const,
    top: '76px',
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    overflowY: 'auto' as const,
    transition: 'transform 0.3s ease-in-out',
    padding: '20px',
    paddingTop: '40px',
  },
  closeSidebarButton: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px 10px',
    zIndex: 1001,
  },
  sidebarContent: {
    paddingTop: '20px',
  },
};

export default Profile;