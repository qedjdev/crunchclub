import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatTransmission, formatFuelType, formatDrive } from '../utils/carFormatters';
import { useAuth } from '../Auth';
import { checkAdminStatus } from '../services/auth';

interface Car {
  _id: string;
  make: string;
  model: string;
  year: number;
  transmission?: string;
  fuel_type?: string;
  drive?: string;
  description: string;
  image: string | null;
  city_mpg?: number;
  highway_mpg?: number;
  combination_mpg?: number;
  cylinders?: number;
  class?: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  owners: {
    _id: string;
    name: string;
    username: string;
    joinedAt: string;
  }[];
  isOwner: boolean;
}

const CarDetail: React.FC = () => {
  const { userId, carId } = useParams<{ userId: string; carId: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ _id: string, name: string, username: string }>>([]);
  const [showAddOwner, setShowAddOwner] = useState(false);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/owned-cars/${carId}`);
        setCar(response.data);
        setDescription(response.data.description);
      } catch (error) {
        console.error('Error fetching car details:', error);
      }
    };

    if (userId && carId) {
      fetchCar();
    }
  }, [userId, carId]);

  useEffect(() => {
    const checkAdmin = async () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        const adminStatus = await checkAdminStatus(currentUserId);
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    const formData = new FormData();
    formData.append('image', event.target.files[0]);

    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/owned-cars/${carId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setCar(response.data);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleDescriptionSave = async () => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/owned-cars/${carId}`,
        { description }
      );
      setCar(response.data);
      setEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleDelete = async () => {
    if (!car) return;
    if (!window.confirm('Are you sure you want to delete this car?')) {
      return;
    }

    try {
      if (car.owners.length > 1) {
        await handleRemoveOwnership();
      } else {
        await axios.delete(
          `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/owned-cars/${carId}`
        );
        navigate(`/profile/${userId}`);
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Failed to delete car');
    }
  };

  const handleSearchUser = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/search?name=${query}`
      );
      setSearchResults(response.data.filter((user: any) =>
        !car?.owners.some(owner => owner._id === user._id)
      ));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddOwner = async (newOwnerId: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/owned-cars/${carId}/owners`,
        { newOwnerId }
      );
      setCar(response.data);
      setShowAddOwner(false);
      setSearchUsername('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  };

  const handleRemoveOwnership = async () => {
    if (!window.confirm('Are you sure you want to remove your ownership of this car?')) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/owned-cars/${carId}/owners/${userId}`
      );
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error('Error removing ownership:', error);
      alert('Failed to remove ownership');
    }
  };

  if (!car) {
    return <div>Loading...</div>;
  }

  const currentUserId = localStorage.getItem('userId');
  const isOwner = isLoggedIn && car.isOwner;
  const canDelete = isOwner || isAdmin;

  return (
    <div className="container mt-4">
      <h2 style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '20px'
      }}>
        {car.user.profilePicture ? (
          <img
            src={`${process.env.REACT_APP_REMOTE_SERVER}${car.user.profilePicture}`}
            alt={car.user.name}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            👤
          </div>
        )}
        <button
          onClick={() => navigate(`/profile/${car.user._id}`)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: 'none',
            border: 'none',
            color: isHovered ? '#0056b3' : 'inherit',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
        >
          {car.user.name}'s
        </button> {car.year} {car.make} {car.model}
      </h2>

      <div className="mb-4">
        {car.image ? (
          <img
            src={`${process.env.REACT_APP_REMOTE_SERVER}${car.image}`}
            alt={`${car.year} ${car.make} ${car.model}`}
            style={{
              maxWidth: '100%',
              maxHeight: '500px',
              width: 'auto',
              height: 'auto',
              borderRadius: '8px',
              display: 'block',
              margin: '0 auto'
            }}
          />
        ) : isOwner && (
          <div style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
              Click to upload an image
            </label>
          </div>
        )}
        {isOwner && car.image && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-update"
            />
            <label
              htmlFor="image-update"
              style={{
                cursor: 'pointer',
                color: '#0066cc',
                textDecoration: 'underline'
              }}
            >
              Update image
            </label>
          </div>
        )}
      </div>

      <div className="card p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="mb-4">
          <strong>Description: </strong>
          {editingDescription ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-control mb-2"
                rows={3}
              />
              <div className="d-flex gap-2">
                <button
                  onClick={handleDescriptionSave}
                  className="btn btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDescription(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p>{car?.description || "No description provided"}</p>
              {isOwner && (
                <button
                  onClick={() => {
                    setDescription(car?.description || '');
                    setEditingDescription(true);
                  }}
                  className="btn btn-outline-primary"
                >
                  Edit Description
                </button>
              )}
            </div>
          )}
        </div>

        <h3>Specifications:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {car.transmission && (
            <p><strong>Transmission:</strong> {formatTransmission(car.transmission)}</p>
          )}
          {car.fuel_type && (
            <p><strong>Fuel Type:</strong> {formatFuelType(car.fuel_type)}</p>
          )}
          {car.drive && (
            <p><strong>Drive:</strong> {formatDrive(car.drive)}</p>
          )}
          {car.cylinders && (
            <p><strong>Cylinders:</strong> {car.cylinders}</p>
          )}
          {car.class && (
            <p><strong>Class:</strong> {car.class}</p>
          )}
        </div>

        {(car.city_mpg || car.highway_mpg || car.combination_mpg) && (
          <>
            <h3>Fuel Economy:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {car.city_mpg && (
                <p><strong>City MPG:</strong> {car.city_mpg}</p>
              )}
              {car.highway_mpg && (
                <p><strong>Highway MPG:</strong> {car.highway_mpg}</p>
              )}
              {car.combination_mpg && (
                <p><strong>Combined MPG:</strong> {car.combination_mpg}</p>
              )}
            </div>
          </>
        )}

        {isOwner && (
          <div className="mt-4">
            <button
              onClick={() => setShowAddOwner(!showAddOwner)}
              className="btn btn-primary mb-3"
            >
              Add Co-owner
            </button>

            {showAddOwner && (
              <div className="mb-3">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => {
                    setSearchUsername(e.target.value);
                    handleSearchUser(e.target.value);
                  }}
                  placeholder="Search users..."
                  className="form-control mb-2"
                />
                {searchResults.length > 0 && (
                  <div className="list-group">
                    {searchResults.map(user => (
                      <button
                        key={user._id}
                        onClick={() => handleAddOwner(user._id)}
                        className="list-group-item list-group-item-action"
                      >
                        {user.name} (@{user.username})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {car.owners.length > 1 && (
          <div className="mt-4">
            <h4>Co-owners:</h4>
            <ul className="list-group">
              {car.owners
                .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
                .map(owner => (
                  <li key={owner._id} className="list-group-item d-flex justify-content-between align-items-center">
                    {owner.name} (@{owner.username})
                    {owner._id === userId && (
                      <button
                        onClick={handleRemoveOwnership}
                        className="btn btn-sm btn-danger"
                      >
                        Remove Ownership
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {canDelete && (
          <div className="mt-4 text-center">
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete Car
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarDetail; 