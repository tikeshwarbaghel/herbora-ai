import io
import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI, HTTPException, Request
from PIL import Image

BASE = Path(__file__).parent

app = FastAPI(title="Herbora ML Service")

model = tf.keras.models.load_model(BASE / "ayurvedic_plant_model.keras")

with open(BASE / "plant_class_names.json", encoding="utf-8") as f:
    class_names = json.load(f)

herbs_path = BASE / "herbs.csv"
herbs_df = (
    pd.read_csv(herbs_path, encoding="utf-8").fillna("")
    if herbs_path.exists()
    else pd.DataFrame(columns=["class_label"])
)


def get_herb_info(label: str) -> dict:
    match = herbs_df[herbs_df["class_label"].str.strip().str.casefold() == label.strip().casefold()]
    if match.empty:
        return {}
    row = match.iloc[0].to_dict()
    return {k: v for k, v in row.items() if str(v).strip()}


@app.get("/health")
def health():
    return {"status": "ok", "classes": len(class_names)}


@app.post("/predict")
async def predict(request: Request):
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image")

    try:
        img = Image.open(io.BytesIO(data)).convert("RGB").resize((224, 224))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    arr = np.expand_dims(np.array(img, dtype=np.float32), axis=0)
    probs = model.predict(arr, verbose=0)[0]

    top_idx = np.argsort(probs)[::-1][:3]
    top3 = [
        {"label": class_names[int(i)], "confidence": round(float(probs[i]) * 100, 2)}
        for i in top_idx
    ]
    best = top3[0]

    return {
        "predicted_plant": best["label"],
        "confidence_percent": best["confidence"],
        "low_confidence": best["confidence"] < 70,
        "top3": top3,
        "herbal_information": get_herb_info(best["label"]),
    }