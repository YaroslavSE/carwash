import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Rating } from '@mui/material';
import api from '../api/axios';

const ReviewsManager = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/reviews');
        setReviews(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReviews();
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>Відгуки Клієнтів</Typography>
      
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><b>Дата</b></TableCell>
              <TableCell><b>Клієнт</b></TableCell>
              <TableCell><b>Філія</b></TableCell>
              <TableCell><b>Оцінка</b></TableCell>
              <TableCell><b>Коментар</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((r) => (
              <TableRow key={r.review_id}>
                <TableCell>{new Date(r.created_at).toLocaleDateString('uk-UA')}</TableCell>
                <TableCell>
                  {r.client?.first_name} {r.client?.last_name}<br/>
                  <Typography variant="caption" color="text.secondary">{r.client?.phone}</Typography>
                </TableCell>
                <TableCell>{r.order?.branch?.name}</TableCell>
                <TableCell><Rating value={r.rating} readOnly size="small" /></TableCell>
                <TableCell>{r.comment || '-'}</TableCell>
              </TableRow>
            ))}
            {reviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Немає відгуків</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReviewsManager;
