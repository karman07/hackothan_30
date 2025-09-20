import axios from 'axios';

export const API_URL = 'http://93.127.194.249:1001'; // adjust this to match your NestJS server URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  _id?: string;
  candidate_name: string;
  relation: string;
  parent_name: string;
  institute: string;
  course: string;
  division: string;
  marks_obtained: string;
  marks_total: string;
  date: string;
  place: string;
  createdAt?: string;
  updatedAt?: string;
}

export const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
