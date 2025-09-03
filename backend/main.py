import os
from fastapi import FastAPI, File, UploadFile, Body, Depends, HTTPException
from gtts import gTTS
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from . import database, db_models
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from pydantic import BaseModel

app = FastAPI()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # one level up from backend/
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
AUDIO_DIR = os.path.join(BASE_DIR, 'audio')
os.makedirs(UPLOAD_DIR, exist_ok= True)
os.makedirs(AUDIO_DIR, exist_ok = True)

app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name= 'uploads')
app.mount('/audio', StaticFiles(directory=AUDIO_DIR), name = 'audio')
#IMPORTANT TAKE THIS TO YOUR FRONT END LOCATION INSIDE DIRECTORY IN ORDER TO WORK
app.mount('/static', StaticFiles(directory= os.path.join('static')), name = 'static')


#Uhh getting file from the front end when people drop or choose file and then send it here
@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, 'wb') as f:
        f.write(await file.read())
    url = f'/uploads/{safe_filename}'
    return JSONResponse({'filename': safe_filename, 'url': url, 'status': 'received'})

#Generate audio type shit
@app.post('/generate_audio')
async def generate_audio(data: dict = Body(...)):
    url = data.get('url')
    if not url or not url.endswith('.txt'):
        return {'error': 'Only .txt files supported'}

    file_path = os.path.join(UPLOAD_DIR, os.path.basename(url))
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

#Sth sth about CORSMiddleware that for now i don't understand
app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*']
)


#Creating a local running website ONLY FOR TESTING PURPOSES
@app.get('/', response_class= FileResponse)
async def serve_index():
    return FileResponse(os.path.join('index.html'))


#Create a database of table to store the user info     
db_models.Base.metadata.create_all(bind=database.engine)

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def hash_password(password=str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

#Pydantic job to request validation 
class UserCreate(BaseModel):
    username : str
    password : str

class UserLogin(BaseModel):
    username : str
    password : str

@app.post('/signup')
def signup(user: UserCreate, db: Session = Depends(database.get_db)):
    #Check if this kind of user info already existed inside the database, else continue
    existing_user = db.query(db_models.User).filter(db_models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='Username already taken') 

    #If username not existed, pass through here to create a new hashed user password
    #Basically just create a new info and store the username and hashed password
    hashed_pw = hash_password(user.password)
    new_user = db_models.User(username = user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    #And then refresh?
    db.refresh(new_user)
    return {'msg': 'User created successfully', 'username':new_user.username}

@app.post('/login')
def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(db_models.User).filter(db_models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail = 'Invalid username or password | Check again')
    return {'msg': f'Welcome back, {db_user.username}'}

#TESTING DISCORD BOT DELETE LATER PLEASE
#I AM A DISCORD SLAVE AND I WILL SEND THIS MESSAGE TO MY DISCORD SERVER 
#Woof
#Meow
#Tanscan oc cho 
#v5 testing
#v6
#FINALLY FUCKINGLY IT WORKED TANSCAN YOU DOG