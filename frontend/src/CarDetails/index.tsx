import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatTransmission, formatFuelType, formatDrive } from '../utils/carFormatters';
import { parseCarIdentifier } from '../utils/carIdentifier';
import axios from 'axios';

interface Car {
  _id?: string;
  make: string;
  model: string;
  year: number;
  transmission?: string;
  fuel_type?: string;
  drive?: string;
  description?: string;
  image?: string | null;
  city_mpg?: number;
  highway_mpg?: number;
  combination_mpg?: number;
  cylinders?: number;
  class?: string;
  user?: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  owners?: Array<{
    _id: string;
    name: string;
    username: string;
    joinedAt: string;
  }>;
  isOwner?: boolean;
  [key: string]: any;
}

interface CarListState {
  isDream: boolean;
  isOwned: boolean;
}

const CarDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('id');

  const [car, setCar] = useState<Car | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [carListState, setCarListState] = useState<CarListState>({
    isDream: false,
    isOwned: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; name: string; username: string }>>([]);

  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(car?.description || '');

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        if (id && id.length === 24) {
          const response = await axios.get(
            `${process.env.REACT_APP_REMOTE_SERVER}/api/cars/${id}`
          );
          console.log('Received car data:', response.data);
          const currentUserId = localStorage.getItem('userId');
          // Check if current user is an owner
          const isOwner = response.data.owners?.some(
            (owner: any) => owner._id === currentUserId
          );
          setCar({ ...response.data, isOwner });
        } else if (location.state?.car) {
          setCar(location.state.car);
        } else {
          setError('Car not found');
        }
      } catch (error) {
        console.error('Full error:', error);
        if (location.state?.car) {
          setCar(location.state.car);
        } else {
          setError('Failed to fetch car details');
        }
      }
    };

    if (id) {
      fetchCarDetails();
    }
  }, [id, location.state]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (storedUserId && isLoggedIn && car) {
      checkCarStatus(storedUserId);
    }
  }, [car]);

  const checkCarStatus = async (currentUserId: string) => {
    if (!car) return;

    try {
      const dreamResponse = await fetch(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${currentUserId}/dream-cars`);
      if (dreamResponse.ok) {
        const dreamCars = await dreamResponse.json();
        const isDream = dreamCars.some((dreamCar: Car) =>
          ['make', 'model', 'year'].every(key =>
            dreamCar[key] === car[key]
          )
        );
        setCarListState(prev => ({ ...prev, isDream }));
      }

      const ownedResponse = await fetch(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${currentUserId}/owned-cars`);
      if (ownedResponse.ok) {
        const ownedCars = await ownedResponse.json();
        const isOwned = ownedCars.some((ownedCar: Car) =>
          ['make', 'model', 'year'].every(key =>
            ownedCar[key] === car[key]
          )
        );
        setCarListState(prev => ({ ...prev, isOwned }));
      }
    } catch (error) {
      console.error('Error checking car status:', error);
    }
  };

  const handleCarListUpdate = async (listType: 'dream-cars' | 'owned-cars') => {
    const storedUserId = localStorage.getItem('userId');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!storedUserId || !isLoggedIn || !car) {
      navigate('/login');
      return;
    }

    const carData = {
      make: car.make,
      model: car.model,
      year: car.year,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      drive: car.drive,
      cylinders: car.cylinders,
      class: car.class,
      city_mpg: car.city_mpg,
      highway_mpg: car.highway_mpg,
      combination_mpg: car.combination_mpg
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${storedUserId}/${listType}`,
        { car: carData },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        const { isFavorite } = response.data;
        setCarListState(prev => ({
          ...prev,
          [listType === 'dream-cars' ? 'isDream' : 'isOwned']: isFavorite
        }));
      }
    } catch (error) {
      console.error('Error updating car list:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Image upload triggered');
    if (!event.target.files?.[0] || !car) {
      console.log('No file or car:', { files: event.target.files, car });
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    console.log('Current user ID:', currentUserId);
    console.log('Car data:', car);

    const formData = new FormData();
    formData.append('image', event.target.files[0]);
    formData.append('description', car.description || '');

    const url = `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${currentUserId}/owned-cars/${car._id}`;
    console.log('Making request to:', url);
    console.log('FormData contents:', {
      image: event.target.files[0],
      description: car.description
    });

    try {
      const response = await axios.patch(
        url,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      console.log('Response:', response);
      setCar(response.data);
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  };

  const handleUserSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/search?name=${query}`
      );
      // filter out current owners
      const filteredResults = response.data.filter(
        (user: any) => !car?.owners?.some(owner => owner._id === user._id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddOwner = async (newOwnerId: string) => {
    try {
      if (!car || !car._id) return;

      const response = await axios.post(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/cars/${car._id}/owners`,
        { newOwnerId }
      );

      window.location.reload();
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  };

  const handleRemoveOwner = async (ownerId: string) => {
    console.log('Removing owner:', { ownerId, car });
    if (!window.confirm('Are you sure you want to remove this owner?')) {
      return;
    }

    try {
      if (!car || !car._id || !ownerId) {
        console.error('Missing required data:', { carId: car?._id, ownerId });
        return;
      }

      await axios.delete(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/cars/${car._id}/owners/${ownerId}`
      );

      window.location.reload();
    } catch (error) {
      console.error('Error removing owner:', error);
    }
  };

  const handleDescriptionSave = async () => {
    if (!car || !car._id) return;

    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/cars/${car._id}`,
        { description }
      );
      setCar(response.data);
      setEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  if (!car) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>No car details available</p>
          <button onClick={() => navigate('/search')} style={styles.backButton}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const formatValue = (key: string, value: any): string => {
    switch (key) {
      case 'transmission':
        return formatTransmission(value);
      case 'drive':
        return formatDrive(value);
      case 'fuel_type':
        return formatFuelType(value);
      case 'displacement':
        return value ? `${value.toFixed(1)}L` : 'N/A';
      case 'highway_mpg':
      case 'city_mpg':
      case 'combination_mpg':
        return `${value} MPG`;
      default:
        return value?.toString() || 'N/A';
    }
  };

  const formatKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const detailOrder = [
    'year', 'make', 'model', 'class',
    'transmission', 'drive',
    'engine', 'displacement', 'cylinders', 'fuel_type',
    'city_mpg', 'highway_mpg', 'combination_mpg'
  ];

  return (
    <div className="container mt-4" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
      {car.user ? (
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center',
          width: '100%',
          marginBottom: '20px'
        }}>
          {car.user ? (
            <>
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
              <span>{car.user.name}'s</span>
            </>
          ) : null}
          {car.year} {car.make} {car.model}
        </h2>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={styles.headerContainer}>
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              ← Back to Results
            </button>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => handleCarListUpdate('dream-cars')}
                style={carListState.isDream ? { ...styles.listButton, ...styles.listButtonActive } : styles.listButton}
              >
                {carListState.isDream ? '★ Dream Car' : '☆ Add to Dream Cars'}
              </button>
              <button
                onClick={() => handleCarListUpdate('owned-cars')}
                style={carListState.isOwned ? { ...styles.listButton, ...styles.listButtonActive } : styles.listButton}
              >
                {carListState.isOwned ? '✓ In My Cars' : '+ Add to My Cars'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {car.user ? (
          <>
            <div className="mb-4">
              {car.image ? (
                <div className="mb-4 position-relative">
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
                  {car.isOwner && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}>
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
                          color: '#fff',
                          margin: 0
                        }}
                      >
                        Change Image
                      </label>
                    </div>
                  )}
                </div>
              ) : car.isOwner && (
                <div style={{
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" style={{ cursor: 'pointer', color: '#666' }}>
                    Click to upload an image
                  </label>
                </div>
              )}
            </div>

            {car.user && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3>Description</h3>
                  {car.isOwner && (
                    <button
                      onClick={() => setEditingDescription(!editingDescription)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      {editingDescription ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
                {editingDescription ? (
                  <div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-control mb-2"
                      rows={4}
                      placeholder="Enter car description..."
                    />
                    <button
                      onClick={handleDescriptionSave}
                      className="btn btn-primary"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    {car.description || 'No description provided'}
                  </p>
                )}
              </div>
            )}

            <div className="card p-4">
              <h3 style={{ marginBottom: '20px' }}>Specifications</h3>
              <div className="row">
                {car.transmission && (
                  <div className="col-md-4 mb-2">
                    <strong>Transmission:</strong> {formatTransmission(car.transmission)}
                  </div>
                )}
                {car.fuel_type && (
                  <div className="col-md-4 mb-2">
                    <strong>Fuel Type:</strong> {formatFuelType(car.fuel_type)}
                  </div>
                )}
                {car.drive && (
                  <div className="col-md-4 mb-2">
                    <strong>Drive:</strong> {formatDrive(car.drive)}
                  </div>
                )}
                {car.cylinders && (
                  <div className="col-md-4 mb-2">
                    <strong>Cylinders:</strong> {car.cylinders}
                  </div>
                )}
                {car.class && (
                  <div className="col-md-4 mb-2">
                    <strong>Class:</strong> {car.class}
                  </div>
                )}
              </div>

              {(car.city_mpg || car.highway_mpg || car.combination_mpg) && (
                <div className="mt-4">
                  <h4>Fuel Economy</h4>
                  <div className="row">
                    {car.city_mpg && (
                      <div className="col-md-4 mb-2">
                        <strong>City MPG:</strong> {car.city_mpg}
                      </div>
                    )}
                    {car.highway_mpg && (
                      <div className="col-md-4 mb-2">
                        <strong>Highway MPG:</strong> {car.highway_mpg}
                      </div>
                    )}
                    {car.combination_mpg && (
                      <div className="col-md-4 mb-2">
                        <strong>Combined MPG:</strong> {car.combination_mpg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {car.user && (
              <div className="mt-4">
                <h3>Owners</h3>
                <div className="mb-4">
                  <ul className="list-group">
                    {car.owners?.map(owner => (
                      <li key={owner._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div
                          onClick={() => navigate(`/profile/${owner._id}`)}
                          className="owner-link"
                          style={styles.ownerLink}
                        >
                          {owner.name} (@{owner.username})
                        </div>
                        {car.isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOwner(owner._id);
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {car.isOwner && (
                  <div className="mt-3">
                    <h4>Add Co-owner</h4>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleUserSearch(e.target.value);
                        }}
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="list-group mt-2">
                        {searchResults.map(user => (
                          <button
                            key={user._id}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleAddOwner(user._id)}
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
          </>
        ) : (
          <div style={styles.detailsContainer}>
            {detailOrder.map(key => (
              car[key] && (
                <div key={key} style={styles.detailRow}>
                  <span style={styles.detailLabel}>{formatKey(key)}:</span>
                  <span style={styles.detailValue}>{formatValue(key, car[key])}</span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  header: {
    fontSize: '2rem',
    marginBottom: '30px',
    color: '#333',
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  detailRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
  },
  detailLabel: {
    flex: '0 0 200px',
    fontWeight: 'bold',
    color: '#333',
  },
  detailValue: {
    flex: '1',
    color: '#666',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  listButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#007BFF',
    border: '2px solid #007BFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
  },
  listButtonActive: {
    backgroundColor: '#007BFF',
    color: '#fff',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  ownerLink: {
    cursor: 'pointer',
    color: '#007bff',
    textDecoration: 'none'
  },
};

export default CarDetails; 