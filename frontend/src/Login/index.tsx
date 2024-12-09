import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from "../Account/reducer";
import { useDispatch } from "react-redux";
import { useAuth } from '../Auth';
import * as client from './client';
import axios from 'axios';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login } = useAuth();

  const signin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await client.signin(credentials);
      if (!user) return;

      dispatch(setCurrentUser(user));
      login(user.id, user);
      navigate("/profile");
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Login</h2>
      {error && (
        <div style={{
          color: '#dc3545',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      <input defaultValue={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        className="form-control mb-2" placeholder="email" />
      <input defaultValue={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        className="form-control mb-2" placeholder="password" type="password" />
      <button onClick={signin} className="btn btn-primary w-100" > Sign in </button>
      <p style={styles.registerRedirect}>
        Don't have an account? <a href="/register" style={styles.link}>Register here</a>
      </p>
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
    color: 'red',
    fontSize: '0.9rem',
    marginTop: '10px',
  },
  registerRedirect: {
    marginTop: '20px',
    fontSize: '1rem',
  },
  link: {
    color: '#007BFF',
    textDecoration: 'none',
  },
};

export default Login;