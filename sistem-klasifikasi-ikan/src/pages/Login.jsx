import { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Login() {
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Cari user berdasarkan NIP dan Password di tabel users
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('nip', nip)
        .eq('password', password)
        .single(); // Ambil 1 data yang cocok

      if (fetchError || !user) {
        throw new Error('NIP atau Password salah!');
      }

      // Jika berhasil, simpan sesi user di LocalStorage browser
      localStorage.setItem('user', JSON.stringify(user));

      // Arahkan berdasarkan Role
      if (user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'Dinas') {
        navigate('/dinas/dashboard');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
          Login Sistem
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Silakan masuk menggunakan NIP Anda.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth label="NIP" variant="outlined" margin="normal" required
            value={nip} onChange={(e) => setNip(e.target.value)}
          />
          <TextField
            fullWidth label="Password" type="password" variant="outlined" margin="normal" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" fullWidth variant="contained" color="primary" size="large" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? 'Memeriksa...' : 'Masuk'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Belum punya akun? <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>Daftar di sini</Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}