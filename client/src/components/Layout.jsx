import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { Home, DirectionsCar, EventNote, Person, ExitToApp, AccountBalanceWallet } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            CarWash
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'primary.dark', px: 1.5, py: 0.5, borderRadius: 2 }}>
                <AccountBalanceWallet fontSize="small" />
                ₴ {user.account?.balance || 0}
              </Typography>
              <IconButton color="inherit" onClick={handleLogout} size="small">
                <ExitToApp />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>

      <BottomNavigation
        value={location.pathname}
        onChange={(event, newValue) => {
          navigate(newValue);
        }}
        showLabels
        sx={{ borderTop: 1, borderColor: 'divider', pb: 2, height: 70 }}
      >
        <BottomNavigationAction label="Головна" value="/" icon={<Home />} />
        <BottomNavigationAction label="Замовлення" value="/orders" icon={<EventNote />} />
      </BottomNavigation>
    </Box>
  );
};

export default Layout;
