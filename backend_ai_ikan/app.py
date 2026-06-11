import os
import io
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# ==============================================================================
# SKRIP ANTI-ERROR CONFIGURATION (MONKEY PATCH)
# Berfungsi menghapus otomatis 'quantization_config' yang memicu crash pada Keras
# ==============================================================================
import keras
old_dense_init = keras.layers.Dense.__init__
def patched_dense_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None) # Hapus argumen perusak secara paksa
    old_dense_init(self, *args, **kwargs)
keras.layers.Dense.__init__ = patched_dense_init
# ==============================================================================

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join('models', 'model_ikan.h5')
TARGET_SIZE = (224, 224)

CLASS_LABELS = [
    "Malalugis Busuk", 
    "Malalugis Kurang Segar", 
    "Malalugis Segar",
    "Mujair Busuk", 
    "Mujair Kurang Segar", 
    "Mujair Segar",
    "Tude Busuk", 
    "Tude Kurang Segar", 
    "Tude Segar"
]

model = None
try:
    print("\n[INFO] Sedang memuat model AI ke memori... Mohon tunggu...")
    model = load_model(MODEL_PATH, compile=False)
    print("[INFO] Berhasil! Model AI siap menerima prediksi dari React.\n")
except Exception as e:
    print(f"\n[ERROR] Gagal membaca file model_ikan.h5: {e}\n")

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    img = img.resize(TARGET_SIZE)
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'success': False, 'message': 'Model AI gagal dimuat.'}), 500

    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Tidak ada file gambar.'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nama file tidak valid.'}), 400

    try:
        image_bytes = file.read()
        processed_image = preprocess_image(image_bytes)
        
        predictions = model.predict(processed_image)
        best_index = np.argmax(predictions[0])
        confidence_score = float(predictions[0][best_index])
        
        predicted_label = CLASS_LABELS[best_index]
        
        parts = predicted_label.split(" ", 1)
        jenis_ikan = parts[0]
        status_kualitas = parts[1] if len(parts) > 1 else "Unknown"
        
        layak_konsumsi = True if status_kualitas == "Segar" else False

        return jsonify({
            'success': True,
            'hasil_klasifikasi': predicted_label,
            'jenis_ikan': jenis_ikan,
            'status': status_kualitas,
            'layak_konsumsi': layak_konsumsi,
            'confidence': f"{confidence_score * 100:.2f}%"
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)