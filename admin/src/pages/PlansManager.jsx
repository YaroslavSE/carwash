import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api/axios';

const PlansManager = () => {
  const [plans, setPlans] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', duration_days: 30, is_unlimited: false, washes_included: '', daily_limit: 1, discount_percent: 0, services: []
  });
  const [editingId, setEditingId] = useState(null);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      setServicesList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let baseSum = 0;
    formData.services.forEach(id => {
      const s = servicesList.find(x => x.service_id === id);
      if (s && s.base_price) baseSum += Number(s.base_price);
    });

    const quantity = formData.is_unlimited ? (Number(formData.duration_days || 30) * Number(formData.daily_limit || 1)) : Number(formData.washes_included || 0);
    const rawPrice = baseSum * quantity;
    const discountMultiplier = 1 - (Number(formData.discount_percent || 0) / 100);
    const calculatedPrice = Math.max(0, Math.round(rawPrice * discountMultiplier));

    if (formData.price !== calculatedPrice && open) {
      setFormData(prev => ({ ...prev, price: calculatedPrice }));
    }
  }, [formData.services, formData.is_unlimited, formData.washes_included, formData.duration_days, formData.daily_limit, formData.discount_percent, servicesList, open]);

  useEffect(() => {
    fetchPlans();
    fetchServices();
  }, []);

  const handleOpen = (plan = null) => {
    if (plan) {
      setEditingId(plan.plan_id);
      setFormData({
        ...plan,
        services: plan.services ? plan.services.map(s => s.service_id) : []
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', duration_days: 30, is_unlimited: false, washes_included: '', daily_limit: 1, discount_percent: 0, services: [] });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/admin/plans/${editingId}`, formData);
      } else {
        await api.post('/admin/plans', formData);
      }
      handleClose();
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей план підписки?')) {
      try {
        await api.delete(`/admin/plans/${id}`);
        fetchPlans();
      } catch (err) {
        console.error(err);
        alert('Помилка видалення');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Плани Підписок</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
          Додати План
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Назва Плану</TableCell>
              <TableCell>Ціна</TableCell>
              <TableCell>Дні</TableCell>
              <TableCell>Послуги</TableCell>
              <TableCell>Ліміт</TableCell>
              <TableCell>Знижка (%)</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.plan_id}>
                <TableCell>{plan.plan_id}</TableCell>
                <TableCell fontWeight="bold">{plan.name}</TableCell>
                <TableCell>{plan.price} ₴</TableCell>
                <TableCell>{plan.duration_days}</TableCell>
                <TableCell>
                  {plan.services && plan.services.length > 0 
                    ? plan.services.map(s => <Chip key={s.service_id} label={s.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)
                    : <Typography variant="caption" color="text.secondary">Немає</Typography>}
                </TableCell>
                <TableCell>
                  {plan.is_unlimited ? (
                    <Chip label={`Безліміт (${plan.daily_limit}/день)`} color="success" size="small" />
                  ) : (
                    <Chip label={`${plan.washes_included} візитів`} color="primary" size="small" />
                  )}
                </TableCell>
                <TableCell>{plan.discount_percent}%</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(plan)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(plan.plan_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Редагувати План' : 'Новий План'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Назва плану" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <TextField fullWidth margin="dense" label="Опис" multiline rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          
          <Box display="flex" gap={2} mt={1}>
            <TextField fullWidth label="Ціна (₴) - Автоматично" type="number" value={formData.price} InputProps={{ readOnly: true }} sx={{ bgcolor: 'action.hover' }} />
            <TextField fullWidth label="Тривалість (днів)" type="number" value={formData.duration_days} onChange={e => setFormData({ ...formData, duration_days: e.target.value })} />
            <TextField fullWidth label="Знижка (%)" type="number" value={formData.discount_percent} onChange={e => setFormData({ ...formData, discount_percent: e.target.value })} />
          </Box>
          
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel>Послуги в плані</InputLabel>
            <Select
              multiple
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
              input={<OutlinedInput label="Послуги в плані" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const service = servicesList.find(s => s.service_id === value);
                    return <Chip key={value} label={service ? service.name : value} />;
                  })}
                </Box>
              )}
            >
              {servicesList.map((service) => (
                <MenuItem key={service.service_id} value={service.service_id}>
                  {service.name} ({service.category})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            sx={{ mt: 2 }}
            control={<Checkbox checked={formData.is_unlimited} onChange={e => setFormData({ ...formData, is_unlimited: e.target.checked })} />}
            label="Безлімітний тариф"
          />
          
          <Box display="flex" gap={2} mt={1}>
            {!formData.is_unlimited ? (
              <TextField fullWidth label="Кількість мийок" type="number" value={formData.washes_included} onChange={e => setFormData({ ...formData, washes_included: e.target.value })} />
            ) : (
              <TextField fullWidth label="Денний ліміт візитів" type="number" value={formData.daily_limit} onChange={e => setFormData({ ...formData, daily_limit: e.target.value })} />
            )}
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

export default PlansManager;
