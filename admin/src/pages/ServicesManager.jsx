import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, MenuItem
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api/axios';

const ServicesManager = () => {
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'basic_wash', base_price: '', duration_minutes: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpen = (service = null) => {
    if (service) {
      setEditingId(service.service_id);
      setFormData(service);
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', category: 'basic_wash', base_price: '', duration_minutes: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/admin/services/${editingId}`, formData);
      } else {
        await api.post('/admin/services', formData);
      }
      handleClose();
      fetchServices();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ви впевнені, що хочете деактивувати цю послугу?')) {
      try {
        await api.delete(`/admin/services/${id}`);
        fetchServices();
      } catch (err) {
        console.error(err);
        alert('Помилка видалення');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Управління Послугами</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
          Додати Послугу
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell>Категорія</TableCell>
              <TableCell>Ціна</TableCell>
              <TableCell>Тривалість</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.service_id}>
                <TableCell>{service.service_id}</TableCell>
                <TableCell fontWeight="bold">{service.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={service.category} color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{service.base_price} ₴</TableCell>
                <TableCell>{service.duration_minutes} хв</TableCell>
                <TableCell>
                  <Chip size="small" label={service.is_active ? "Активна" : "Неактивна"} color={service.is_active ? "success" : "default"} />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(service)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(service.service_id)} disabled={!service.is_active}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Редагувати Послугу' : 'Нова Послугу'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Назва послуги" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <TextField fullWidth margin="dense" select label="Категорія" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
            <MenuItem value="basic_wash">Базова мийка</MenuItem>
            <MenuItem value="premium_wash">Преміум мийка</MenuItem>
            <MenuItem value="interior">Хімчистка салону</MenuItem>
            <MenuItem value="polishing">Полірування</MenuItem>
            <MenuItem value="detailing">Детейлінг</MenuItem>
          </TextField>
          <TextField fullWidth margin="dense" label="Опис" multiline rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <Box display="flex" gap={2}>
            <TextField fullWidth margin="dense" label="Базова Ціна (₴)" type="number" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} />
            <TextField fullWidth margin="dense" label="Тривалість (хв)" type="number" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Скасувати</Button>
          <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>Зберегти</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesManager;
