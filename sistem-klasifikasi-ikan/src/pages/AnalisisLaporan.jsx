import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../supabase'; 

export default function AnalisisLaporan() {
  const [dataStatistik, setDataStatistik] = useState([]);
  const [totalLaporan, setTotalLaporan] = useState(0);

  useEffect(() => {
    fetchStatistik();
  }, []);

  const fetchStatistik = async () => {
    // Mengambil data laporan untuk dihitung statistiknya
    const { data, error } = await supabase.from('laporan').select('lokasi_alamat');

    if (!error && data) {
      setTotalLaporan(data.length);

      // Mengelompokkan data berdasarkan lokasi
      const counts = data.reduce((acc, curr) => {
        const lokasi = curr.lokasi_alamat;
        acc[lokasi] = (acc[lokasi] || 0) + 1;
        return acc;
      }, {});

      // Mengubah format data agar bisa dibaca oleh Recharts
      const formattedData = Object.keys(counts).map(key => ({
        name: key,
        jumlah: counts[key]
      }));

      setDataStatistik(formattedData);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analisis & Statistik Laporan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visualisasi data laporan ikan tidak layak konsumsi berdasarkan wilayah.
      </Typography>

      {/* Gunakan Grid size (MUI v6 style) untuk menghilangkan warning di console */}
      <Grid container spacing={3}>
        
        {/* Kolom 1: Ringkasan Angka (Kiri) */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: '#1976d2', color: 'white', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Total Laporan Masuk</Typography>
              <Typography variant="h1" fontWeight="bold" sx={{ my: 2 }}>{totalLaporan}</Typography>
              <Typography variant="body2">Laporan dari seluruh wilayah</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Kolom 2: Grafik Batang (Tengah) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom align="center">Grafik Batang Wilayah</Typography>
            <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataStatistik}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f5f5f5' }} />
                  <Bar dataKey="jumlah" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Kolom 3: Grafik Lingkaran (Kanan) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom align="center">Distribusi Lokasi Laporan</Typography>
            <Box sx={{ width: '100%', flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataStatistik}
                    cx="50%" // Titik pusat X
                    cy="50%" // Titik pusat Y
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100} // Radius diperkecil agar tidak menabrak dinding kotak
                    fill="#8884d8"
                    dataKey="jumlah"
                  >
                    {dataStatistik.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}