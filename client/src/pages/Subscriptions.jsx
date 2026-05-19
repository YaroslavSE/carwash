import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Chip } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    if(window.confirm('Придбати цю підписку? Кошти будуть зняті з балансу.')) {
      try {
        await api.post('/subscriptions', { plan_id: planId });
        await fetchUser();
        navigate('/');
      } catch (err) {
        alert(err.response?.data?.message || 'Помилка придбання');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={1}>Підписки</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Ваш баланс: ₴ {user?.account?.balance || 0}
      </Typography>

      <Grid container spacing={2}>
        {plans.map(plan => (
          <Grid item xs={12} key={plan.plan_id}>
            <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: plan.price > 1000 ? 'primary.main' : 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ pb: "16px !important" }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">{plan.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{plan.duration_days} днів</Typography>
                  </Box>
                  <Chip label={`₴ ${plan.price}`} color="primary" sx={{ fontWeight: 'bold' }} />
                </Box>
                <Typography variant="body2" mb={3}>{plan.description}</Typography>
                
                <Button 
                  fullWidth 
                  variant={plan.price > 1000 ? 'contained' : 'outlined'}
                  onClick={() => handleSubscribe(plan.plan_id)}
                  sx={{ borderRadius: 2 }}
                >
                  Оформити
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Subscriptions;
