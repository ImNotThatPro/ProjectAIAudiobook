import os
from gtts import gTTS
import requests

#NOTE IS THAT THE MODEL WILL ONLY ACCEPT THOSE END WITH .txt !!!!!!!
url = 'https://www.gutenberg.org/cache/epub/11/pg11.txt'
response = requests.get(url)
book_text = response.text
#Stripping of those annoying license, might need to read those license before stripping them to avoid lawsuits
start_idx = book_text.find('*** START')
end_idx = book_text.find('*** END')
if start_idx != -1 and end_idx != -1:
    book_text = book_text[start_idx:end_idx]
#Getting snippet
snippet = book_text[:500]

#gTTS(text = your text, lang = 'your language or sth short for ur language')
tts = gTTS(text= snippet, lang='en')
tts.save('output.mp3')
os.system('start output.mp3')

