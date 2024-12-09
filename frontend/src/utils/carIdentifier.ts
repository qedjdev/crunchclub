export const generateCarIdentifier = (car: any): string => {
  const keyProps = {
    year: car.year,
    make: car.make,
    model: car.model,
    transmission: car.transmission || '',
    drive: car.drive || '',
    fuel_type: car.fuel_type || '',
    cylinders: car.cylinders || '',
    class: car.class || '',
    city_mpg: car.city_mpg || '',
    highway_mpg: car.highway_mpg || '',
    combination_mpg: car.combination_mpg || ''
  };

  const idString = JSON.stringify(keyProps);

  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    const char = idString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
};

export const parseCarIdentifier = (identifier: string): any => {
  console.warn('Car details should be fetched from API using this identifier');
  return null;
}; 