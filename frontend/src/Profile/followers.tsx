import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';

interface Follower {
  _id: string;
  name: string;
  profilePicture?: string;
}

const Followers = ({ userId }: { userId: string }) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}/followers`);
        setFollowers(response.data);
      } catch (error) {
        console.error('Error fetching followers:', error);
      }
    };
    fetchFollowers();
  }, [userId]);

  return (
    <div>
      <h3>Followers</h3>
      {isLoggedIn ? (
        <ul style={styles.list}>
          {followers.map((follower) => (
            <li key={follower._id} style={styles.listItem}>
              {follower.profilePicture ? (
                <img
                  src={`${process.env.REACT_APP_REMOTE_SERVER}${follower.profilePicture}`}
                  alt={`${follower.name}'s profile`}
                  style={styles.profilePic}
                />
              ) : (
                <div style={styles.profilePicPlaceholder}>
                  👤
                </div>
              )}
              <button
                onClick={() => navigate(`/profile/${follower._id}`)}
                style={styles.userButton}
              >
                {follower.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.signUpMessage}>
          <a href="/register" style={styles.signUpLink}>Sign up</a> to see who follows who
        </p>
      )}
    </div>
  );
};

const styles = {
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    margin: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    padding: '5px 10px',
    fontSize: '1rem',
    textDecoration: 'underline',
  },
  signUpMessage: {
    color: '#666',
    fontSize: '0.9rem',
    fontStyle: 'italic',
    margin: '10px 0'
  },
  signUpLink: {
    color: '#007bff',
    textDecoration: 'none'
  },
  profilePic: {
    width: '30px',
    height: '30px',
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
    fontSize: '16px',
  }
};

export default Followers;