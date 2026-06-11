import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Stack, DialogContentText 
} from '@mui/material';
import { Edit, Delete, PersonAdd, WarningAmber } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast'; // <-- Import Toast

export default function ManajemenUser() {
  const [users, setUsers] = useState([]);
  
  // State untuk form Tambah/Edit
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip: '',
    password: '',
    role: 'Dinas'
  });

  // State khusus untuk Dialog Konfirmasi Hapus
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error) {
      setUsers(data);
    } else {
      toast.error('Gagal mengambil data user.');
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditMode(true);
      setSelectedId(user.id_user);
      setFormData({
        nama_lengkap: user.nama_lengkap,
        nip: user.nip,
        password: user.password,
        role: user.role
      });
    } else {
      setEditMode(false);
      setFormData({ nama_lengkap: '', nip: '', password: '', role: 'Dinas' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Toast Loading saat submit
    const submitToast = toast.loading(editMode ? 'Menyimpan perubahan...' : 'Menambahkan user baru...');

    if (editMode) {
      const { error } = await supabase
        .from('users')
        .update(formData)
        .eq('id_user', selectedId);
        
      if (error) {
        toast.error(`Gagal: ${error.message}`, { id: submitToast });
      } else {
        toast.success('Data user berhasil diperbarui!', { id: submitToast });
        fetchUsers(); 
        handleClose();
      }
    } else {
      const { error } = await supabase.from('users').insert([formData]);
      
      if (error) {
        toast.error(`Gagal: ${error.message}`, { id: submitToast });
      } else {
        toast.success('User baru berhasil ditambahkan!', { id: submitToast });
        fetchUsers(); 
        handleClose();
      }
    }
  };

  // --- Fungsi untuk mengontrol Pop-up Hapus ---
  const handleOpenDelete = (id) => {
    setUserToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    setOpenDeleteDialog(false); // Tutup dialog dulu
    
    if (userToDelete) {
      const deleteToast = toast.loading('Menghapus user...');
      const { error } = await supabase.from('users').delete().eq('id_user', userToDelete);
      
      if (!error) {
        toast.success('User berhasil dihapus!', { id: deleteToast });
        fetchUsers();
      } else {
        toast.error('Gagal menghapus user.', { id: deleteToast });
      }
      setUserToDelete(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Manajemen User</Typography>
          <Typography variant="body2" color="text.secondary">Kelola data akun Admin dan Dinas.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={() => handleOpen()}
          sx={{ backgroundColor: '#1976d2' }}
        >
          Tambah User
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell fontWeight="bold">Nama Lengkap</TableCell>
              <TableCell fontWeight="bold">NIP</TableCell>
              <TableCell fontWeight="bold">Role</TableCell>
              <TableCell fontWeight="bold" align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id_user} hover>
                <TableCell>{user.nama_lengkap}</TableCell>
                <TableCell>{user.nip}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color={user.role === 'Admin' ? 'primary' : 'secondary'}>
                    {user.role}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(user)}><Edit /></IconButton>
                  {/* Ubah onClick untuk membuka Dialog Konfirmasi */}
                  <IconButton color="error" onClick={() => handleOpenDelete(user.id_user)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Belum ada data user.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- DIALOG FORM TAMBAH/EDIT --- */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ style: { borderRadius: 12 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editMode ? 'Edit Data User' : 'Tambah User Baru'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <TextField
              fullWidth label="Nama Lengkap" margin="dense" required
              value={formData.nama_lengkap}
              onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
            />
            <TextField
              fullWidth label="NIP" margin="dense" required
              value={formData.nip}
              onChange={(e) => setFormData({...formData, nip: e.target.value})}
            />
            <TextField
              fullWidth label="Password" type="password" margin="dense" required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <TextField
              fullWidth select label="Role" margin="dense"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Dinas">Dinas</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 'bold' }}>Batal</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- DIALOG KONFIRMASI HAPUS (Gaya MUI) --- */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        PaperProps={{ style: { borderRadius: 12, padding: '8px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#d32f2f', fontWeight: 'bold' }}>
          <WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus user ini? 
            Mereka tidak akan bisa lagi mengakses sistem setelah dihapus.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>
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