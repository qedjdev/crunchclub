export const fetchUsers = async (userId: string, page: number = 0): Promise<any> => {
  const API_BASE = process.env.REACT_APP_REMOTE_SERVER || 'http://localhost:4000';
  const response = await fetch(`${API_BASE}/api/users/admin/list?page=${page}&userId=${userId}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}; 