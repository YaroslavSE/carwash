import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Divider } from '@mui/material';
import { Menu, Dashboard, ListAlt, Store, Group, ExitToApp, LocalCarWash, LocalOffer, StarRate } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Дашборд', icon: <Dashboard />, path: '/' },
    { text: 'Замовлення', icon: <ListAlt />, path: '/orders' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ text: 'Філії', icon: <Store />, path: '/branches' });
    menuItems.push({ text: 'Співробітники', icon: <Group />, path: '/employees' });
    menuItems.push({ text: 'Послуги', icon: <LocalCarWash />, path: '/services' });
    menuItems.push({ text: 'Плани Підписок', icon: <LocalOffer />, path: '/plans' });
    menuItems.push({ text: 'Відгуки', icon: <StarRate />, path: '/reviews' });
  } else if (user?.role === 'manager') {
    menuItems.push({ text: 'Співробітники', icon: <Group />, path: '/employees' });
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" fontWeight="bold">Адмін Панель</Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><ExitToApp color="error" /></ListItemIcon>
          <ListItemText primary="Вийти" sx={{ color: 'error.main' }} />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Автомийка
          </Typography>
          <Typography variant="body2">
            {user?.first_name} {user?.last_name} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
