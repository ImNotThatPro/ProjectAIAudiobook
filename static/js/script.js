    const themes = {
      default: {
        '--bg': '#0f1724',
        '--card': '#0b1220',
        '--muted': '#9aa4b2',
        '--accent': '#4f46e5',
        '--glass': 'rgba(255,255,255,0.04)',
        bodyBg: "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%) no-repeat fixed center / cover",
        text: '#e6eef8'
      },
      white: {
        '--bg': '#a8f3ff',
        '--card': 'linear-gradient(190deg,#e8e6e6 30%, #2b2b2b 60%) no-repeat fixed center / 500% 500%',
        '--muted': '#ffffffff',
        '--accent': 'linear-gradient(180deg, #494949ff 30%, #0a0a0aff 60%) no-repeat fixed center',
        '--glass': 'rgba(168, 243, 255,0.03)',
        bodyBg: "linear-gradient(90deg,#e8e6e6 30%, #2b2b2b 60%) no-repeat fixed center / 500% 500%",
        text: '#f3f3f3ff'
      },
      black: {
        '--bg': '#000',
        '--card': '#18181b',
        '--muted': '#a1a1aa',
        '--accent': '#6366f1',
        '--glass': 'rgba(255,255,255,0.03)',
        bodyBg: '#000',
        text: '#f4f4f5'
      },
      picker: {
        '--bg': '#000',
        '--card': '#18181b',
        '--muted': '#a1a1aa',
        '--accent': '#6366f1',
        '--glass': 'rgba(255,255,255,0.03)',
        bodyBg: '#000',
        text: '#f4f4f5'
      }
    }
    function setTheme(theme) {
      const t = themes[theme] || themes.default;
      for (const key in t) {
        if (key.startsWith('--')) {
          document.documentElement.style.setProperty(key, t[key]);
        }
      }
      document.body.style.background = t.bodyBg;
      document.body.style.color = t.text;
      document.querySelectorAll('.card,.guide-card,.bottom-info-card').forEach(el=>{
        el.style.color = t.text;
      });
      document.querySelectorAll('.color-btn').forEach(btn=>{
        btn.classList.toggle('selected', btn.dataset.theme === theme);
      });
    }
    document.querySelectorAll('.color-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        setTheme(btn.dataset.theme);
        localStorage.setItem('aiaudiobook_theme', btn.dataset.theme);
      });
    });
    setTheme(localStorage.getItem('aiaudiobook_theme') || 'default');

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const type = t.dataset.type;
      document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
      document.getElementById('panel-'+type).style.display='block';
    }));

    const dropArea = document.getElementById('drop-area');
    const inputFile = document.getElementById('input-file');
    const dropAreaText = document.getElementById('drop-area-text');
    const chooseFileLink = document.getElementById('choose-file-link');
    const btnUpload = document.getElementById('btn-upload');
    const btnClear = document.getElementById('btn-clear');
    const btnGenerateAudio = document.getElementById('btn-generate-audio');
    const fileError = document.getElementById('file-error');
    const fileList = document.getElementById('file-list');
    const BACKEND_URL = 'http://127.0.0.1:8000';
    let uploadedFileUrl = null;

    dropArea.onclick = (e) => {
      inputFile.click();
    };
    chooseFileLink.onclick = (e) => {
      e.stopPropagation();
      inputFile.click();
    };
    dropArea.ondragover = (e) => {
      e.preventDefault();
      dropArea.classList.add('dragover');
      dropAreaText.textContent = "Drop your file here";
    };
    dropArea.ondragleave = (e) => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      dropAreaText.innerHTML = 'Drop EPUB, PDF, or TXT files here or <span id="choose-file-link" style="color:#4f46e5;cursor:pointer;text-decoration:underline;">press here</span>';
      document.getElementById('choose-file-link').onclick = (e) => { e.stopPropagation(); inputFile.click(); };
    };
    dropArea.ondrop = (e) => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      dropAreaText.innerHTML = 'Drop EPUB, PDF, or TXT files here or <span id="choose-file-link" style="color:#4f46e5;cursor:pointer;text-decoration:underline;">press here</span>';
      document.getElementById('choose-file-link').onclick = (e) => { e.stopPropagation(); inputFile.click(); };
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        inputFile.files = e.dataTransfer.files;
        showFileList();
      }
    };
    inputFile.onchange = () => {
      showFileList();
    };
    function showFileList() {
      fileList.innerHTML = '';
      fileError.style.display = "none";
      btnUpload.disabled = true;
      btnGenerateAudio.disabled = true;
      uploadedFileUrl = null;
      if (inputFile.files && inputFile.files.length > 0) {
        const file = inputFile.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        if (['epub', 'pdf', 'txt'].includes(ext)) {
          const li = document.createElement('li');
          li.textContent = `✅ ${file.name}`;
          fileList.appendChild(li);
          btnUpload.disabled = false;
          if (ext === 'txt') btnGenerateAudio.disabled = false;
        } else {
          const li = document.createElement('li');
          li.textContent = `❌ ${file.name} (unsupported type)`;
          fileList.appendChild(li);
          fileError.textContent = "Unsupported file type.";
          fileError.style.display = "block";
        }
      }
    }
    btnClear.onclick = () => {
      inputFile.value = '';
      fileList.innerHTML = '';
      btnUpload.disabled = true;
      btnGenerateAudio.disabled = true;
      fileError.style.display = "none";
      uploadedFileUrl = null;
      dropAreaText.innerHTML = 'Drop EPUB, PDF, or TXT files here or <span id="choose-file-link" style="color:#4f46e5;cursor:pointer;text-decoration:underline;">press here</span>';
      document.getElementById('choose-file-link').onclick = (e) => { e.stopPropagation(); inputFile.click(); };
    };

    btnUpload.onclick = async () => {
      if (!inputFile.files.length) return;
      const file = inputFile.files[0];
      const formData = new FormData();
      formData.append('file', file);

      btnUpload.disabled = true;
      btnUpload.textContent = "Uploading...";

      try {
        const response = await fetch(`${BACKEND_URL}/upload`, {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          const result = await response.json();
          uploadedFileUrl = result.url;
          fileError.style.display = "none";
          btnUpload.textContent = "Uploaded!";
          if (file.name.endsWith('.txt')) btnGenerateAudio.disabled = false;
        } else {
          fileError.textContent = "Upload failed.";
          fileError.style.display = "block";
          btnUpload.textContent = "Upload";
        }
      } catch (e) {
        fileError.textContent = "Network error.";
        fileError.style.display = "block";
        btnUpload.textContent = "Upload";
      }
      btnUpload.disabled = false;
    };

    btnGenerateAudio.onclick = async () => {
      if (!uploadedFileUrl) {
        fileError.textContent = "Please upload a .txt file first.";
        fileError.style.display = "block";
        return;
      }
      btnGenerateAudio.disabled = true;
      btnGenerateAudio.textContent = "Generating...";

      try {
        const response = await fetch(`${BACKEND_URL}/generate_audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadedFileUrl })
        });
        console.log('Response status:', response.status);
        const result = await response.json().catch(err =>{
          console.error('JSON parse failed:', err)
          throw new Error('Invalid JSON response');
        });
        console.log('Result from backend:', result)
        if (result.error) {
          fileError.textContent = result.error;
          fileError.style.display = "block";
          btnGenerateAudio.textContent = "Generate Audio";
        } else {
          fileError.style.display = "none";
          btnGenerateAudio.textContent = "Done!";
          //I THINK THIS SHOULD BE THE PLAY BUTTON AND HOW IT SHOULD LOOK LIKE (CHANGE IN THE FUTURE HERE)
          if (result.audio_url) {
            console.log('got audio URL:', result.audio_url)
            const audio = document.createElement('audio');
            audio.src = `${BACKEND_URL}${result.audio_url}`;
            audio.id = 'customAudio'; 
            fileList.appendChild(audio);

            const playBtn = document.createElement('button');
            playBtn.textContent = '▶ Play';
            //Style this in css file (Aijann job)
            playBtn.className = 'play-btn';
            fileList.appendChild(playBtn);

            playBtn.addEventListener('click', () =>{
              if (audio.paused) {
                audio.play();
                playBtn.textContent = "⏸ Pause";
              }
              else {
                audio.pause();
                playBtn.textContent = '▶ Play';
              }
            });
      } else {
        console.log('No audio_url in result:', result);
        fileError.style.display = "none";
        btnGenerateAudio.textContent = "Done!";
      }
    }
  } catch (e) {
    fileError.textContent = "Audio generation failed.";
    fileError.style.display = "block";
    btnGenerateAudio.textContent = "Generate Audio";
  } finally {
    btnGenerateAudio.disabled = false;
  }
};

// Color picker
const pickerBtn = document.getElementById("pickerBtn");
const colorPicker = document.getElementById("colorPicker");

pickerBtn.addEventListener("click", () => {
  colorPicker.click();
});

colorPicker.addEventListener("input", (e) => {
  let color = e.target.value;
  document.body.style.background = color;
});
    const btn = document.getElementById("pickerBtn");
    let clicks = 0;
    let intervalId = null;
    let running = false;

    function randomColor() {
      return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
    }

    btn.addEventListener("click", () => {
      clicks++;

      if (clicks >= 10) {
        if (!running) {
          // bật random
          running = true;
          intervalId = setInterval(() => {
            document.body.style.background = randomColor();
          }, 100);
        } else {
          // tắt random
          running = false;
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    });
function downloadTxt() {
  const text = document.getElementById("content").value;
  let filename = document.getElementById("filename").value.trim();

  if (filename === "") {
    filename = "myfile"; // default name
  }

  if (!filename.endsWith(".txt")) {
    filename += ".txt";
  }

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
const playBtn = document.getElementById("playBtn");
const progressBar = document.getElementById("progressBar");

let isPlaying = false;
let progress = 0;
let interval = null;

playBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playBtn.textContent = isPlaying ? "⏸️" : "▶️";

  if (isPlaying) {
    interval = setInterval(() => {
      progress += 1;
      if (progress > 100) progress = 0;
      progressBar.style.width = progress + "%";
    }, 300);
  } else {
    clearInterval(interval);
  }
});
document.getElementById("auth-login-btn").addEventListener("click", () => {
  window.location.href = "/login/login.html"; // trang login riêng
});

document.getElementById("auth-register-btn").addEventListener("click", () => {
  window.location.href = "/register/register.html"; // trang register riêng
});