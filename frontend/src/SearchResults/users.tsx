import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Auth';
import ShoutEmbed from '../components/ShoutEmbed';

interface User {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface TopShout {
  content: string;
  likes: string[];
  createdAt: string;
}

interface OwnedCar {
  _id: string;
  make: string;
  model: string;
  year: number;
  image: string | null;
}

const UserSearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [topShouts, setTopShouts] = useState<{ [key: string]: TopShout }>({});
  const [ownedCars, setOwnedCars] = useState<{ [key: string]: OwnedCar[] }>({});
  const { isLoggedIn } = useAuth();
  const [isHovered, setIsHovered] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('name');

    const fetchUsers = async () => {
      try {
        const url = query
          ? `${process.env.REACT_APP_REMOTE_SERVER}/api/users/search?name=${query}`
          : `${process.env.REACT_APP_REMOTE_SERVER}/api/users/search`;
        const response = await axios.get(url);
        setUsers(response.data);

        // Fetch top shouts and owned cars for each user
        const [shoutsResults, carsResults] = await Promise.all([
          Promise.all(response.data.map((user: User) =>
            axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${user._id}/top-shout`)
              .then(response => ({ userId: user._id, shout: response.data }))
          )),
          Promise.all(response.data.map((user: User) =>
            axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${user._id}/owned-cars`)
              .then(response => ({ userId: user._id, cars: response.data }))
          ))
        ]);

        const shoutsMap = shoutsResults.reduce((acc, { userId, shout }) => {
          if (shout) {
            acc[userId] = shout;
          }
          return acc;
        }, {});

        const carsMap = carsResults.reduce((acc, { userId, cars }) => {
          if (cars && cars.length > 0) {
            acc[userId] = cars;
          }
          return acc;
        }, {});

        setTopShouts(shoutsMap);
        setOwnedCars(carsMap);
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    };

    if (query !== null) {
      fetchUsers();
    }
  }, [location.search]);

  return (
    <div className="container mt-4" style={{ maxWidth: '1000px' }}>
      <h2>Search Results</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="row">
          {users.map(user => (
            <div key={user._id} className="col-12 mb-4">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    {user.profilePicture ? (
                      <img
                        src={`${process.env.REACT_APP_REMOTE_SERVER}${user.profilePicture}`}
                        alt={user.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginRight: '15px'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '15px',
                          fontSize: '24px'
                        }}
                      >
                        👤
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => navigate(`/profile/${user._id}`)}
                        onMouseEnter={() => setIsHovered(user._id)}
                        onMouseLeave={() => setIsHovered(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          font: 'inherit',
                          color: isHovered === user._id ? '#0056b3' : 'inherit',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          transition: 'color 0.2s'
                        }}
                      >
                        <h5 className="card-title mb-0">{user.name}</h5>
                      </button>
                      <small className="text-muted">@{user.username}</small>
                    </div>
                  </div>
                  {topShouts[user._id] && (
                    <div className="d-flex flex-column flex-md-row gap-3">
                      <div style={{ flex: 1 }}>
                        <ShoutEmbed
                          shout={{
                            _id: user._id,
                            content: topShouts[user._id].content,
                            likes: topShouts[user._id].likes,
                            createdAt: topShouts[user._id].createdAt,
                            isFollowersOnly: false,
                            userId: {
                              _id: user._id,
                              name: user.name,
                              username: user.username,
                              profilePicture: user.profilePicture
                            }
                          }}
                          onLike={() => { }}
                        />
                      </div>
                      {ownedCars[user._id] && ownedCars[user._id].length > 0 && (
                        <div className="d-none d-md-block" style={{
                          height: '145px',
                          width: 'auto'
                        }}>
                          {ownedCars[user._id][0].image ? (
                            <a href={`/cars/details?id=${ownedCars[user._id][0]._id}`}>
                              <img
                                src={`${process.env.REACT_APP_REMOTE_SERVER}${ownedCars[user._id][0].image}`}
                                alt={`${ownedCars[user._id][0].year} ${ownedCars[user._id][0].make} ${ownedCars[user._id][0].model}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  borderRadius: '8px'
                                }}
                              />
                            </a>
                          ) : (
                            <div style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '8px',
                              padding: '20px',
                              textAlign: 'center'
                            }}>
                              {ownedCars[user._id][0].year} {ownedCars[user._id][0].make} {ownedCars[user._id][0].model}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchResults; 