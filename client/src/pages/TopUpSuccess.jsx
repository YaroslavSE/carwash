import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopUpSuccess = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Оновити дані користувача (баланс)
    fetchUser();

    // Таймер для зворотнього відліку
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Автоматичний перехід на головну через 3 секунди
    const timeout = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box flex={1} display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 5, 
          m: 'auto',
          width: '100%', 
          maxWidth: 450, 
          borderRadius: 4, 
          border: '1px solid', 
          borderColor: 'success.light', 
          textAlign: 'center',
          background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)',
          boxShadow: '0 10px 30px rgba(34, 197, 94, 0.1)'
        }}
      >
        <Box 
          sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            bgcolor: 'success.main', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            margin: '0 auto',
            mb: 3,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
              '70%': { boxShadow: '0 0 0 15px rgba(34, 197, 94, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' }
            }
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </Box>
        
        <Typography variant="h4" fontWeight="800" color="success.main" mb={2}>
          Оплата Успішна!
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4} fontSize="1.1rem">
          Ваш баланс було миттєво поповнено. Дякуємо, що обираєте нас!
        </Typography>
        
        <Box display="flex" alignItems="center" justifyContent="center" gap={1.5}>
          <CircularProgress size={20} color="success" thickness={5} />
          <Typography variant="body2" color="text.secondary" fontWeight="500">
            Перенаправлення на головну через {countdown}...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default TopUpSuccess;
