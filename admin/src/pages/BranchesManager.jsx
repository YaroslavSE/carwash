import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Delete, Edit, AddBusiness } from '@mui/icons-material';
import api from '../api/axios';

const BranchesManager = () => {
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', phone: '', working_hours: '', capacity: 2
  });

  const fetchBranches = async () => {
    const res = await api.get('/admin/branches');
    setBranches(res.data);
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleOpen = (branch = null) => {
    if (branch) {
      setEditingId(branch.branch_id);
      setFormData({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        working_hours: branch.working_hours,
        capacity: branch.capacity
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '', city: '', phone: '', working_hours: '', capacity: 2 });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/admin/branches/${editingId}`, formData);
      } else {
        await api.post('/admin/branches', formData);
      }
      handleClose();
      fetchBranches();
    } catch (err) {
      alert('Помилка збереження. Перевірте дані.');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Деактивувати цю філію?')) {
      try {
        await api.delete(`/admin/branches/${id}`);
        fetchBranches();
      } catch (err) {
        alert('Помилка видалення');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Керування Філіями</Typography>
        <Button variant="contained" startIcon={<AddBusiness />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
          Додати
        </Button>
      </Box>
      
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><b>Назва</b></TableCell>
              <TableCell><b>Адреса</b></TableCell>
              <TableCell><b>Телефон</b></TableCell>
              <TableCell><b>Години роботи</b></TableCell>
              <TableCell><b>Місткість</b></TableCell>
              <TableCell><b>Статус</b></TableCell>
              <TableCell align="right"><b>Дії</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.branch_id}>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.city ? b.city + ', ' : ''}{b.address}</TableCell>
                <TableCell>{b.phone}</TableCell>
                <TableCell>{b.working_hours}</TableCell>
                <TableCell>{b.capacity} боксів</TableCell>
                <TableCell>
                  <Chip label={b.is_active ? 'Активна' : 'Закрита'} color={b.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(b)}>
                    <Edit />
                  </IconButton>
                  {b.is_active && (
                    <IconButton color="error" onClick={() => handleDelete(b.branch_id)}>
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Редагувати філію' : 'Додати філію'}</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Назва філії" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <Box display="flex" gap={2}>
              <TextField fullWidth label="Місто" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              <TextField fullWidth label="Адреса" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </Box>
            <TextField fullWidth label="Телефон" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            
            <Box display="flex" gap={2}>
              <TextField fullWidth label="Години роботи (напр. 08:00 - 22:00)" value={formData.working_hours} onChange={e => setFormData({...formData, working_hours: e.target.value})} />
              <TextField fullWidth label="Кількість боксів (місткість)" type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Скасувати</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ borderRadius: 2 }}>Зберегти</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BranchesManager;
