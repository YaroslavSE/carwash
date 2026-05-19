import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem } from '@mui/material';
import api from '../api/axios';

const statusMap = {
  pending: { label: 'Очікує', color: 'orange' },
  in_progress: { label: 'В процесі', color: 'blue' },
  completed: { label: 'Завершено', color: 'green' },
  cancelled: { label: 'Скасовано', color: 'red' },
};

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await api.get('/admin/orders');
    setOrders(res.data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка оновлення статусу');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>Керування Замовленнями</Typography>
      
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Час запису</b></TableCell>
              <TableCell><b>Філія</b></TableCell>
              <TableCell><b>Співробітник</b></TableCell>
              <TableCell><b>Сума</b></TableCell>
              <TableCell><b>Статус</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.order_id}>
                <TableCell>#{o.order_id}</TableCell>
                <TableCell>{new Date(o.scheduled_time).toLocaleString('uk-UA')}</TableCell>
                <TableCell>{o.branch?.name}</TableCell>
                <TableCell>{o.employee ? `${o.employee.first_name} ${o.employee.last_name}` : 'Не призначено'}</TableCell>
                <TableCell>₴ {o.total_amount}</TableCell>
                <TableCell>
                  <Select 
                    value={o.status} 
                    size="small"
                    onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                    sx={{ color: statusMap[o.status]?.color, fontWeight: 'bold' }}
                  >
                    <MenuItem value="pending">Очікує</MenuItem>
                    <MenuItem value="in_progress">В процесі</MenuItem>
                    <MenuItem value="completed">Завершено</MenuItem>
                    <MenuItem value="cancelled">Скасовано</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OrdersManager;
