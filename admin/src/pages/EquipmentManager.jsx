import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Chip } from '@mui/material';
import api from '../api/axios';

const EquipmentManager = () => {
  const [equipment, setEquipment] = useState([]);

  const fetchEquipment = async () => {
    const res = await api.get('/admin/equipment');
    setEquipment(res.data);
  };

  useEffect(() => { fetchEquipment(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/equipment/${id}/status`, { status: newStatus });
      fetchEquipment();
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка оновлення статусу');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>Керування Обладнанням</Typography>
      
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><b>Назва</b></TableCell>
              <TableCell><b>Тип</b></TableCell>
              <TableCell><b>Філія</b></TableCell>
              <TableCell><b>Дата обслуговування</b></TableCell>
              <TableCell><b>Статус</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment.map((e) => (
              <TableRow key={e.equipment_id}>
                <TableCell>{e.name}</TableCell>
                <TableCell><Chip label={e.equipment_type} size="small" /></TableCell>
                <TableCell>{e.branch?.name}</TableCell>
                <TableCell>{new Date(e.last_maintenance_date).toLocaleDateString('uk-UA')}</TableCell>
                <TableCell>
                  <Select 
                    value={e.status} 
                    size="small"
                    onChange={(ev) => handleStatusChange(e.equipment_id, ev.target.value)}
                  >
                    <MenuItem value="operational">Працює</MenuItem>
                    <MenuItem value="maintenance">На обслуговуванні</MenuItem>
                    <MenuItem value="broken">Зламано</MenuItem>
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

export default EquipmentManager;
