from django.apps import AppConfig
from tensorflow.keras.models import load_model

class LoadConfig(AppConfig):
    model = load_model('best_model.h5')