import io
import json
from pathlib import Path

import numpy as np
import open_clip
import pandas as pd
import torch
from fastapi import FastAPI, HTTPException, Request
from PIL import Image

BASE = Path(__file__).parent

app = FastAPI(title="Herbora ML Service v3 (BioCLIP 2)")

with open(BASE / "config.json", encoding="utf-8") as f:
    cfg = json.load(f)

class_names = cfg["class_names"]
THRESHOLD = float(cfg.get("threshold", 0.7))  # 0-1

head = np.load(BASE / "head.npz")
W = head["W"].astype(np.float32)   # (num_classes, embedding_dim)
B = head["b"].astype(np.float32)

# Pehli baar chalane par BioCLIP 2 ke weights internet se download hote hain (bada download), phir cache me rehte hain
model, _, preprocess = open_clip.create_model_and_transforms(cfg["embedding_model"])
model.eval()

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


def shrink(img: Image.Image, side: int = 256) -> Image.Image:
    # Training me bhi yahi hota tha (chhoti side 256)
    img = img.convert("RGB")
    w, h = img.size
    s = side / min(w, h)
    if s < 1:
        img = img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.BICUBIC)
    return img


@torch.no_grad()
def embed(img: Image.Image) -> np.ndarray:
    x = preprocess(shrink(img)).unsqueeze(0)
    f = model.encode_image(x).float()
    f = f / f.norm(dim=-1, keepdim=True)
    return f[0].numpy()


@app.get("/health")
def health():
    return {"status": "ok", "classes": len(class_names), "threshold": THRESHOLD}


@app.post("/predict")
async def predict(request: Request):
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image")

    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    logits = W @ embed(img) + B
    logits = logits - logits.max()
    probs = np.exp(logits)
    probs = probs / probs.sum()

    top_idx = np.argsort(probs)[::-1][:3]
    top3 = [
        {"label": class_names[int(i)], "confidence": round(float(probs[i]) * 100, 2)}
        for i in top_idx
    ]
    best = top3[0]

    return {
        "predicted_plant": best["label"],
        "confidence_percent": best["confidence"],
        "low_confidence": best["label"] == "Not_a_plant" or best["confidence"] < THRESHOLD * 100,
        "top3": top3,
        "herbal_information": get_herb_info(best["label"]),
    }