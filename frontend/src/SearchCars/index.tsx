import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchCars: React.FC = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1886 || yearNum > new Date().getFullYear() + 1) {
        setError('Please enter a valid year');
        return;
      }
    }

    const searchMake = model ? make : (make || '+');

    navigate(`/search/cars?year=${year || '+'}&make=${searchMake}&model=${model || '+'}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Search Cars</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSearch} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="year" style={styles.label}>Year</label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Enter year (e.g., 2015)"
            min="1886"
            max={new Date().getFullYear() + 1}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="make" style={styles.label}>Make</label>
          <input
            type="text"
            id="make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Enter make (e.g., Subaru)"
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="model" style={styles.label}>Model</label>
          <input
            type="text"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Enter model (e.g., BRZ)"
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>Search</button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    maxWidth: '400px',
    margin: '0 auto',
    backgroundColor: '#f4f4f4',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  header: {
    fontSize: '2rem',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '1rem',
    marginBottom: '5px',
    color: '#333',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginBottom: '10px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '12px',
    backgroundColor: '#007BFF',
    color: 'white',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
  }
};

export default SearchCars;