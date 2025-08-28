// Theme switching logic (UI only)
    const themes = {
      default: {
        '--bg': '#0f1724',
        '--card': '#0b1220',
        '--muted': '#9aa4b2',
        '--accent': '#4f46e5',
        '--glass': 'rgba(255,255,255,0.04)',
        bodyBg: 'linear-gradient(180deg,#071023 0%, #071020 60%)',
        text: '#e6eef8'
      },
      white: {
        '--bg': '#f8fafc',
        '--card': '#fff',
        '--muted': '#64748b',
        '--accent': '#6366f1',
        '--glass': 'rgba(0,0,0,0.03)',
        bodyBg: '#fff',
        text: '#222'
      },
      black: {
        '--bg': '#000',
        '--card': '#18181b',
        '--muted': '#a1a1aa',
        '--accent': '#6366f1',
        '--glass': 'rgba(255,255,255,0.03)',
        bodyBg: '#000',
        text: '#f4f4f5'
      }
    };
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

    // Tab switching (UI only)
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const type = t.dataset.type;
      document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
      document.getElementById('panel-'+type).style.display='block';
    }));

    // Drop area UI (no upload logic)
    const dropArea = document.getElementById('drop-area');
    const inputFile = document.getElementById('input-file');
    const dropAreaText = document.getElementById('drop-area-text');
    const chooseFileLink = document.getElementById('choose-file-link');
    const btnUpload = document.getElementById('btn-upload');
    const btnClear = document.getElementById('btn-clear');
    const btnGenerateAudio = document.getElementById('btn-generate-audio');
    const fileError = document.getElementById('file-error');
    const fileList = document.getElementById('file-list');
    let uploadedFileUrl = null; // Store uploaded file URL

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

    // Upload button: send file to backend (no backend logic here)
    btnUpload.onclick = async () => {
      if (!inputFile.files.length) return;
      const file = inputFile.files[0];
      const formData = new FormData();
      formData.append('file', file);

      btnUpload.disabled = true;
      btnUpload.textContent = "Uploading...";

      try {
        // Change '/upload' to your backend endpoint
        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          const result = await response.json();
          uploadedFileUrl = result.url; // The backend should return the file URL
          fileError.style.display = "none";
          btnUpload.textContent = "Uploaded!";
          // Enable generate audio if .txt
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

    // Generate Audio button: call backend to generate audio from uploaded .txt file
    btnGenerateAudio.onclick = async () => {
      if (!uploadedFileUrl) {
        fileError.textContent = "Please upload a .txt file first.";
        fileError.style.display = "block";
        return;
      }
      btnGenerateAudio.disabled = true;
      btnGenerateAudio.textContent = "Generating...";

      try {
        const response = await fetch('http://localhost:8000/generate_audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadedFileUrl })
        });
        const result = await response.json();
        if (result.error) {
          fileError.textContent = result.error;
          fileError.style.display = "block";
          btnGenerateAudio.textContent = "Generate Audio";
        } else {
          // Optionally, provide a download link for the generated audio
          fileError.style.display = "none";
          btnGenerateAudio.textContent = "Done!";
          if (result.audio_url) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = 'http://127.0.0.1:8000'+ result.audio_url;
            fileList.appendChild(audio);
          }
        }
      } catch (e) {
        fileError.textContent = "Audio generation failed.";
        fileError.style.display = "block";
        btnGenerateAudio.textContent = "Generate Audio";
      }
      btnGenerateAudio.disabled = false;
    };