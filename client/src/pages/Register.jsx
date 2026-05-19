import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Typography, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка реєстрації');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
          Реєстрація
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Ім'я" name="first_name" variant="outlined" margin="normal" value={formData.first_name} onChange={handleChange} required />
          <TextField fullWidth label="Прізвище" name="last_name" variant="outlined" margin="normal" value={formData.last_name} onChange={handleChange} required />
          <TextField fullWidth label="Телефон" name="phone" variant="outlined" margin="normal" value={formData.phone} onChange={handleChange} required />
          <TextField fullWidth label="Email" name="email" variant="outlined" margin="normal" type="email" value={formData.email} onChange={handleChange} required />
          <TextField fullWidth label="Пароль" name="password" variant="outlined" margin="normal" type="password" value={formData.password} onChange={handleChange} required />
          
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}>
            Зареєструватись
          </Button>
        </form>
        
        <Typography textAlign="center" variant="body2" color="text.secondary">
          Вже є акаунт? <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Увійти</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;
