import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, CircularProgress, Rating, Avatar } from '@mui/material';
import { AccountBalanceWallet, DirectionsCar, LocalOffer } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const subsRes = await api.get('/clients/subscriptions');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeSubs = subsRes.data.filter(s => s.status === 'active' && new Date(s.end_date) >= today);
        setSubs(activeSubs);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      } finally {
        setLoading(false);
      }

      try {
        const reviewsRes = await api.get('/reviews/latest');
        console.log('Fetched reviews:', reviewsRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Привіт, {user?.first_name}! 👋
      </Typography>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={6}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AccountBalanceWallet fontSize="small" />
              <Typography variant="body2">Баланс</Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">₴ {user?.account?.balance || 0}</Typography>
            <Button variant="contained" color="secondary" size="small" sx={{ mt: 1, borderRadius: 2 }} onClick={() => navigate('/topup')}>
              Поповнити
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: '#fef3c7', color: '#b45309' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocalOffer fontSize="small" />
              <Typography variant="body2">Підписки</Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">{subs.length}</Typography>
            <Button variant="outlined" size="small" sx={{ mt: 1, borderRadius: 2, color: '#b45309', borderColor: '#b45309' }} onClick={() => navigate('/subscriptions')}>
              Придбати
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">Активні підписки</Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : subs.length > 0 ? (
        subs.map(sub => (
          <Card key={sub.subscription_id} sx={{ mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6">{sub.subscription_plan?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                До: {new Date(sub.end_date).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight="bold" mt={0.5}>
                {sub.subscription_plan?.is_unlimited 
                  ? `Безліміт (Ліміт: ${sub.subscription_plan?.daily_limit} разів/день)`
                  : `Залишилось: ${sub.washes_remaining} мийок`
                }
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography color="text.secondary" mb={2}>У вас ще немає активних підписок</Typography>
          <Button variant="contained" onClick={() => navigate('/subscriptions')} sx={{ borderRadius: 2 }}>Переглянути плани</Button>
        </Paper>
      )}

      <Box mt={4}>
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          size="large" 
          startIcon={<DirectionsCar />}
          sx={{ py: 2, borderRadius: 3, fontSize: '1.1rem' }}
          onClick={() => navigate('/orders/create')}
        >
          Записатись на мийку
        </Button>
      </Box>

      {reviews.length > 0 && (
        <Box mt={5} mb={2}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Що про нас кажуть клієнти 💬</Typography>
          <Box display="flex" gap={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 } }}>
            {reviews.map(review => (
              <Card key={review.review_id} sx={{ minWidth: 280, maxWidth: 280, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', flexShrink: 0 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '1rem' }}>
                      {review.client?.first_name?.[0] || 'К'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {review.client?.first_name} {review.client?.last_name?.[0]}.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {review.order?.branch?.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Rating value={review.rating} size="small" readOnly mb={1} />
                  {review.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{review.comment}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
