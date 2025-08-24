import os, requests, re
from fastapi import FastAPI, File, UploadFile, Body
from gtts import gTTS
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

UPLOAD_DIR = 'uploads'
AUDIO_DIR = 'audio'
os.makedirs(UPLOAD_DIR, exist_ok= True)
os.makedirs(AUDIO_DIR, exist_ok = True)

app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name= 'uploads')
app.mount('/audio', StaticFiles(directory=AUDIO_DIR), name = 'audio')

@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location,'wb') as f:
        f.write(await file.read())
    url = f'/uploads/{file.filename}'
    return JSONResponse({'filename': file.filename, 'url': url, 'status': 'received'})

@app.post('/generate_audio')
async def generate_audio(data: dict = Body(...)):
    url = data.get('url')
    if not url or not url.endswith('.txt'):
        return {'error': 'Only .txt files supported'}

    file_path = url.lstrip('/')
    if not os.path.exists(file_path):
        return {'error': 'File not found'}

    with open(file_path, 'r', encoding = 'utf-8') as f:
        book_text = f.read()

    start_idx = book_text.find('*** START')
    end_idx = book_text.find('*** END')
    if start_idx != -1 and end_idx != -1:
        book_text = book_text[start_idx: end_idx]

    snippet = book_text[:500]

    audio_filename = os.path.splitext(os.path.basename(file_path))[0] + '.mp3'
    audio_path = os.path.join(AUDIO_DIR, audio_filename)

    tts = gTTS(text= snippet, lang= 'en')
    tts.save(audio_path)

    audio_url = f'/audio/{audio_filename}'
    return {'audio_url': audio_url}

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*']
)

@app.get('/')
def root():
    return {'message': 'Hello from AI audiobook project'}