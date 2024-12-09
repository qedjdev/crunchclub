import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';
import axios from 'axios';
import CryptoJS from 'crypto-js';

axios.defaults.baseURL = 'http://localhost:4000';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [recentUsers, setRecentUsers] = useState<Array<{
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
  }>>([]);

  const { login } = useAuth();

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/recent-with-photos`);
        setRecentUsers(response.data);
      } catch (error) {
        console.error('Error fetching recent users:', error);
      }
    };

    fetchRecentUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hashedPassword = CryptoJS.SHA256(password).toString();
      const response = await axios.post('/api/register', {
        email,
        password: hashedPassword,
        name
      });

      if (response.status === 201) {
        navigate('/login');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div>
      <div style={styles.container}>
        <h2 style={styles.header}>Register</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>Register</button>
        </form>
        <p style={styles.loginRedirect}>
          Already have an account? <a href="/login" style={styles.link}>Login here</a>
        </p>
      </div>

      {recentUsers.length > 0 && (
        <div style={styles.recentUsersContainer}>
          <p style={styles.recentUsersText}>Recent members:</p>
          <div style={styles.recentUsersList}>
            {recentUsers.map(user => (
              <div key={user._id} style={styles.recentUser}>
                <img
                  src={`${process.env.REACT_APP_REMOTE_SERVER}${user.profilePicture}`}
                  alt={user.name}
                  style={styles.recentUserImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    maxWidth: '400px',
    margin: '0 auto',
    backgroundColor: '#f4f4f4',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  header: {
    fontSize: '2rem',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '1rem',
    marginBottom: '5px',
    color: '#333',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginBottom: '10px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '12px',
    backgroundColor: '#007BFF',
    color: 'white',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  error: {
    color: 'red',
    fontSize: '0.9rem',
    marginTop: '10px',
  },
  loginRedirect: {
    marginTop: '20px',
    fontSize: '1rem',
  },
  link: {
    color: '#007BFF',
    textDecoration: 'none',
  },
  recentUsersContainer: {
    maxWidth: '400px',
    margin: '20px auto',
    textAlign: 'center' as const,
  },
  recentUsersText: {
    color: '#666',
    marginBottom: '15px',
  },
  recentUsersList: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  recentUser: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '5px',
  },
  recentUserImage: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '2px solid #007bff',
  },
};

export default Register;