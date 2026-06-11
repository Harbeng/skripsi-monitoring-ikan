//JaringanWifi.jsx:
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, CircularProgress, 
  TextField, Alert, Chip, LinearProgress, Stack, Tooltip, Grid,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Fade, Paper, Divider
} from '@mui/material';
import { 
  Wifi as WifiIcon, 
  WifiOff as WifiOffIcon, 
  CheckCircle as CheckCircleIcon,
  Sensors as SensorsIcon,
  Lock as LockIcon
} from '@mui/icons-material';

// Ganti path ini sesuai dengan file konfigurasi Supabase Anda
import { supabase } from '../../supabase';

const DEVICE_ID = 'ESP32-SIDAK-01'; // Harus sama dengan di database & ESP32

export default function WifiManager() {
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [password, setPassword] = useState('');
  const [deviceStatus, setDeviceStatus] = useState('Mengecek...');
  const [connectionMessage, setConnectionMessage] = useState(null);

  // Mengambil status alat dan hasil scan dari Supabase
  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('iot_config')
      .select('*')
      .eq('device_id', DEVICE_ID)
      .single();

    if (data) {
      setDeviceStatus(data.connection_status);
      setNetworks(data.scan_results || []);
      
      // Jika command sudah kembali ke IDLE, berarti scan selesai
      if (data.command === 'IDLE' && isScanning) {
        setIsScanning(false);
      }
    }
  };

  // Cek status secara berkala tiap 3 detik
  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 3000);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Fungsi menekan tombol SCAN
  const handleScanClick = async () => {
    setIsScanning(true);
    setConnectionMessage(null); 
    setNetworks([]); 
    setSelectedSsid(''); 
    await supabase
      .from('iot_config')
      .update({ command: 'SCAN', scan_results: [] })
      .eq('device_id', DEVICE_ID);
  };

  // Fungsi menekan tombol HUBUNGKAN
  const handleConnectClick = async () => {
    if (!selectedSsid || !password) return;
    
    setConnectionMessage('Mengirim perintah koneksi ke ESP32...');
    setDeviceStatus('MENYAMBUNGKAN...');
    await supabase
      .from('iot_config')
      .update({ 
        command: 'CONNECT', 
        target_ssid: selectedSsid, 
        target_pass: password,
        connection_status: 'MENYAMBUNGKAN...'
      })
      .eq('device_id', DEVICE_ID);
      
    setPassword(''); 
  };

  // Helper Styling
  const isConnected = deviceStatus === 'BERHASIL TERHUBUNG';
  const isConnecting = deviceStatus === 'MENYAMBUNGKAN...';

  // Helper: Visual Sinyal WiFi Modern
  const renderSignalBars = (rssi) => {
    let bars = 1;
    if (rssi >= -60) bars = 4;
    else if (rssi >= -70) bars = 3;
    else if (rssi >= -80) bars = 2;

    return (
      <Tooltip title={`Sinyal: ${rssi} dBm`} placement="top">
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 20, gap: 0.5 }}>
          {[1, 2, 3, 4].map((bar) => (
            <Box 
              key={bar} 
              sx={{ 
                width: 4, 
                height: bar * 5, 
                backgroundColor: bar <= bars ? '#1976d2' : '#e0e0e0',
                borderRadius: 1
              }} 
            />
          ))}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Jaringan & Konektivitas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Kelola sambungan WiFi untuk perangkat IoT Detektor secara nirkabel (Over-The-Air).
        </Typography>
      </Box>

      {/* FULL LAYOUT GRID */}
      <Grid container spacing={4}>
        
        {/* KOLOM KIRI: STATUS & KONTROL UTAMA */}
        <Grid item xs={12} md={5} lg={4}>
          <Stack spacing={3}>
            
            {/* Card Status */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {isConnecting && <LinearProgress color="warning" />}
              <CardContent sx={{ p: 4 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                  Status Modul ({DEVICE_ID})
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: '50%', 
                    backgroundColor: isConnected ? '#dcfce7' : (isConnecting ? '#fef08a' : '#f1f5f9'),
                    color: isConnected ? '#16a34a' : (isConnecting ? '#ca8a04' : '#64748b')
                  }}>
                    {isConnected ? <CheckCircleIcon fontSize="large" /> : (isConnecting ? <SensorsIcon fontSize="large" /> : <WifiOffIcon fontSize="large" />)}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {deviceStatus}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Respon Terakhir: Saat ini
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Card Tombol Scan */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <SensorsIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Pemindaian Radar
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Perintahkan ESP32 untuk memindai jaringan WiFi yang tersedia di sekitarnya.
                </Typography>
                
                <Button 
                  fullWidth
                  variant="contained" 
                  size="large"
                  disableElevation
                  startIcon={isScanning ? <CircularProgress size={20} color="inherit" /> : <WifiIcon />}
                  onClick={handleScanClick}
                  disabled={isScanning}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    backgroundColor: '#2563eb',
                    '&:hover': { backgroundColor: '#1d4ed8' }
                  }}
                >
                  {isScanning ? 'Proses Memindai...' : 'Mulai Pindai WiFi'}
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* KOLOM KANAN: HASIL SCAN & FORM KONEKSI */}
        <Grid item xs={12} md={7} lg={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ p: 0 }}> {/* Padding 0 agar List menempel ke tepi */}
              
              <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Jaringan Tersedia
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {networks.length > 0 ? `Ditemukan ${networks.length} jaringan.` : 'Klik tombol pindai di panel kiri untuk mencari jaringan.'}
                </Typography>
              </Box>

              {/* Tampilan Sedang Scan */}
              {isScanning && (
                <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={50} thickness={4} />
                  <Typography variant="body1" color="text.secondary">
                    ESP32 sedang mencari sinyal, mohon tunggu...
                  </Typography>
                </Box>
              )}

              {/* Daftar WiFi ala Modern Desktop OS */}
              {!isScanning && networks.length > 0 && (
                <Fade in={!isScanning}>
                  <Box>
                    <List sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      {networks.map((net, index) => (
                        <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                          <ListItemButton 
                            selected={selectedSsid === net.ssid}
                            onClick={() => setSelectedSsid(net.ssid)}
                            sx={{ 
                              borderRadius: 2, 
                              border: '1px solid',
                              borderColor: selectedSsid === net.ssid ? '#3b82f6' : '#f1f5f9',
                              backgroundColor: selectedSsid === net.ssid ? '#eff6ff' : 'transparent',
                              '&:hover': { backgroundColor: '#f8fafc' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <ListItemIcon>
                              {renderSignalBars(net.rssi)}
                            </ListItemIcon>
                            <ListItemText 
                              primary={net.ssid} 
                              primaryTypographyProps={{ fontWeight: selectedSsid === net.ssid ? 700 : 500 }}
                            />
                            {selectedSsid === net.ssid && (
                              <Chip size="small" label="Terpilih" color="primary" sx={{ fontWeight: 600 }} />
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>

                    {/* Area Form Password (Muncul hanya jika WiFi dipilih) */}
                    {selectedSsid && (
                      <Fade in={Boolean(selectedSsid)}>
                        <Paper elevation={0} sx={{ p: 4, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#334155' }}>
                            Otentikasi untuk "{selectedSsid}"
                          </Typography>
                          
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Masukkan Password WiFi"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                  startAdornment: <LockIcon sx={{ color: 'action.active', mr: 1 }} />,
                                  sx: { borderRadius: 3, backgroundColor: '#ffffff' }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Button 
                                fullWidth 
                                variant="contained" 
                                color="success"
                                size="large"
                                onClick={handleConnectClick}
                                disabled={!password || isConnecting}
                                disableElevation
                                sx={{ borderRadius: 3, py: 1.8, fontWeight: 700, textTransform: 'none' }}
                              >
                                Hubungkan
                              </Button>
                            </Grid>
                          </Grid>

                          {connectionMessage && (
                            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                              {connectionMessage}
                            </Alert>
                          )}
                        </Paper>
                      </Fade>
                    )}
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}