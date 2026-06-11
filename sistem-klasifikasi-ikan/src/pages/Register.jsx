import { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, MenuItem, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip: '',
    password: '',
    role: 'Dinas' // Default pilihan
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Cek apakah NIP sudah terdaftar
      const { data: existingUser } = await supabase
        .from('users')
        .select('nip')
        .eq('nip', formData.nip)
        .single();

      if (existingUser) {
        throw new Error('NIP ini sudah terdaftar!');
      }

      // Masukkan data ke tabel users
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip,
            password: formData.password, // Catatan: Untuk prototipe disimpan langsung
            role: formData.role
          }
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000); // Pindah ke login setelah 2 detik
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
          Daftar Akun Baru
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Registrasi berhasil! Mengalihkan ke halaman Login...</Alert>}

        <form onSubmit={handleRegister}>
          <TextField
            fullWidth label="Nama Lengkap" name="nama_lengkap" variant="outlined" margin="normal"
            required value={formData.nama_lengkap} onChange={handleChange}
          />
          <TextField
            fullWidth label="NIP" name="nip" variant="outlined" margin="normal"
            required value={formData.nip} onChange={handleChange}
          />
          <TextField
            fullWidth label="Password" name="password" type="password" variant="outlined" margin="normal"
            required value={formData.password} onChange={handleChange}
          />
          <TextField
            fullWidth select label="Role / Peran" name="role" variant="outlined" margin="normal"
            value={formData.role} onChange={handleChange}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Dinas">Dinas</MenuItem>
          </TextField>

          <Button type="submit" fullWidth variant="contained" color="primary" size="large" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Sudah punya akun? <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>Login di sini</Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}