import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Auth';
import { checkAdminStatus } from '../services/auth';
import { FaHome, FaLink, FaCog, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import axios from 'axios';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

interface UserProfile {
  profilePicture?: string;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { isLoggedIn, logout, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname.includes('/profile');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 800);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.id) {
        const adminStatus = await checkAdminStatus(user.id);
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [user?.id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${user.id}`);
          setUserProfile(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    fetchUserProfile();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    window.location.reload();
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <nav style={styles.nav}>
        <div style={styles.leftSection}>
          <Link to="/" style={styles.link}>
            <FaHome size={20} />
            {!isMobile && <span>Home</span>}
          </Link>
          <Link to="/link" style={styles.link}>
            <FaLink size={20} />
            {!isMobile && <span>Link</span>}
          </Link>
          <Link to="/search" style={styles.link}>
            <FaSearch size={20} />
            {!isMobile && <span>Search</span>}
          </Link>
          {isAdmin && (
            <Link to="/panel" style={styles.link}>
              <FaCog size={20} />
              {!isMobile && <span>Admin Panel</span>}
            </Link>
          )}
        </div>

        <div style={styles.rightSection}>
          {isLoggedIn ? (
            <>
              <Link to="/profile" style={styles.link}>
                {!isMobile && <span>Profile</span>}
                {userProfile?.profilePicture ? (
                  <img
                    src={`${process.env.REACT_APP_REMOTE_SERVER}${userProfile.profilePicture}`}
                    alt="Profile"
                    style={styles.profilePic}
                  />
                ) : (
                  <div style={styles.profilePicPlaceholder}>
                    👤
                  </div>
                )}
              </Link>
              <button onClick={handleLogout} style={styles.button}>
                {!isMobile && <span>Logout</span>}
                <FaSignOutAlt size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/register" style={styles.link}>Register</Link>
              <Link to="/login" style={styles.link}>Login</Link>
            </>
          )}
          {isProfilePage && (
            <button
              onClick={onToggleSidebar}
              style={styles.hamburgerButton}
              className="d-md-none"
            >
              ☰
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

const styles = {
  profilePic: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  profilePicPlaceholder: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  header: {
    backgroundColor: '#333',
    padding: '1rem',
    position: 'sticky' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    padding: '0 1rem',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  button: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  leftSection: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  hamburgerButton: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '2rem',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '1rem',
    height: '100%',
  },
};

export default Header;