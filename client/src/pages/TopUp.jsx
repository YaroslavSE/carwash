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
      // Call our new Stripe endpoint
      const response = await api.post('/stripe/create-checkout-session', { amount: Number(amount) });
      if (response.data && response.data.url) {
        // Redirect the user to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        setError('Не вдалося створити платіжну сесію');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка створення платежу');
    }
  };

  return (
    <Box flex={1} display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
      <Paper elevation={0} sx={{ p: 4, m: 'auto', width: '100%', maxWidth: 400, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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
