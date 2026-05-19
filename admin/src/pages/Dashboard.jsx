import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '../api/axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const [revenue, setRevenue] = useState([]);
  const [popular, setPopular] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [period, setPeriod] = useState('day');
  const [subStats, setSubStats] = useState({ total_subscriptions: 0, total_revenue: 0 });

  useEffect(() => {
    // using default dates for demo
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
    
    api.get(`/admin/reports/revenue?date_from=${from}&date_to=${to}`).then(res => setRevenue(res.data));
    api.get('/admin/reports/popular-services').then(res => setPopular(res.data));
    api.get('/admin/reports/subscriptions').then(res => setSubStats(res.data));
  }, []);

  useEffect(() => {
    api.get(`/admin/reports/revenue-over-time?period=${period}`).then(res => {
      // Format dates for display
      const formatted = res.data.map(item => {
        const dateObj = new Date(item.date);
        let label = '';
        if (period === 'day') label = dateObj.toLocaleDateString('uk-UA');
        else if (period === 'week') label = `Тиждень з ${dateObj.toLocaleDateString('uk-UA')}`;
        else label = dateObj.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' });
        
        return {
          ...item,
          displayDate: label,
          revenue: parseFloat(item.revenue) || 0
        };
      });
      setRevenueOverTime(formatted);
    });
  }, [period]);

  return (
    <Box sx={{ pb: 6 }}>
      <Typography variant="h4" fontWeight="bold" mb={5}>Дашборд</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fafc', borderLeft: '6px solid #8b5cf6' }}>
              <Typography variant="h6" color="textSecondary">Підписки (Цього місяця)</Typography>
              <Typography variant="h3" fontWeight="bold" mt={1}>{subStats.total_subscriptions} шт.</Typography>
              <Typography variant="subtitle1" color="success.main" fontWeight="bold" mt={1}>
                + {parseFloat(subStats.total_revenue).toFixed(2)} ₴ виручка
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Paper sx={{ p: 3, height: 450, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Динаміка прибутку</Typography>
            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Період</InputLabel>
              <Select value={period} label="Період" onChange={e => setPeriod(e.target.value)}>
                <MenuItem value="day">Денні</MenuItem>
                <MenuItem value="week">Тижневі</MenuItem>
                <MenuItem value="month">Місячні</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Дохід (₴)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 400, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" mb={2}>Дохід по філіям (за 30 днів)</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <XAxis dataKey="branch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_revenue" name="Дохід (₴)" fill="#1e293b" />
                    <Bar dataKey="total_orders" name="Замовлення" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 400, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" mb={2}>Популярні послуги</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={popular} dataKey="times_ordered" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {popular.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
