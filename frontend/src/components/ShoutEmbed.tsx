import React from 'react';
import { FaHeart } from 'react-icons/fa';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';

interface ShoutEmbedProps {
  shout: {
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
  };
  onLike: (shoutId: string) => void;
  isTopShout?: boolean;
  onDelete?: (shoutId: string) => void;
  onPrivacyToggle?: (shoutId: string, currentPrivacy: boolean) => void;
  isCurrentUser?: boolean;
  isAdmin?: boolean;
}

const ShoutEmbed: React.FC<ShoutEmbedProps> = ({
  shout,
  onLike,
  isTopShout = false,
  onDelete,
  onPrivacyToggle,
  isCurrentUser,
  isAdmin
}) => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const likes = shout.likes || [];

  const containerStyle = isTopShout ? {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '2px solid #ffd700'
  } : {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  };

  return (
    <div style={containerStyle}>
      <div style={styles.header}>
        {shout.userId.profilePicture ? (
          <img
            src={`${process.env.REACT_APP_REMOTE_SERVER}${shout.userId.profilePicture}`}
            alt="Profile"
            style={isTopShout ? styles.topProfilePic : styles.profilePic}
          />
        ) : (
          <div style={isTopShout ? styles.topProfilePicPlaceholder : styles.profilePicPlaceholder}>
            👤
          </div>
        )}
        <button
          onClick={() => navigate(`/profile/${shout.userId._id}`)}
          style={styles.nameButton}
        >
          {shout.userId.name} (@{shout.userId.username})
        </button>
        {shout.isFollowersOnly && (
          <span style={styles.badge}>
            {isAdmin ? 'Admin View - Followers Only' : 'Followers Only'}
          </span>
        )}
      </div>
      <p style={isTopShout ? styles.topContent : styles.content}>{shout.content}</p>
      <div style={styles.footer}>
        <div style={styles.footerLeft}>
          <button onClick={() => onLike(shout._id)} style={styles.likeButton}>
            <FaHeart color={userId && likes.includes(userId) ? '#ff0000' : '#888'} size={20} />
            <span style={styles.likeCount}>{likes.length}</span>
          </button>
          <span style={styles.date}>
            {format(new Date(shout.createdAt), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
        {(isCurrentUser || isAdmin) && (
          <div style={styles.controls}>
            {isCurrentUser && onPrivacyToggle && (
              <button
                onClick={() => onPrivacyToggle(shout._id, shout.isFollowersOnly)}
                style={styles.controlButton}
              >
                {shout.isFollowersOnly ? '🔒' : '🌎'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(shout._id)}
                style={styles.controlButton}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  profilePic: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  topProfilePic: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  profilePicPlaceholder: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProfilePicPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    padding: '0',
  },
  content: {
    margin: '10px 0',
    fontSize: '1.1rem',
  },
  topContent: {
    margin: '15px 0',
    fontSize: '1.2rem',
    lineHeight: '1.4',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  controlButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '1rem',
  },
  likeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  likeCount: {
    color: '#666',
    fontSize: '0.9rem',
  },
  date: {
    color: '#6c757d',
    fontSize: '0.9rem',
  },
  badge: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
};

export default ShoutEmbed; 