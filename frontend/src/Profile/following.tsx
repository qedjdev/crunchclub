// yeah yeah yeah this is very DRY violating code... I'm on a time crunch, okay?
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';

interface Following {
  _id: string;
  name: string;
  profilePicture?: string;
}

const Following = ({ userId }: { userId: string }) => {
  const [following, setFollowing] = useState<Following[]>([]);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}/following`);
        setFollowing(response.data);
      } catch (error) {
        console.error('Error fetching following:', error);
      }
    };
    fetchFollowing();
  }, [userId]);

  return (
    <div>
      <h3>Following</h3>
      {isLoggedIn ? (
        <ul style={styles.list}>
          {following.map((followed) => (
            <li key={followed._id} style={styles.listItem}>
              {followed.profilePicture ? (
                <img
                  src={`${process.env.REACT_APP_REMOTE_SERVER}${followed.profilePicture}`}
                  alt={`${followed.name}'s profile`}
                  style={styles.profilePic}
                />
              ) : (
                <div style={styles.profilePicPlaceholder}>
                  👤
                </div>
              )}
              <button
                onClick={() => navigate(`/profile/${followed._id}`)}
                style={styles.userButton}
              >
                {followed.name}
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

export default Following;