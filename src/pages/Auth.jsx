import React from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuthSuccess = (userData) => {
    login(userData);
    navigate('/');
  };

  return <Auth onAuthSuccess={handleAuthSuccess} />;
};

export default AuthPage;
