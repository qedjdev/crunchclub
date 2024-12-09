import axios from 'axios';

export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/admin-check`
    );
    return response.data.isAdmin;
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}; 