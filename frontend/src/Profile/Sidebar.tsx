import React from 'react';
import CarList from './carlist';
import Followers from './followers';
import Following from './following';

interface SidebarProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  isCurrentUser: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ userId, isOpen, onClose, isCurrentUser }) => {
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{
      ...styles.sidebar,
      ...(isMobile ? {
        ...styles.sidebarNarrow,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
      } : styles.sidebarWide)
    }}>
      {isMobile && (
        <button onClick={onClose} style={styles.closeButton}>×</button>
      )}
      <div style={styles.scrollContainer}>
        <div style={styles.content}>
          <CarList collectionName="ownedCars" userId={userId} title="Owned Cars" isCurrentUser={isCurrentUser} />
          <CarList collectionName="dreamCars" userId={userId} title="Dream Cars" isCurrentUser={isCurrentUser} />
          <Followers userId={userId} />
          <Following userId={userId} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease',
    zIndex: 1000,
  },
  sidebarWide: {
    width: '300px',
    transform: 'translateX(0)',
  },
  sidebarNarrow: {
    width: '80%',
    maxWidth: '300px',
  },
  scrollContainer: {
    height: '100%',
    overflowY: 'auto' as const,
    overscrollBehavior: 'contain' as const,
  },
  content: {
    padding: '20px',
    paddingTop: '60px',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    zIndex: 1001,
  }
};

export default Sidebar; 