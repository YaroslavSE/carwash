import React, { useState, useEffect } from 'react';
import { Box, Typography, Stepper, Step, StepLabel, Button, Card, CardContent, MenuItem, Select, FormControl, InputLabel, CircularProgress, Checkbox, ListItemText, Chip } from '@mui/material';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import BookingCalendar from '../components/BookingCalendar';

const steps = ['Вибір філії', 'Вибір послуги', 'Вибір часу', 'Підтвердження'];

const CreateOrder = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/branches').then(res => setBranches(res.data));
    api.get('/clients/me/subscriptions').then(res => setSubscriptions(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      api.get(`/branches/${selectedBranch}/services`).then(res => {
        // map BranchService to normal services
        const servs = res.data.map(bs => ({
          service_id: bs.service.service_id,
          name: bs.service.name,
          price: bs.price
        }));
        setServices(servs);
      });
    }
  }, [selectedBranch]);

  const handleNext = () => {
    if (activeStep === 0) setSelectedServices([]); // reset services if branch changes
    setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedServicesData = services.filter(s => selectedServices.includes(s.service_id));
      
      const pad = (n) => n.toString().padStart(2, '0');
      // Append .000Z so the backend stores the numerical local time directly,
      // canceling out the pg driver's local time parse shift on read.
      const localIso = `${scheduledTime.getFullYear()}-${pad(scheduledTime.getMonth()+1)}-${pad(scheduledTime.getDate())}T${pad(scheduledTime.getHours())}:${pad(scheduledTime.getMinutes())}:00.000Z`;

      const payload = {
        branch_id: selectedBranch,
        box_number: selectedBox,
        scheduled_time: localIso,
        services: selectedServicesData.map(s => ({
          service_id: s.service_id,
          quantity: 1,
          price: s.price
        }))
      };
      await api.post('/orders', payload);
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Помилка створення замовлення');
    } finally {
      setLoading(false);
    }
  };

  const isNextDisabled = () => {
    if (activeStep === 0 && !selectedBranch) return true;
    if (activeStep === 1 && selectedServices.length === 0) return true;
    if (activeStep === 2 && !scheduledTime) return true;
    return false;
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>Філія</InputLabel>
            <Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} label="Філія">
              {branches.map(b => (
                <MenuItem key={b.branch_id} value={b.branch_id}>
                  {b.name} - {b.address}
                  {b.rating > 0 && <span style={{ marginLeft: '8px', color: '#faaf00', fontWeight: 'bold' }}>⭐ {Number(b.rating).toFixed(1)}</span>}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 1:
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>Послуги</InputLabel>
            <Select 
              multiple
              value={selectedServices} 
              onChange={(e) => setSelectedServices(e.target.value)} 
              label="Послуги"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const serv = services.find(s => s.service_id === value);
                    return <Chip key={value} label={serv?.name} />;
                  })}
                </Box>
              )}
            >
              {services.map(s => (
                <MenuItem key={s.service_id} value={s.service_id}>
                  <Checkbox checked={selectedServices.includes(s.service_id)} />
                  <ListItemText primary={`${s.name} - ₴ ${s.price}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 2:
        const bCal = branches.find(x => x.branch_id === selectedBranch);
        const sDataCal = services.filter(x => selectedServices.includes(x.service_id));
        const totalDurationCal = sDataCal.reduce((acc, curr) => acc + (curr.duration_minutes || 15), 0);

        return (
          <Box>
            <Typography variant="body1" mb={2} color="text.secondary">
              Виберіть зручний для вас час. Тривалість послуг: {totalDurationCal} хв.
            </Typography>
            <BookingCalendar 
              branchId={selectedBranch} 
              capacity={bCal?.capacity || 1} 
              workingHours={bCal?.working_hours}
              totalDurationMinutes={totalDurationCal}
              onSlotSelect={(time, box) => {
                setScheduledTime(time);
                setSelectedBox(box);
              }}
            />
          </Box>
        );
      case 3:
        const b = branches.find(x => x.branch_id === selectedBranch);
        const sData = services.filter(x => selectedServices.includes(x.service_id));
        const totalDuration = sData.reduce((acc, curr) => acc + (curr.duration_minutes || 15), 0);
        
        let totalPrice = 0;
        let discountApplied = 0;
        let planUsedName = null;

        const today = new Date();
        today.setHours(0,0,0,0);
        const activeSub = subscriptions.find(sub => sub.status === 'active' && new Date(sub.end_date) >= today);
        let planServiceIds = [];
        let canUseSub = false;

        if (activeSub) {
          planServiceIds = activeSub.subscription_plan.services?.map(s => s.service_id) || [];
          const hasCoveredService = sData.some(s => planServiceIds.includes(s.service_id));
          if (hasCoveredService) {
            if (activeSub.subscription_plan.is_unlimited || activeSub.washes_remaining > 0) {
              canUseSub = true;
            }
          }
        }

        sData.forEach(s => {
          let priceToCharge = Number(s.price);
          if (canUseSub && planServiceIds.includes(s.service_id)) {
            discountApplied += priceToCharge;
            priceToCharge = 0;
            planUsedName = activeSub.subscription_plan.name;
          }
          totalPrice += priceToCharge;
        });

        return (
          <Box>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Перевірте дані замовлення:</Typography>
                <Typography><b>Філія:</b> {b?.name}</Typography>
                <Typography><b>Послуги:</b> {sData.map(s => s.name).join(', ')}</Typography>
                <Typography><b>Час:</b> {scheduledTime?.toLocaleString('uk-UA')} (Бокс {selectedBox})</Typography>
                <Typography><b>Сума:</b> ₴ {totalPrice} {discountApplied > 0 && <span style={{color:'green'}}>(Знижка: -₴ {discountApplied})</span>}</Typography>
                {discountApplied > 0 && (
                  <Typography variant="body2" color="success.main" mt={1}>
                    ✅ Застосовано підписку: {planUsedName}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      default: return 'Невідомий крок';
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>Новий Запис</Typography>
      
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4, mb: 4, minHeight: '200px' }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1, borderRadius: 2 }}
        >
          Назад
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Записатись'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} disabled={isNextDisabled()} sx={{ borderRadius: 2 }}>
            Далі
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CreateOrder;
