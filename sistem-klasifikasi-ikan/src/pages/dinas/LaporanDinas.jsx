import { useState, useEffect } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, MenuItem, Select, Box,
  TextField, Button, Grid, InputAdornment
} from '@mui/material';
import { Search, FilterAlt, RestartAlt } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast'; // <-- Import Toast

export default function LaporanDinas() {
  const [laporan, setLaporan] = useState([]);
  const [filter, setFilter] = useState({ tanggal: '', lokasi: '', status: 'Semua' });

  useEffect(() => {
    fetchLaporan();
  }, [filter]);

  const fetchLaporan = async () => {
    let query = supabase.from('laporan').select('*').order('created_at', { ascending: false });

    if (filter.tanggal) query = query.gte('created_at', `${filter.tanggal}T00:00:00Z`).lte('created_at', `${filter.tanggal}T23:59:59Z`);
    if (filter.lokasi) query = query.ilike('lokasi_alamat', `%${filter.lokasi}%`);
    if (filter.status !== 'Semua') query = query.eq('status_penanganan', filter.status);

    const { data, error } = await query;
    if (!error) {
      setLaporan(data);
    } else {
      toast.error('Gagal memuat data laporan terbaru.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const updateToast = toast.loading('Memperbarui status...'); // Toast Loading

    const { error } = await supabase.from('laporan').update({ status_penanganan: newStatus }).eq('id_laporan', id);
    
    if (!error) {
      fetchLaporan();
      toast.success(`Status diperbarui menjadi: ${newStatus}`, { id: updateToast }); // Ubah jadi Sukses
    } else {
      toast.error('Terjadi kesalahan saat memperbarui status.', { id: updateToast }); // Ubah jadi Error
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Selesai') return '#2e7d32';
    if (status === 'Diproses') return '#ed6c02';
    return '#d32f2f';
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Tindak Lanjut Laporan (Dinas)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Pilih laporan dan perbarui status penanganannya agar masyarakat mengetahui prosesnya.
      </Typography>
      
      {/* Bagian Filter */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
          <FilterAlt fontSize="small" sx={{ mr: 1 }} /> Filter & Pencarian Laporan
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Tanggal Laporan" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth
              value={filter.tanggal} onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })} 
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Cari Lokasi / Pasar" placeholder="Ketik lokasi..." size="small" fullWidth
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Status Penanganan" size="small" fullWidth
              value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="Semua">Semua Status</MenuItem>
              <MenuItem value="Menunggu">Menunggu</MenuItem>
              <MenuItem value="Diproses">Diproses</MenuItem>
              <MenuItem value="Selesai">Selesai</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button 
              variant="outlined" 
              color="inherit" 
              fullWidth 
              startIcon={<RestartAlt />}
              onClick={() => setFilter({ tanggal: '', lokasi: '', status: 'Semua' })}
              sx={{ height: '40px' }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
            <TableRow>
              <TableCell fontWeight="bold">Waktu</TableCell>
              <TableCell fontWeight="bold">Ikan</TableCell>
              <TableCell fontWeight="bold">Lokasi</TableCell>
              {/* Tambah Kolom Keterangan */}
              <TableCell fontWeight="bold" sx={{ minWidth: 200 }}>Keterangan Warga</TableCell>
              <TableCell fontWeight="bold">Update Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {laporan.map((row) => (
              <TableRow key={row.id_laporan} hover>
                <TableCell>{new Date(row.created_at).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <img src={row.foto_ikan} alt="Ikan" style={{ width: 60, borderRadius: 4, objectFit: 'cover' }} />
                  <Typography variant="caption" display="block" fontWeight="medium">{row.jenis_ikan}</Typography>
                </TableCell>
                <TableCell>{row.lokasi_alamat}</TableCell>
                {/* Tampilkan Isi Keterangan */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.keterangan ? row.keterangan : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.status_penanganan}
                    onChange={(e) => handleUpdateStatus(row.id_laporan, e.target.value)}
                    size="small"
                    sx={{ 
                      minWidth: 140, 
                      backgroundColor: 'white',
                      color: getStatusColor(row.status_penanganan),
                      fontWeight: 'bold',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: getStatusColor(row.status_penanganan) }
                    }}
                  >
                    <MenuItem value="Menunggu" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Menunggu</MenuItem>
                    <MenuItem value="Diproses" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>Diproses</MenuItem>
                    <MenuItem value="Selesai" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>Selesai</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {laporan.length === 0 && (
              <TableRow>
                {/* Ubah colSpan jadi 5 karena tambah 1 kolom */}
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Tidak ada data laporan yang cocok dengan filter.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}