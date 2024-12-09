import axios from "axios";
import CryptoJS from 'crypto-js';

const axiosWithCredentials = axios.create({ withCredentials: true });
export const REMOTE_SERVER = process.env.REACT_APP_REMOTE_SERVER;
export const USERS_API = `${REMOTE_SERVER}/api/users`;

export const signin = async (credentials: any) => {
  console.log('REMOTE_SERVER:', REMOTE_SERVER); // Check if env variable is loaded
  const hashedCredentials = {
    username: credentials.email,
    password: CryptoJS.SHA256(credentials.password).toString()
  };
  console.log('Sending request to:', `${REMOTE_SERVER}/api/login`);
  const response = await axiosWithCredentials.post(`${REMOTE_SERVER}/api/login`, hashedCredentials);
  return response.data;
};