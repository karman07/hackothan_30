import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginUI from '../components/LoginUI';
import { LoginFormData } from '../types/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async (data: LoginFormData) => {
    // Here you would typically make an API call to authenticate
    console.log('Login attempt:', data);
    
    // For demo purposes, we'll simulate a successful login
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
  };

  return <LoginUI onLogin={handleLogin} />;
};

export default LoginPage;
