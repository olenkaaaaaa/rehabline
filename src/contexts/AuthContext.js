import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Функція входу (тепер повертає об'єкт користувача)
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Імітація запиту до сервера
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Визначаємо роль залежно від email (для демо)
      let role = 'client';
      if (email.includes('admin')) role = 'admin';
      else if (email.includes('specialist')) role = 'specialist';
      else if (email.includes('registrar')) role = 'registrar';

      // Створюємо об'єкт користувача
      const userData = {
        id: 1,
        name: email.split('@')[0], // ім'я з email (умовно)
        email,
        role,
      };
      setUser(userData);
      return userData; // Повертаємо для подальшого використання
    } finally {
      setLoading(false);
    }
  };

  // Функція реєстрації (емуляція)
  const register = async (userData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Registered user:', userData);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  // Функція виходу
  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};