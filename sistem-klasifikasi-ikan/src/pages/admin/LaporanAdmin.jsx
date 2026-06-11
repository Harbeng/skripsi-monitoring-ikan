import { useState, useEffect } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Box,
  TextField, MenuItem, IconButton, Tooltip, Button, Grid, InputAdornment,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle // <-- Import komponen Dialog
} from '@mui/material';
import { Delete, Search, FilterAlt, RestartAlt, WarningAmber } from '@mui/icons-material'; // Tambah icon warning
import { supabase } from '../../supabase';
import toast from 'react-hot-toast'; 

export default function LaporanAdmin() {
  const [laporan, setLaporan] = useState([]);
  const [filter, setFilter] = useState({ tanggal: '', lokasi: '', status: 'Semua' });
  
  // State untuk mengontrol Dialog Konfirmasi Hapus
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

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
      toast.error('Gagal mengambil data laporan dari server.');
    }
  };

  // Fungsi untuk membuka dialog dan menyimpan ID laporan yang dipilih
  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  // Fungsi untuk menutup dialog tanpa menghapus
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedId(null);
  };

  // Fungsi yang benar-benar melakukan penghapusan
  const confirmDelete = async () => {
    // Tutup dialog terlebih dahulu
    setOpenDialog(false);
    
    if (selectedId) {
      const deleteToast = toast.loading('Menghapus laporan...'); 
      
      const { error } = await supabase.from('laporan').delete().eq('id_laporan', selectedId);
      
      if (!error) {
        fetchLaporan();
        toast.success('Laporan berhasil dihapus permanen!', { id: deleteToast }); 
      } else {
        toast.error('Gagal menghapus laporan.', { id: deleteToast }); 
      }
      setSelectedId(null);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Selesai') return 'success';
    if (status === 'Diproses') return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Daftar Laporan Masyarakat (Admin)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Pantau dan kelola seluruh laporan hasil deteksi kualitas ikan dari masyarakat.
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
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell fontWeight="bold">Waktu</TableCell>
              <TableCell fontWeight="bold">Ikan</TableCell>
              <TableCell fontWeight="bold">Lokasi</TableCell>
              <TableCell fontWeight="bold" sx={{ minWidth: 200 }}>Keterangan</TableCell> 
              <TableCell fontWeight="bold">Status</TableCell>
              <TableCell fontWeight="bold" align="center">Aksi</TableCell>
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
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.keterangan ? row.keterangan : '-'}
                  </Typography>
                </TableCell>
                <TableCell><Chip label={row.status_penanganan} color={getStatusColor(row.status_penanganan)} size="small" sx={{ fontWeight: 'bold' }} /></TableCell>
                <TableCell align="center">
                  <Tooltip title="Hapus Laporan">
                    {/* Ubah onClick untuk memanggil handleDeleteClick */}
                    <IconButton color="error" onClick={() => handleDeleteClick(row.id_laporan)}><Delete /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {laporan.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Tidak ada data laporan yang cocok dengan filter.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- DIALOG KONFIRMASI HAPUS (Gaya MUI) --- */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          style: { borderRadius: 12, padding: '8px' } // Sedikit sentuhan gaya membulat
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#d32f2f', fontWeight: 'bold' }}>
          <WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus laporan ini? 
            Tindakan ini <b>permanen</b> dan data tidak dapat dikembalikan.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>
            Batal
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus sx={{ borderRadius: 2 }}>
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}