import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip 
} from '@mui/material';
import { Search, FilterAlt, RestartAlt } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

export default function NotifikasiAlarmDinas() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ tanggal: '', lokasi: '' });

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    let query = supabase.from('log_alarm').select('*').order('waktu_kejadian', { ascending: false });

    if (filter.tanggal) {
      query = query.gte('waktu_kejadian', `${filter.tanggal}T00:00:00Z`).lte('waktu_kejadian', `${filter.tanggal}T23:59:59Z`);
    }
    if (filter.lokasi) {
      query = query.ilike('lokasi_kejadian', `%${filter.lokasi}%`);
    }

    const { data, error } = await query;
      
    if (!error && data) {
      setLogs(data);
    } else {
      toast.error('Gagal mengambil riwayat alarm dari server.');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Riwayat Alarm Peringatan Dini</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Pantau riwayat aktivasi perangkat IoT (Sirine/LED) dan status pengiriman pesan darurat WhatsApp.
      </Typography>

      {/* Bagian Filter */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
          <FilterAlt fontSize="small" sx={{ mr: 1 }} /> Filter & Pencarian Riwayat Alarm
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Tanggal Kejadian" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth
              value={filter.tanggal} onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })} 
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField label="Cari Lokasi Penemuan..." size="small" fullWidth
              value={filter.lokasi} onChange={(e) => setFilter({ ...filter, lokasi: e.target.value })}
              sx={{ bgcolor: 'white' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" color="inherit" fullWidth startIcon={<RestartAlt />}
              onClick={() => setFilter({ tanggal: '', lokasi: '' })}
              sx={{ height: '40px' }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
              <TableRow>
                <TableCell fontWeight="bold">Waktu Kejadian</TableCell>
                <TableCell fontWeight="bold">Lokasi Penemuan</TableCell>
                <TableCell align="center" fontWeight="bold">Jumlah Kasus</TableCell>
                <TableCell fontWeight="bold">Status WhatsApp Gateway</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id_log} hover>
                  <TableCell>{new Date(log.waktu_kejadian).toLocaleString('id-ID')}</TableCell>
                  <TableCell fontWeight="medium">{log.lokasi_kejadian}</TableCell>
                  <TableCell align="center">
                    <Chip label={log.jumlah_laporan_terkait} color="error" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.status_wa || 'Terkirim'} 
                      color={log.status_wa?.includes('Gagal') ? 'error' : 'success'} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {filter.tanggal || filter.lokasi 
                      ? "Tidak ada data riwayat alarm yang cocok dengan pencarian Anda." 
                      : "Belum ada riwayat alarm tercatat. Sistem dalam keadaan aman."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}