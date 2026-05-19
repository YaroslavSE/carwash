import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating } from '@mui/material';
import api from '../api/axios';

const statusMap = {
  pending: { label: 'Очікує', color: 'warning' },
  in_progress: { label: 'В процесі', color: 'info' },
  completed: { label: 'Завершено', color: 'success' },
  cancelled: { label: 'Скасовано', color: 'error' },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchOrders = async () => {
    const res = await api.get('/orders');
    setOrders(res.data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenReview = (orderId) => {
    setSelectedOrderId(orderId);
    setRating(5);
    setComment('');
    setReviewOpen(true);
  };

  const handleSubmitReview = async () => {
    try {
      await api.post(`/reviews/order/${selectedOrderId}`, { rating, comment });
      setReviewOpen(false);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка збереження відгуку');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати це замовлення?')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка скасування замовлення');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>Мої Замовлення</Typography>

      {orders.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={4}>У вас ще немає замовлень.</Typography>
      )}

      {orders.map(order => (
        <Card key={order.order_id} sx={{ mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ pb: "16px !important" }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="h6" fontWeight="bold">
                {new Date(order.scheduled_time).toLocaleString('uk-UA')}
              </Typography>
              <Chip 
                label={statusMap[order.status]?.label || order.status} 
                color={statusMap[order.status]?.color || 'default'} 
                size="small" 
                sx={{ fontWeight: 'bold' }} 
              />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Відділення: {order.branch?.name}
            </Typography>
            <Typography variant="body1" fontWeight="bold" mt={2}>
              Сума: ₴ {order.total_amount}
            </Typography>
            {order.status === 'completed' && !order.review && (
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 2, borderRadius: 2 }}
                onClick={() => handleOpenReview(order.order_id)}
              >
                Оцінити візит
              </Button>
            )}
            {order.status === 'pending' && (
              <Button 
                variant="outlined" 
                color="error"
                size="small" 
                sx={{ mt: 2, ml: 1, borderRadius: 2 }}
                onClick={() => handleCancelOrder(order.order_id)}
              >
                Скасувати
              </Button>
            )}
            {order.review && (
              <Box mt={2} display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">Ваша оцінка:</Typography>
                <Rating value={order.review.rating} readOnly size="small" />
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Оцінити візит</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Рейтинг:</Typography>
              <Rating 
                value={rating} 
                onChange={(event, newValue) => setRating(newValue)} 
                size="large"
              />
            </Box>
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              label="Ваш відгук (необов'язково)" 
              value={comment} 
              onChange={e => setComment(e.target.value)} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewOpen(false)} sx={{ borderRadius: 2 }}>Скасувати</Button>
          <Button variant="contained" onClick={handleSubmitReview} sx={{ borderRadius: 2 }} disabled={!rating}>
            Відправити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
