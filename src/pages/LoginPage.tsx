import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginUI from '../components/LoginUI';
import { LoginFormData } from '../types/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();


  const handleLogin = async (data: LoginFormData) => {
    // Only allow login with dummy credentials
    if (data.email === 'admin@gmail.com' && data.password === '123456') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } else {
      // Pass error to LoginUI
      return 'Invalid credentials';
    }
  };

  return <LoginUI onLogin={handleLogin} demoEmail="admin@gmail.com" demoPassword="123456" />;
};

export default LoginPage;
