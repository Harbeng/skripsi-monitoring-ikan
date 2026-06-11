import { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText 
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, Assignment, People, 
  Storage, BarChart, Notifications, Person, ExitToApp, Wifi as WifiIcon 
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 260;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // Mengambil data user dari LocalStorage saat komponen dimuat
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setUserData(JSON.parse(user));
    } else {
      // Jika tidak ada data login, tendang kembali ke halaman login
      navigate('/login');
    }
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Definisi Menu berdasarkan Role
  const getMenuItems = () => {
    const role = userData?.role;
    const basePath = role === 'Admin' ? '/admin' : '/dinas';

    const commonMenus = [
      { text: 'Dashboard', icon: <Dashboard />, path: `${basePath}/dashboard` },
      { text: 'Laporan', icon: <Assignment />, path: `${basePath}/laporan` },
      { text: 'Analisis Laporan', icon: <BarChart />, path: `${basePath}/analisis` },
      { text: 'Notifikasi & Alarm', icon: <Notifications />, path: `${basePath}/notif` },
      { text: 'Profile', icon: <Person />, path: `${basePath}/profile` },
    ];

    if (role === 'Admin') {
      // Sisipkan menu khusus Admin (termasuk Jaringan WiFi)
      commonMenus.splice(2, 0, 
        { text: 'Manajemen Data', icon: <Storage />, path: '/admin/manajemen-data' },
        { text: 'Manajemen User', icon: <People />, path: '/admin/manajemen-user' },
        { text: 'Jaringan / WiFi', icon: <WifiIcon />, path: '/admin/jaringan-wifi' }
      );
    }
    return commonMenus;
  };

  const drawer = (
    <div>
      <Toolbar sx={{ backgroundColor: '#0d47a1', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          {userData?.role} Panel
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Masuk sebagai:</Typography>
        <Typography variant="subtitle1" fontWeight="bold">{userData?.nama_lengkap}</Typography>
        <Typography variant="caption" color="text.secondary">NIP: {userData?.nip}</Typography>
      </Box>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              selected={location.pathname === item.path}
              sx={{ 
                '&.Mui-selected': { backgroundColor: '#e3f2fd', borderRight: '4px solid #1976d2' }
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  if (!userData) return null; // Mencegah kedipan sebelum data user dimuat

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header Atas */}
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Sistem Monitoring Kualitas Ikan
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar (Drawer) */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Sidebar untuk Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        {/* Sidebar untuk Desktop */}
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Area Konten Utama */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Toolbar /> {/* Spacer agar konten tidak tertutup header */}
        
        {/* Outlet ini adalah tempat di mana halaman anak (seperti Dashboard, Laporan, dll) akan ditampilkan */}
        <Outlet /> 
      </Box>
    </Box>
  );
}