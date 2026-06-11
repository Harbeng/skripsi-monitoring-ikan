import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import logoImage from '../assets/logo-dinas.png';

export default function Navbar() {
  // Mengambil informasi URL saat ini
  const location = useLocation();
  
  // Mengecek apakah pengguna sedang berada di halaman login atau register
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <AppBar position="static" sx={{ backgroundColor: '#0d47a1' }}>
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <img 
            src={logoImage} 
            alt="Logo Sulut" 
            style={{ width: '100%', maxWidth: '45px', minWidth: '35px', marginRight: '10px' }} 
          />
          <Box>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              sx={{ 
                lineHeight: 1.2, 
                fontSize: { xs: '0.8rem', sm: '1rem', md: '1.1rem' } 
              }}
            >
              DINAS KELAUTAN DAN PERIKANAN
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                letterSpacing: 1, 
                fontSize: { xs: '0.65rem', sm: '0.8rem' } 
              }}
            >
              SULAWESI UTARA
            </Typography>
          </Box>
        </Box>

        {/* Bagian Kanan: Tombol Dinamis */}
        <Button 
          component={Link} 
          // Jika di halaman auth, arahkan ke Home ('/'), jika tidak arahkan ke Login ('/login')
          to={isAuthPage ? '/' : '/login'} 
          variant="outlined" 
          color="inherit"
          size="small"
          // Tambahkan ikon panah hanya jika tombolnya adalah tombol Kembali
          startIcon={isAuthPage ? <ArrowBackIcon /> : null}
          sx={{ 
            borderColor: 'white', 
            fontWeight: 'bold',
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } 
          }}
        >
          {/* Ubah teks tombol sesuai halaman */}
          {isAuthPage ? 'Kembali' : 'Login'}
        </Button>
      </Toolbar>
    </AppBar>
  );
}