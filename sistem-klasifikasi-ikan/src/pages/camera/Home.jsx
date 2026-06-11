import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ClassificationForm from './ClassificationForm';

export default function Home() {
  return (
    <Box sx={{ bgcolor: '#f0f4f8', minHeight: '100vh', pb: 5 }}>
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#0d47a1', color: 'white', py: { xs: 6, md: 10 }, textAlign: 'center', mb: 4 }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
            Pastikan Ikan Anda Segar & Layak
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 'normal' }}>
            Teknologi AI untuk memantau kualitas konsumsi ikan masyarakat Sulawesi Utara secara real-time.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Kolom Kiri: Instruksi */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1, color: '#0d47a1' }} /> Cara Penggunaan
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                'Ambil foto ikan secara jelas (fokus pada mata/insang).',
                'Klik tombol "Cek Kualitas" untuk klasifikasi AI.',
                'Lihat hasil kelayakan secara instan.',
                'Laporkan jika menemukan ikan tidak layak di pasar.'
              ].map((text, i) => (
                <Paper key={i} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'flex-start', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mr: 2, color: '#0d47a1', fontWeight: 'bold' }}>{i + 1}</Typography>
                  <Typography variant="body2">{text}</Typography>
                </Paper>
              ))}
            </Box>
          </Grid>

          {/* Kolom Kanan: Fitur Utama (Dipanggil dari komponen terpisah) */}
          <Grid item xs={12} md={8}>
            <ClassificationForm />
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ mt: 10, py: 4, textAlign: 'center', borderTop: '1px solid #ddd' }}>
        <Typography variant="body2" color="text.secondary">
          © 2026 Dinas Perikanan Sulawesi Utara.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dikembangkan oleh Harry Rudolf Kountur dan Devin Ferdinan Pitoy.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Politeknik Negeri Manado
        </Typography>
      </Box>
    </Box>
  );
}