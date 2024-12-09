import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Auth';
import { checkAdminStatus } from '../services/auth';
import { fetchUsers } from '../services/admin';
import { format } from 'date-fns';
import { FaUser } from 'react-icons/fa';

interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;
  bio: string;
  profilePicture: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

interface UserResponse {
  users: User[];
  total: number;
  hasMore: boolean;
}

const AdminPanel: React.FC = () => {
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const currentPage = parseInt(searchParams.get('page') || '0');
  const pageSize = 10;
  const totalPages = Math.ceil(totalUsers / pageSize);

  useEffect(() => {
    const verifyAndLoad = async () => {
      if (!isInitialized) return;

      if (!user?.id) {
        navigate('/');
        return;
      }

      try {
        const isUserAdmin = await checkAdminStatus(user.id);
        if (!isUserAdmin) {
          console.log('Access denied: User is not an admin');
          navigate('/');
          return;
        }

        const data = await fetchUsers(user.id, currentPage);
        setUsers(data.users);
        setHasMore(data.hasMore);
        setTotalUsers(data.total);
        setIsLoading(false);
      } catch (error) {
        console.error('Admin verification failed:', error);
        navigate('/');
      }
    };

    verifyAndLoad();
  }, [user?.id, navigate, currentPage, isInitialized]);

  const handleNextPage = () => {
    setSearchParams({ page: (currentPage + 1).toString() });
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setSearchParams({ page: (currentPage - 1).toString() });
    }
  };

  if (!isInitialized || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Picture</th>
              <th className="px-4 py-2">User Info</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2">Posts</th>
              <th className="px-4 py-2">Followers</th>
              <th className="px-4 py-2">Following</th>
              <th className="px-4 py-2">Bio</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <a
                    href={`/profile/${user._id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/profile/${user._id}`);
                    }}
                    className="block w-[30px] h-[30px] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {user.profilePicture ? (
                      <img
                        src={`${process.env.REACT_APP_REMOTE_SERVER}${user.profilePicture}`}
                        alt={user.username}
                        style={{
                          width: '45px',
                          height: '45px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div className="w-[30px] h-[30px] rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser size={45} color="#666" />
                      </div>
                    )}
                  </a>
                </td>
                <td className="px-4 py-2">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-2">{user.postCount}</td>
                <td className="px-4 py-2">{user.followerCount}</td>
                <td className="px-4 py-2">{user.followingCount}</td>
                <td className="px-4 py-2">
                  <div className="max-w-xs truncate">{user.bio || '-'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 px-4">
        <div style={styles.buttonContainer}>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            style={{
              ...styles.paginationButton,
              backgroundColor: currentPage === 0 ? '#ccc' : '#007bff',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            style={{
              ...styles.paginationButton,
              backgroundColor: !hasMore ? '#ccc' : '#007bff',
              cursor: !hasMore ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
        <div style={styles.pageInfo}>
          Page {currentPage + 1} of {totalPages} -- {totalUsers} total users
        </div>
      </div>
    </div>
  );
};

const styles = {
  paginationButton: {
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '8px 24px',
    fontSize: '1rem',
    transition: 'background-color 0.2s',
    fontWeight: '500',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  pageInfo: {
    textAlign: 'left' as const,
    color: '#666',
  },
};

export default AdminPanel; 