import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatTransmission, formatFuelType, formatDrive } from '../utils/carFormatters';
import { generateCarIdentifier } from '../utils/carIdentifier';

interface Car {
  make: string;
  model: string;
  year: number;
  transmission?: string;
  fuel_type?: string;
  drive?: string;
  _id?: string;
}

interface CarListProps {
  collectionName: string;
  userId: string;
  title: string;
  isCurrentUser: boolean;
}

const CarList: React.FC<CarListProps> = ({ collectionName, userId, title, isCurrentUser }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/${collectionName}`);
        setCars(response.data);
      } catch (error) {
        console.error('Error fetching cars:', error);
      }
    };

    if (userId) {
      fetchCars();
    }
  }, [userId, collectionName]);

  const handleCarClick = (car: Car) => {
    if (collectionName === 'dream-cars' || collectionName === 'dreamCars') {
      navigate(`/cars/details?id=${generateCarIdentifier(car)}`, { state: { car } });
    } else if (collectionName === 'owned-cars' && car._id) {
      navigate(`/cars/details?id=${car._id}`);
    }
  };

  return (
    <div className="car-list">
      <h3>{title}</h3>
      {cars.length === 0 ? (
        <p>No cars in this list yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {cars.map((car, index) => (
            <li
              key={index}
              onClick={() => handleCarClick(car)}
              style={{ cursor: 'pointer', marginBottom: '10px' }}
            >
              <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                {car.year} {car.make} {car.model}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CarList;