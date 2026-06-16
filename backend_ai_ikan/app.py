import os
import io
import numpy as np
import gc
import keras
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array

# ==============================================================================
# PATCHING KERAS UNTUK KOMPATIBILITAS (Mencegah error 'quantization_config')
# ==============================================================================
old_dense_init = keras.layers.Dense.__init__
def patched_dense_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None)
    old_dense_init(self, *args, **kwargs)
keras.layers.Dense.__init__ = patched_dense_init
# ==============================================================================

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join('models', 'model_ikan.h5')
TARGET_SIZE = (224, 224)
CLASS_LABELS = [
    "Malalugis Busuk", "Malalugis Kurang Segar", "Malalugis Segar",
    "Mujair Busuk", "Mujair Kurang Segar", "Mujair Segar",
    "Tude Busuk", "Tude Kurang Segar", "Tude Segar"
]

# Variabel global untuk model
model = None

def get_model():
    """Memuat model secara Lazy Loading (hanya saat dibutuhkan)"""
    global model
    if model is None:
        try:
            print("[INFO] Memuat model AI ke memori...")
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        except Exception as e:
            print(f"[ERROR] Gagal memuat model: {e}")
            return None
    return model

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(TARGET_SIZE)
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    return preprocess_input(img_array)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Tidak ada file gambar.'}), 400
    
    file = request.files['file']
    try:
        loaded_model = get_model()
        if loaded_model is None:
            return jsonify({'success': False, 'message': 'Model tidak tersedia.'}), 500

        image_bytes = file.read()
        processed_image = preprocess_image(image_bytes)
        
        predictions = loaded_model.predict(processed_image)
        best_index = np.argmax(predictions[0])
        confidence = float(predictions[0][best_index])
        
        predicted_label = CLASS_LABELS[best_index]
        jenis, status = predicted_label.split(" ", 1)
        
        # Bersihkan memori secara eksplisit setelah prediksi
        gc.collect() 

        return jsonify({
            'success': True,
            'hasil_klasifikasi': predicted_label,
            'jenis_ikan': jenis,
            'status': status,
            'layak_konsumsi': status == "Segar",
            'confidence': f"{confidence * 100:.2f}%"
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    # Saat di Railway/Server, gunicorn akan memanggil app, 
    # blok ini hanya untuk testing lokal.
    app.run(host='0.0.0.0', port=5000)
