import os, requests, re
from fastapi import FastAPI, File, UploadFile, Body
from gtts import gTTS
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # one level up from backend/
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
UPLOAD_DIR = 'uploads'
AUDIO_DIR = 'audio'
os.makedirs(UPLOAD_DIR, exist_ok= True)
os.makedirs(AUDIO_DIR, exist_ok = True)

app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name= 'uploads')
app.mount('/audio', StaticFiles(directory=AUDIO_DIR), name = 'audio')
#IMPORTANT TAKE THIS TO YOUR FRONT END LOCATION INSIDE DIRECTORY IN ORDER TO WORK
app.mount('/static', StaticFiles(directory='static'), name = 'static')


#Uhh getting file from the front end when people drop or choose file and then send it here
@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location,'wb') as f:
        f.write(await file.read())
    url = f'/uploads/{file.filename}'
    return JSONResponse({'filename': file.filename, 'url': url, 'status': 'received'})

#Generate audio type shit
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


#Sth sth about CORSM that for now i don't understand
app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*']
)


#Creating a local running website
@app.get('/')
def serve_index():
    file_path = os.path.join(FRONTEND_DIR, 'frontend.html')
    if not os.path.exists(file_path):
        raise RuntimeError(f'File not found: {file_path}')
    return FileResponse(file_path)