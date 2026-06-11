import { useState, useRef, useEffect } from 'react';
import { 
  Button, Typography, Box, Paper, TextField, 
  CircularProgress, Alert, Chip, Stack, IconButton 
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast'; 

export default function ClassificationForm() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState(null); 
  const [jenisIkan, setJenisIkan] = useState(null); 
  const [confidence, setConfidence] = useState(null); 
  const [layakKonsumsi, setLayakKonsumsi] = useState(null); 
  
  // State Kamera & Lokasi GPS
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [koordinat, setKoordinat] = useState({ lat: null, lng: null });
  const [loadingLokasi, setLoadingLokasi] = useState(false);

  const [lokasi, setLokasi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const videoRef = useRef(null);

  // Jalankan pelacakan GPS otomatis saat halaman dibuka pertama kali
  useEffect(() => {
    ambilLokasiOtomatis();
    return () => matikanKamera();
  }, []);

  // ==========================================
  // REAL-TIME GPS GEOLOCATION LOGIC
  // ==========================================
  const ambilLokasiOtomatis = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung fitur deteksi GPS.");
      return;
    }

    setLoadingLokasi(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setKoordinat({ lat: latitude, lng: longitude });
        setLokasi(`Titik Koordinat: ${latitude}, ${longitude}`);
        setLoadingLokasi(false);
        toast.success("Lokasi GPS berhasil dikunci!", { position: 'bottom-right' });
      },
      (error) => {
        console.error("Error mengambil GPS:", error);
        setLoadingLokasi(false);
        toast.error("Gagal mendeteksi lokasi otomatis. Aktifkan GPS Anda.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ==========================================
  // REAL-TIME CAMERA PREVIEW & CAPTURE LOGIC
  // ==========================================
  const nyalakanKamera = async () => {
    setResult(null);
    setPreview(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Gagal membuka hardware kamera:", err);
      toast.error("Akses kamera ditolak. Silakan periksa pengaturan izin browser.");
    }
  };

  const matikanKamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const ambilFotoDariStream = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const fileFoto = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImage(fileFoto);
        setPreview(URL.createObjectURL(fileFoto));
        matikanKamera();
        toast.success("Foto ikan berhasil ditangkap!");
      }
    }, 'image/jpeg');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      matikanKamera();
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null); 
      setJenisIkan(null);
      setConfidence(null);
      setLayakKonsumsi(null);
      setSubmitStatus(null);
      toast.success('Foto dari file lokal berhasil dimuat!');
    }
  };

  // ==========================================
  // API INTEGRATION WITH PYTHON FLASK
  // ==========================================
  const handleClassify = async () => {
    if (!image) return;
    
    setIsClassifying(true);
    const loadingToast = toast.loading('AI sedang menganalisis foto ikan secara visual...');

    try {
      const formData = new FormData();
      formData.append('file', image); 

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Gagal terhubung ke server AI');
      const data = await response.json();

      if (data.success) {
        setResult(data.status); 
        setJenisIkan(data.jenis_ikan); 
        setConfidence(data.confidence); 
        setLayakKonsumsi(data.layak_konsumsi); 

        toast.dismiss(loadingToast);

        if (data.layak_konsumsi) {
          toast.success(`Selesai! Ikan ${data.jenis_ikan} ini masih Segar (${data.confidence}).`, { duration: 4000 });
        } else {
          toast.error(`Awas! Ikan ${data.jenis_ikan} terdeteksi ${data.status.toUpperCase()} (${data.confidence}).`, { duration: 4000 });
        }
      } else {
        throw new Error(data.message || 'Gagal memproses klasifikasi gambar.');
      }

    } catch (error) {
      console.error('Error Klasifikasi:', error);
      toast.dismiss(loadingToast);
      toast.error('Gagal menganalisis! Pastikan Server AI (Python) sudah berjalan.', { duration: 5000 });
    } finally {
      setIsClassifying(false);
    }
  };

  // ==========================================
  // AUTOMATION IOT SYSTEM & WHATSAPP GATEWAY
  // ==========================================
  const triggerAlarmDini = async (lokasiKejadian, jumlahLaporan) => {
    try {
      let statusWa = 'Gagal (Nomor tidak ada)';
      const { data: daftarPenerima } = await supabase
        .from('pengaturan_notifikasi')
        .select('nomor_whatsapp')
        .eq('status_notif', true);

      if (daftarPenerima && daftarPenerima.length > 0) {
        const tokenWA = "WdQU9rfJyRpFE13HECkx"; 
        const pesan = `⚠️ *PERINGATAN DINI SISTEM* ⚠️\n\nTerdeteksi beruntun *${jumlahLaporan} laporan* ikan tidak layak konsumsi di lokasi: *${lokasiKejadian}* dalam rentang waktu kurang dari 3 jam!\n\nAlarm sirine hardware di kantor dinas telah diaktifkan secara otomatis. Mohon segera lakukan sidak lapangan.`;
        const targetNumbers = daftarPenerima.map(p => p.nomor_whatsapp).join(',');

        const formData = new FormData();
        formData.append('target', targetNumbers);
        formData.append('message', pesan);

        try {
          const waResponse = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { 'Authorization': tokenWA },
            body: formData
          });
          const waResult = await waResponse.json();
          if (waResult.status) {
            statusWa = `Terkirim ke ${daftarPenerima.length} nomor`;
            toast.success('Notifikasi peringatan WhatsApp telah dikirim ke dinas!');
          }
        } catch (fetchError) {
          statusWa = 'Gagal (Koneksi Putus)';
        }
      }

      await supabase.from('log_alarm').insert([
        {
          lokasi_kejadian: lokasiKejadian,
          jumlah_laporan_terkait: jumlahLaporan,
          status_hardware: 'Aktif (Buzzer & LED)',
          status_wa: statusWa
        }
      ]);

      toast.error(`⚠️ SIRINE ALARM DINAS AKTIF!\nTerdeteksi lonjakan ${jumlahLaporan} laporan di ${lokasiKejadian}`, {
        duration: 10000,
        style: { border: '2px solid red', padding: '16px', color: '#d32f2f', fontWeight: 'bold' },
        icon: '🚨',
      });
    } catch (error) {
      toast.error("Gagal memicu otomatisasi sistem alarm keseluruhan.");
    }
  };

  // ==========================================
  // SUBMIT REPORT WITH 3-HOUR TIMEFRAME CONSTRAINT
  // ==========================================
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const submitToast = toast.loading('Mengunggah laporan dan data koordinat GPS...');

    try {
      const fileName = `${Math.random()}.${image.name.split('.').pop()}`;
      await supabase.storage.from('foto_ikan').upload(`public/${fileName}`, image);
      const { data: { publicUrl } } = supabase.storage.from('foto_ikan').getPublicUrl(`public/${fileName}`);

      // Kirim laporan lengkap ke tabel 'laporan'
      await supabase.from('laporan').insert([{
          foto_ikan: publicUrl,
          jenis_ikan: jenisIkan,
          lokasi_alamat: lokasi,
          latitude: koordinat.lat,   
          longitude: koordinat.lng,  
          keterangan: `${keterangan} (Hasil Deteksi AI: Kualitas ${result} dengan akurasi ${confidence})`,
          status_penanganan: 'Menunggu'
      }]);

      // HITUNG MUNDUR RANGE 3 JAM DARI DETIK INI
      const batasWaktuTigaJamLalu = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      
      // Query hitung laporan pada lokasi yang mirip dalam durasi 3 jam terakhir
      const { count } = await supabase
        .from('laporan')
        .select('*', { count: 'exact', head: true })
        .ilike('lokasi_alamat', `%${lokasi}%`)
        .gte('created_at', batasWaktuTigaJamLalu);

      // Jalankan alarm dinas jika kondisi batas penumpukan laporan (>= 3) terpenuhi
      if (count >= 3) {
        await triggerAlarmDini(lokasi, count);
      } else {
        toast.success(`Laporan tercatat. Akumulasi saat ini baru: ${count}/3 laporan dalam rentang 3 jam.`);
      }

      setSubmitStatus({ type: 'success', message: 'Laporan Anda telah berhasil masuk ke sistem.' });
      setKeterangan('');
      toast.success('Laporan berhasil dikirim!', { id: submitToast });

    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Terjadi kesalahan saat memproses pengiriman laporan.' });
      toast.error('Gagal mengirim laporan!', { id: submitToast });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <>
      <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center', backgroundColor: '#ffffff' }}>
        
        {/* VIEW BOX STREAM KAMERA */}
        {isCameraOpen && (
          <Box sx={{ position: 'relative', mb: 3, bgcolor: '#000', borderRadius: '15px', overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
            <Stack direction="row" spacing={2} sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
              <Button variant="contained" color="primary" onClick={ambilFotoDariStream} sx={{ borderRadius: 5, px: 3, fontWeight: 'bold' }}>
                Ambil Foto
              </Button>
              <IconButton onClick={matikanKamera} sx={{ bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' } }}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* BOX PREVIEW GAMBAR + BADGE PERBAIKAN CHIP UTAMA */}
        {preview && !isCameraOpen && (
          <Box sx={{ position: 'relative', mb: 3 }}>
            <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '400px', borderRadius: '15px', objectFit: 'cover' }} />
            {result && (
              <Chip 
                label={`${result} (${confidence || '0%'})`} 
                color={layakKonsumsi ? 'success' : 'error'} // Perbaikan mutlak: Menghapus arrow function perusak UI
                sx={{ position: 'absolute', top: 20, right: 20, fontWeight: 'bold', px: 2, py: 2.5, fontSize: '1rem' }} 
              />
            )}
          </Box>
        )}

        {/* CONTAINER VIEW AWAL KOSONG */}
        {!preview && !isCameraOpen && (
          <Box sx={{ py: 8, border: '2px dashed #b0bec5', borderRadius: 4, mb: 3, bgcolor: '#fafafa' }}>
            <PhotoCamera sx={{ fontSize: 60, color: '#b0bec5', mb: 2 }} />
            <Typography color="text.secondary">Belum ada foto objek ikan yang diambil</Typography>
          </Box>
        )}

        {/* TOMBOL AKSI UTAMA */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" color="primary" startIcon={<PhotoCamera />} onClick={nyalakanKamera} disabled={isCameraOpen} sx={{ borderRadius: 3, px: 3 }}>
            Buka Kamera Langsung
          </Button>

          <Button variant="outlined" component="label" size="large" sx={{ borderRadius: 3, px: 3 }}>
            Pilih dari Galeri File
            <input hidden accept="image/*" type="file" onChange={handleImageChange} />
          </Button>

          {preview && !result && !isCameraOpen && (
            <Button variant="contained" color="success" size="large" onClick={handleClassify} disabled={isClassifying} sx={{ borderRadius: 3, px: 4 }}>
              {isClassifying ? <CircularProgress size={24} color="inherit" /> : 'Cek Kualitas Sekarang'}
            </Button>
          )}
        </Stack>

        {/* DISPLAY INFORMASI HASIL EVALUASI MODEL MOBILE_NET */}
        {result && (
          <Box sx={{ mt: 4, p: 3, bgcolor: layakKonsumsi ? '#e8f5e9' : '#ffebee', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color={layakKonsumsi ? 'green' : 'red'}>
              Jenis Ikan: {jenisIkan} ({result})
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {layakKonsumsi 
                ? `Ikan ini terdeteksi memiliki struktur fisik yang SEGAR dengan validitas ${confidence} dan layak dipasarkan.` 
                : `Peringatan: Ikan ini teridentifikasi ${result.toUpperCase()} dengan tingkat kepastian ${confidence}. Bahaya amonia tinggi, harap laporkan.`}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* VIEW PANEL FORM DENGAN AUTOMATIC GPS LOCK RADAR TRACKER */}
      {result && !layakKonsumsi && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#d32f2f' }}>Form Pelaporan Dinas</Typography>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
            {submitStatus && <Alert severity={submitStatus.type} sx={{ mb: 3 }}>{submitStatus.message}</Alert>}
            <form onSubmit={handleSubmitReport}>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField fullWidth label="Lokasi/Nama Pasar" variant="filled" margin="normal" required value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
                <IconButton onClick={ambilLokasiOtomatis} disabled={loadingLokasi} sx={{ mt: 1, bgcolor: '#f1f5f9', p: 2 }}>
                  {loadingLokasi ? <CircularProgress size={24} /> : <MyLocationIcon color="primary" />}
                </IconButton>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5, mb: 1, ml: 1 }}>
                {koordinat.lat ? `Koordinat Satelit Terkunci: ${koordinat.lat}, ${koordinat.lng}` : "GPS Siap. Klik ikon radar di kanan input untuk melacak posisi Anda."}
              </Typography>

              <TextField fullWidth label="Detail Keterangan" variant="filled" margin="normal" multiline rows={3} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
              
              <Button type="submit" variant="contained" color="error" fullWidth size="large" startIcon={<SendIcon />} sx={{ mt: 3, py: 1.5, borderRadius: 3 }} disabled={isSubmitting}>
                {isSubmitting ? 'Memproses Laporan & Enkripsi GPS...' : 'Kirim Laporan Resmi'}
              </Button>
            </form>
          </Paper>
        </Box>
      )}
    </>
  );
}