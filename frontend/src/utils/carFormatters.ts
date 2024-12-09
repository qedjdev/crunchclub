export const formatTransmission = (transmission: string): string => {
  const map: { [key: string]: string } = {
    'm': 'Manual',
    'a': 'Automatic'
  };
  return map[transmission.toLowerCase()] || transmission;
};

export const formatFuelType = (fuelType: string): string => {
  const map: { [key: string]: string } = {
    'gas': 'Petrol',
    'diesel': 'Diesel',
    'electric': 'Electric',
    'hybrid': 'Hybrid'
  };
  return map[fuelType.toLowerCase()] || fuelType;
};

export const formatDrive = (drive: string): string => {
  const map: { [key: string]: string } = {
    'rwd': 'Rear Wheel Drive',
    'fwd': 'Front Wheel Drive',
    'awd': 'All Wheel Drive',
    '4wd': 'Four Wheel Drive',
    'rear_wheel_drive': 'Rear Wheel Drive',
    'front_wheel_drive': 'Front Wheel Drive',
    'all_wheel_drive': 'All Wheel Drive',
    'four_wheel_drive': 'Four Wheel Drive'
  };
  return map[drive.toLowerCase()] || drive;
}; 