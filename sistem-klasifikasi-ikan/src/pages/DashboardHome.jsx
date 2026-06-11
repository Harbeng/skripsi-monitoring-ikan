import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, Stack 
} from '@mui/material';
import { 
  Assignment, NotificationsActive, People, History 
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend // <-- Tambahan import untuk Pie Chart
} from 'recharts';
import { supabase } from '../supabase';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalLaporan: 0,
    totalUser: 0,
    totalAlarm: 0,
    laporanHariIni: 0
  });
  const [chartData, setChartData] = useState([]);
  const [lokasiData, setLokasiData] = useState([]); // <-- State baru untuk Pie Chart
  const user = JSON.parse(localStorage.getItem('user'));

  // Warna untuk Pie Chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Ambil Total Laporan, Total User, Total Alarm
      const { count: countLaporan } = await supabase.from('laporan').select('*', { count: 'exact', head: true });
      const { count: countUser } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: countAlarm } = await supabase.from('log_alarm').select('*', { count: 'exact', head: true });

      const todayDate = new Date().toISOString().split('T')[0];
      const { count: countToday } = await supabase
        .from('laporan')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${todayDate}T00:00:00Z`);

      setStats({
        totalLaporan: countLaporan || 0,
        totalUser: countUser || 0,
        totalAlarm: countAlarm || 0,
        laporanHariIni: countToday || 0
      });

      // 2. Ambil Data untuk Grafik Tren (7 Hari Terakhir)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const { data: rawLaporan, error } = await supabase
        .from('laporan')
        .select('created_at, lokasi_alamat') // Sekalian ambil lokasi_alamat untuk Pie Chart
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // 3. Proses Grouping Data per Hari untuk Grafik Tren (Area Chart)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
        
        const count = rawLaporan.filter(item => item.created_at.startsWith(dateString)).length;
        
        last7Days.push({
          day: dayName,
          fullDate: dateString,
          jumlah: count
        });
      }
      setChartData(last7Days);

      // 4. Proses Grouping Data per Lokasi untuk Pie Chart
      // Mengambil semua data lokasi tanpa batasan 7 hari agar datanya akurat
      const { data: allLokasi } = await supabase.from('laporan').select('lokasi_alamat');
      if (allLokasi) {
        const counts = allLokasi.reduce((acc, curr) => {
          const lokasi = curr.lokasi_alamat;
          acc[lokasi] = (acc[lokasi] || 0) + 1;
          return acc;
        }, {});

        const formattedData = Object.keys(counts).map(key => ({
          name: key,
          jumlah: counts[key]
        }));
        setLokasiData(formattedData);
      }

    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    }
  };

  const statCards = [
    { title: 'Total Laporan', value: stats.totalLaporan, icon: <Assignment fontSize="large" />, color: '#1976d2' },
    { title: 'Laporan Hari Ini', value: stats.laporanHariIni, icon: <History fontSize="large" />, color: '#2e7d32' },
    { title: 'Alarm Terdeteksi', value: stats.totalAlarm, icon: <NotificationsActive fontSize="large" />, color: '#d32f2f' },
    { title: 'Total Pengguna', value: stats.totalUser, icon: <People fontSize="large" />, color: '#ed6c02' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Ringkasan Sistem
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Selamat datang kembali, <strong>{user?.nama_lengkap}</strong>. Berikut adalah ringkasan data pemantauan kualitas ikan.
      </Typography>

      {/* Baris Kartu Statistik */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card elevation={3} sx={{ borderLeft: `6px solid ${card.color}`, borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, opacity: 0.8 }}>
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Baris Grafik */}
      <Grid container spacing={3}>
        
        {/* KOLOM KIRI: Grafik Tren Area (Lebar 8) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tren Laporan Ikan Tidak Layak (Minggu Ini)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorJumlah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="jumlah" 
                  stroke="#1976d2" 
                  fillOpacity={1} 
                  fill="url(#colorJumlah)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* KOLOM KANAN: Grafik Lingkaran Distribusi Lokasi (Lebar 4) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
              Distribusi Lokasi Laporan
            </Typography>
            <Box sx={{ width: '100%', flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lokasiData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90} // Ukuran radius yang pas untuk layout sempit
                    fill="#8884d8"
                    dataKey="jumlah"
                  >
                    {lokasiData.map((entry, index) => (
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