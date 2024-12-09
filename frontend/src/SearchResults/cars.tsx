import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateCarIdentifier } from '../utils/carIdentifier';

interface Car {
  make: string;
  model: string;
  year: number;
  transmission?: string;
  fuel_type?: string;
  drive?: string;
  city_mpg?: number;
  highway_mpg?: number;
  combination_mpg?: number;
  cylinders?: number;
  displacement?: number;
  class?: string;
}

interface OwnedCar extends Car {
  _id: string;
  image: string | null;
  user: {
    _id: string;
    name: string;
    username: string;
  };
}

const CarSearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [ownedCars, setOwnedCars] = useState<OwnedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const year = searchParams.get('year');
    const query = make || model;

    const fetchCars = async () => {
      setLoading(true);
      setError(null);

      try {
        if (query) {
          const ownedResponse = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/search-cars?q=${query}`);
          setOwnedCars(ownedResponse.data);
        }

        const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/cars`, {
          params: {
            year,
            make,
            model,
            limit: 10
          }
        });
        setCars(response.data);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search cars. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [location.search]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4" style={{ maxWidth: '1000px' }}>
      <h2>Search Results</h2>
      {ownedCars.length > 0 && (
        <div className="mb-4">
          <div className="row">
            {ownedCars.map(car => (
              <div key={car._id} className="col-12 mb-3">
                <div
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/cars/details?id=${car._id}`)}
                >
                  <div className="card-body d-flex align-items-center">
                    <div style={{ width: '200px', marginRight: '20px' }}>
                      {car.image ? (
                        <img
                          src={`${process.env.REACT_APP_REMOTE_SERVER}${car.image}`}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center bg-light"
                          style={{
                            height: '120px',
                            borderRadius: '8px'
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="card-title mb-2">{car.year} {car.make} {car.model}</h5>
                      <p className="card-text text-muted mb-0">
                        Owned by {car.user.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row">
        {cars.map((car, index) => (
          <div key={index} className="col-12 mb-3">
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/cars/details?id=${generateCarIdentifier(car)}`, {
                state: { car }
              })}
            >
              <div className="card-body">
                <h5 className="card-title">{car.year} {car.make} {car.model}</h5>
                <div className="row">
                  {car.transmission && (
                    <div className="col-md-4">
                      <strong>Transmission:</strong> {car.transmission}
                    </div>
                  )}
                  {car.fuel_type && (
                    <div className="col-md-4">
                      <strong>Fuel Type:</strong> {car.fuel_type}
                    </div>
                  )}
                  {car.drive && (
                    <div className="col-md-4">
                      <strong>Drive:</strong> {car.drive}
                    </div>
                  )}
                  {car.city_mpg && (
                    <div className="col-md-4">
                      <strong>City MPG:</strong> {car.city_mpg}
                    </div>
                  )}
                  {car.highway_mpg && (
                    <div className="col-md-4">
                      <strong>Highway MPG:</strong> {car.highway_mpg}
                    </div>
                  )}
                  {car.cylinders && (
                    <div className="col-md-4">
                      <strong>Cylinders:</strong> {car.cylinders}
                    </div>
                  )}
                  {car.class && (
                    <div className="col-md-4">
                      <strong>Class:</strong> {car.class}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarSearchResults; 