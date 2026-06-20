import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import api from '../api/axios';

const BookingCalendar = ({ branchId, capacity, workingHours, totalDurationMinutes, onSlotSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Parse working hours dynamically
  let parsedStart = 8;
  let parsedEnd = 20;
  if (workingHours) {
    const match = workingHours.match(/(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}/);
    if (match) {
      parsedStart = parseInt(match[1], 10);
      parsedEnd = parseInt(match[2], 10);
    }
  }

  const startHour = parsedStart;
  const endHour = parsedEnd;
  const pixelsPerMinute = 2; // 1 hour = 120px
  const hourHeight = 60 * pixelsPerMinute;
  const totalHeight = (endHour - startHour) * hourHeight;

  useEffect(() => {
    if (!branchId) return;
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth()+1)}-${pad(currentDate.getDate())}`;
        const res = await api.get(`/orders/schedule?branch_id=${branchId}&date=${dateStr}`);
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [branchId, currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
    setSelectedSlot(null);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
    setSelectedSlot(null);
  };

  const calculateTop = (dateStr) => {
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = d.getMinutes();
    if (h < startHour) return 0;
    if (h >= endHour) return totalHeight;
    return ((h - startHour) * 60 + m) * pixelsPerMinute;
  };

  const checkOverlap = (box, time, duration) => {
    const startObj = time.getTime();
    const endObj = startObj + duration * 60000;
    
    for (let o of orders) {
      if (o.box_number !== box) continue;
      const oStart = new Date(o.scheduled_time).getTime();
      const oEnd = oStart + o.duration_minutes * 60000;
      if (startObj < oEnd && endObj > oStart) return true;
    }
    return false;
  };

  const handleGridClick = (e, box) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromStart = Math.floor(y / pixelsPerMinute);
    const roundedMinutes = Math.floor(minutesFromStart / 15) * 15; // 15 min step
    
    const time = new Date(currentDate);
    time.setHours(startHour, roundedMinutes, 0, 0);

    if (time < new Date()) {
      return;
    }

    const endTime = new Date(time.getTime() + totalDurationMinutes * 60000);
    const closingTime = new Date(currentDate);
    closingTime.setHours(endHour, 0, 0, 0);

    if (endTime > closingTime) {
      return;
    }

    if (checkOverlap(box, time, totalDurationMinutes)) {
      return;
    }

    setSelectedSlot({ box, time });
    if (onSlotSelect) onSlotSelect(time, box);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  const renderBlock = (top, height, color, title, subtitle, isSelected = false) => (
    <Box
      sx={{
        position: 'absolute',
        top: `${top}px`,
        height: `${height}px`,
        left: '2%',
        width: '96%',
        bgcolor: color,
        borderRadius: '6px',
        p: '4px 8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 4px 12px rgba(147, 197, 253, 0.5)' : 'none',
        border: `1px solid ${isSelected ? '#60a5fa' : 'rgba(0,0,0,0.05)'}`,
        zIndex: isSelected ? 10 : 5,
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ fontSize: '10px', color: '#475569', lineHeight: 1.2, mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <IconButton size="small" onClick={handlePrevDay} sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" fontWeight="600" sx={{ flex: 1, textAlign: 'center', textTransform: 'capitalize', color: '#0f172a' }}>
          {currentDate.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
        <IconButton size="small" onClick={handleNextDay} sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Columns Header (Boxes) */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ width: '60px', flexShrink: 0 }} /> {/* Top Left Corner */}
            {Array.from({ length: capacity || 1 }, (_, i) => i + 1).map(box => (
              <Box key={box} sx={{ flex: 1, py: 1.5, textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                  Бокс {box}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Body */}
          <Box sx={{ display: 'flex', position: 'relative', height: `${totalHeight + 60}px` }}>
            
            {/* Left Time Axis */}
            <Box sx={{ width: '60px', flexShrink: 0, position: 'relative', height: '100%' }}>
              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                <Box key={i} sx={{ position: 'absolute', top: i * hourHeight, width: '100%', textAlign: 'right', pr: 1, mt: '2px' }}>
                  <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, lineHeight: 1 }}>
                    {startHour + i}:00
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Grid Area */}
            <Box sx={{ flex: 1, display: 'flex', position: 'relative', borderLeft: '1px solid #e2e8f0', height: '100%' }}>
              
              {/* Horizontal Background Lines */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                {Array.from({ length: endHour - startHour }).map((_, i) => (
                  <Box key={`h-${i}`} sx={{ height: `${hourHeight}px`, borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #f1f5f9' }} />
                  </Box>
                ))}
              </Box>

              {/* Vertical Columns for Boxes */}
              {Array.from({ length: capacity || 1 }).map((_, colIndex) => {
                const boxNumber = colIndex + 1;
                return (
                  <Box 
                    key={boxNumber} 
                    sx={{ 
                      flex: 1, 
                      position: 'relative', 
                      borderRight: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(241, 245, 249, 0.4)' }
                    }}
                    onClick={(e) => handleGridClick(e, boxNumber)}
                  >
                    {/* Render Booked Orders */}
                    {orders.filter(o => o.box_number === boxNumber).map(o => {
                      const top = calculateTop(o.scheduled_time);
                      const height = o.duration_minutes * pixelsPerMinute;
                      const endTime = new Date(new Date(o.scheduled_time).getTime() + o.duration_minutes * 60000);
                      return renderBlock(
                        top, height, '#e2e8f0', 
                        'Зайнято', 
                        `${formatTime(new Date(o.scheduled_time))} - ${formatTime(endTime)}`
                      );
                    })}

                    {/* Render Selected Slot */}
                    {selectedSlot?.box === boxNumber && renderBlock(
                      calculateTop(selectedSlot.time),
                      totalDurationMinutes * pixelsPerMinute,
                      '#bfdbfe', // nice blue
                      'Ваш запис',
                      `${formatTime(selectedSlot.time)} (${totalDurationMinutes} хв)`,
                      true
                    )}
                  </Box>
                );
              })}

            </Box>
          </Box>

        </Box>
      )}
    </Box>
  );
};

export default BookingCalendar;
