import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Delete, Edit, PersonAdd } from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EmployeesManager = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '', role: 'washer', branch_id: '', salary: '', hire_date: new Date().toISOString().split('T')[0], password: ''
  });

  const fetchData = async () => {
    const empRes = await api.get('/admin/employees');
    setEmployees(empRes.data);
    const branchRes = await api.get('/branches');
    setBranches(branchRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = (employee = null) => {
    if (employee) {
      setEditingId(employee.employee_id);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        phone: employee.phone,
        role: employee.role,
        branch_id: employee.branch_id,
        salary: employee.salary,
        hire_date: employee.hire_date,
        password: '' // Don't show existing password
      });
    } else {
      setEditingId(null);
      setFormData({ first_name: '', last_name: '', phone: '', role: 'washer', branch_id: branches[0]?.branch_id || '', salary: '', hire_date: new Date().toISOString().split('T')[0], password: '' });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/admin/employees/${editingId}`, formData);
      } else {
        await api.post('/admin/employees', formData);
      }
      handleClose();
      fetchData();
    } catch (err) {
      alert('Помилка збереження. Перевірте дані.');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Деактивувати цього співробітника?')) {
      try {
        await api.delete(`/admin/employees/${id}`);
        fetchData();
      } catch (err) {
        alert('Помилка видалення');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Співробітники</Typography>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
          Додати
        </Button>
      </Box>
      
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><b>Ім'я</b></TableCell>
              <TableCell><b>Роль</b></TableCell>
              <TableCell><b>Філія</b></TableCell>
              <TableCell><b>Телефон</b></TableCell>
              <TableCell><b>Зарплата</b></TableCell>
              <TableCell><b>Статус</b></TableCell>
              <TableCell align="right"><b>Дії</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.employee_id}>
                <TableCell>{e.first_name} {e.last_name}</TableCell>
                <TableCell><Chip label={e.role} color={e.role === 'admin' ? 'error' : 'primary'} size="small" /></TableCell>
                <TableCell>{e.branch?.name}</TableCell>
                <TableCell>{e.phone}</TableCell>
                <TableCell>₴ {e.salary}</TableCell>
                <TableCell>
                  <Chip label={e.is_active ? 'Активний' : 'Звільнений'} color={e.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(e)}>
                    <Edit />
                  </IconButton>
                  {e.is_active && (
                    <IconButton color="error" onClick={() => handleDelete(e.employee_id)}>
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
        <DialogTitle>{editingId ? 'Редагувати співробітника' : 'Додати співробітника'}</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} sx={{ mt: 1 }}>
            <Box display="flex" gap={2}>
              <TextField fullWidth label="Ім'я" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              <TextField fullWidth label="Прізвище" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </Box>
            <TextField fullWidth label="Телефон" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            
            <TextField fullWidth select label="Роль" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <MenuItem value="washer">Мийник (washer)</MenuItem>
              <MenuItem value="manager">Менеджер (manager)</MenuItem>
              <MenuItem value="admin">Адміністратор (admin)</MenuItem>
              <MenuItem value="cashier">Касир (cashier)</MenuItem>
            </TextField>
            
            {user?.role === 'admin' && (
              <TextField fullWidth select label="Філія" value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})}>
                {branches.map(b => (
                  <MenuItem key={b.branch_id} value={b.branch_id}>{b.name} ({b.address})</MenuItem>
                ))}
              </TextField>
            )}

            <Box display="flex" gap={2}>
              <TextField fullWidth label="Зарплата (₴)" type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
              <TextField fullWidth label="Дата найму" type="date" InputLabelProps={{ shrink: true }} value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} />
            </Box>

            <TextField 
              fullWidth 
              label={editingId ? "Новий пароль (залиште пустим, щоб не змінювати)" : "Пароль"} 
              type="text" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              helperText={!editingId && "Якщо не вказано, паролем буде номер телефону"}
            />
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

export default EmployeesManager;
