import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopUp = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleTopUp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/account/top-up', { amount: Number(amount) });
      await fetchUser();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка поповнення');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
          Поповнення балансу
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
          Поточний баланс: ₴ {user?.account?.balance || 0}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleTopUp}>
          <TextField
            fullWidth
            label="Сума поповнення (₴)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            inputProps={{ min: 1 }}
            sx={{ mb: 3 }}
          />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ borderRadius: 2, py: 1.5 }}>
            Оплатити
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default TopUp;
