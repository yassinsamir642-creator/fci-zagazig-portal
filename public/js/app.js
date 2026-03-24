// public/js/app.js

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  // Initialize language
  setLanguage(currentLang);
  
  // Setup event listeners
  setupNavigation();
  setupThemeToggle();
  setupLanguageToggle();
  setupScrollToTop();
  setupFilters();
  
  // Load data
  loadAllData();
  
  // Hide loader
  setTimeout(() => {
    document.getElementById('page-loader')?.classList.add('hidden');
  }, 800);
});

// ============ NAVIGATION ============
function setupNavigation() {
  // Nav links
  document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      showSection(sectionId);
      
      // Close mobile nav
      document.getElementById('nav-links')?.classList.remove('open');
    });
  });
  
  // Mobile nav toggle
  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.toggle('open');
  });
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  
  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
  });
}

// ============ THEME ============
function setupThemeToggle() {
  const theme = localStorage.getItem('theme') || 'light';
  setTheme(theme);
  
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============ LANGUAGE ============
function setupLanguageToggle() {
  document.getElementById('lang-toggle')?.addEventListener('click', toggleLanguage);
}

// ============ SCROLL TO TOP ============
function setupScrollToTop() {
  const btn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    if (btn) btn.classList.toggle('visible', window.scrollY > 300);
  });
  btn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============ FILTERS ============
function setupFilters() {
  document.getElementById('file-course-filter')?.addEventListener('change', loadFiles);
  document.getElementById('file-type-filter')?.addEventListener('change', loadFiles);
  document.getElementById('video-course-filter')?.addEventListener('change', loadVideos);
  document.getElementById('exam-type-filter')?.addEventListener('change', loadExams);
  document.getElementById('exam-course-filter')?.addEventListener('change', loadExams);
}

// ============ DATA LOADING ============
async function loadAllData() {
  await loadCourses();
  await loadStats();
  await loadFiles();
  await loadVideos();
  await loadExams();
  await loadAnnouncements();
}

async function apiGet(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

// ============ STATS ============
async function loadStats() {
  const stats = await apiGet('/api/stats');
  if (stats) {
    animateCounter('stat-courses', stats.courses || 0);
    animateCounter('stat-files', stats.files || 0);
    animateCounter('stat-videos', stats.videos || 0);
    animateCounter('stat-exams', stats.exams || 0);
  }
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  
  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 30);
}

// ============ COURSES ============
let coursesData = [];

async function loadCourses() {
  coursesData = await apiGet('/api/courses');
  renderCourses();
  populateCourseFilters();
}

function renderCourses() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  
  grid.innerHTML = coursesData.map(course => `
    <div class="course-card">
      <span class="course-code">${course.code}</span>
      <h3 class="course-name">${getLocalField(course, 'name')}</h3>
      <p class="course-desc">${getLocalField(course, 'description')}</p>
      <div class="course-meta">
        <span class="course-instructor">👨‍🏫 ${getLocalField(course, 'instructor')}</span>
        <span>📘 ${course.credit_hours} ${t('credit_hours')}</span>
      </div>
    </div>
  `).join('');
}

function populateCourseFilters() {
  const selectors = ['file-course-filter', 'video-course-filter', 'exam-course-filter'];
  selectors.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    
    // Keep first option
    const firstOpt = select.querySelector('option');
    select.innerHTML = '';
    if (firstOpt) select.appendChild(firstOpt);
    
    coursesData.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.code} - ${getLocalField(c, 'name')}`;
      select.appendChild(opt);
    });
  });
}

// ============ FILES ============
async function loadFiles() {
  const courseId = document.getElementById('file-course-filter')?.value || '';
  const fileType = document.getElementById('file-type-filter')?.value || '';
  
  let url = '/api/files?';
  if (courseId) url += `course_id=${courseId}&`;
  if (fileType) url += `type=${fileType}&`;
  
  const files = await apiGet(url);
  renderFiles(files);
}

function renderFiles(files) {
  const grid = document.getElementById('files-grid');
  const empty = document.getElementById('files-empty');
  if (!grid) return;
  
  if (files.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  if (empty) empty.style.display = 'none';
  
  const fileIcons = {
    'application/pdf': '📕',
    'application/msword': '📘',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
    'application/vnd.ms-powerpoint': '📙',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📙',
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
    'text/plain': '📄'
  };
  
  grid.innerHTML = files.map(file => {
    const icon = fileIcons[file.mime_type] || '📄';
    const size = formatFileSize(file.file_size);
    const courseName = file.course_code ? `${file.course_code}` : '';
    
    return `
      <div class="file-card">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-title">${getLocalField(file, 'title')}</div>
          <div class="file-meta">
            ${courseName ? `<span class="file-badge">${courseName}</span>` : ''}
            <span>${size}</span>
            <span>⬇️ ${file.download_count} ${t('downloads')}</span>
          </div>
          <a href="/api/files/download/${file.uuid}" class="download-btn">
            ⬇️ ${t('download')}
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

// ============ VIDEOS ============
async function loadVideos() {
  const courseId = document.getElementById('video-course-filter')?.value || '';
  let url = '/api/videos?';
  if (courseId) url += `course_id=${courseId}`;
  
  const videos = await apiGet(url);
  renderVideos(videos);
}

function renderVideos(videos) {
  const grid = document.getElementById('videos-grid');
  const empty = document.getElementById('videos-empty');
  if (!grid) return;
  
  if (videos.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  if (empty) empty.style.display = 'none';
  
  grid.innerHTML = videos.map(video => {
    const courseName = video.course_code ? video.course_code : '';
    return `
      <div class="video-card" onclick="openVideo(${JSON.stringify(video).replace(/"/g, '&quot;')})">
        <div class="video-thumbnail">
          <div class="video-play-icon">▶</div>
          ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
        </div>
        <div class="video-info">
          <div class="video-title">${getLocalField(video, 'title')}</div>
          <div class="video-meta">
            ${courseName ? `<span>📚 ${courseName}</span>` : ''}
            <span>👁️ ${video.view_count} ${t('views')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openVideo(video) {
  const modal = document.getElementById('video-modal');
  const title = document.getElementById('video-modal-title');
  const container = document.getElementById('video-player-container');
  const desc = document.getElementById('video-modal-desc');
  
  if (!modal || !container) return;
  
  title.textContent = getLocalField(video, 'title');
  desc.textContent = getLocalField(video, 'description');
  
  if (video.video_type === 'youtube' && video.video_url) {
    const videoId = extractYouTubeId(video.video_url);
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
  } else if (video.file_path) {
    container.innerHTML = `<video controls src="/uploads/videos/${video.filename}"></video>`;
  } else if (video.video_url) {
    container.innerHTML = `<iframe src="${video.video_url}" allowfullscreen></iframe>`;
  }
  
  modal.classList.add('active');
  
  // Increment view count
  fetch(`/api/videos/view/${video.uuid}`);
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('video-player-container');
  if (modal) modal.classList.remove('active');
  if (container) container.innerHTML = '';
}

function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : url;
}

// ============ EXAMS ============
async function loadExams() {
  const examType = document.getElementById('exam-type-filter')?.value || '';
  const courseId = document.getElementById('exam-course-filter')?.value || '';
  
  let url = '/api/exams?';
  if (examType) url += `type=${examType}&`;
  if (courseId) url += `course_id=${courseId}`;
  
  const exams = await apiGet(url);
  renderExams(exams);
}

function renderExams(exams) {
  const tbody = document.getElementById('exam-tbody');
  const empty = document.getElementById('exams-empty');
  const table = document.getElementById('exam-table');
  if (!tbody) return;
  
  if (exams.length === 0) {
    tbody.innerHTML = '';
    if (table) table.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  if (table) table.style.display = 'table';
  if (empty) empty.style.display = 'none';
  
  const typeLabels = {
    midterm: t('midterm'),
    final: t('final_exam'),
    quiz: t('quiz'),
    practical: t('practical'),
    oral: t('oral')
  };
  
  tbody.innerHTML = exams.map(exam => {
    const examDate = new Date(exam.exam_date);
    const dateStr = examDate.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    const startTime = exam.start_time?.substring(0, 5) || '';
    const endTime = exam.end_time?.substring(0, 5) || '';
    
    // Check if exam is upcoming
    const isUpcoming = examDate > new Date();
    const isPast = examDate < new Date();
    
    return `
      <tr style="${isPast ? 'opacity: 0.6;' : ''}">
        <td>
          <strong>${exam.course_code || ''}</strong><br>
          <small>${getLocalField(exam, 'course_name')}</small>
        </td>
        <td><span class="exam-type-badge ${exam.exam_type}">${typeLabels[exam.exam_type] || exam.exam_type}</span></td>
        <td>${dateStr}</td>
        <td>${startTime} - ${endTime}</td>
        <td>${getLocalField(exam, 'location')}<br><small>${exam.hall_number || ''}</small></td>
        <td>${getLocalField(exam, 'notes')}</td>
      </tr>
    `;
  }).join('');
}

// ============ ANNOUNCEMENTS ============
async function loadAnnouncements() {
  const announcements = await apiGet('/api/announcements');
  renderHomeAnnouncements(announcements.slice(0, 3));
  renderAllAnnouncements(announcements);
}

function renderHomeAnnouncements(announcements) {
  const container = document.getElementById('home-announcements');
  if (!container) return;
  
  if (announcements.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>${t('no_announcements')}</p></div>`;
    return;
  }
  
  container.innerHTML = announcements.map(renderAnnouncementCard).join('');
}

function renderAllAnnouncements(announcements) {
  const container = document.getElementById('announcements-list');
  const empty = document.getElementById('announcements-empty');
  if (!container) return;
  
  if (announcements.length === 0) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  if (empty) empty.style.display = 'none';
  container.innerHTML = announcements.map(renderAnnouncementCard).join('');
}

function renderAnnouncementCard(ann) {
  const date = new Date(ann.created_at).toLocaleDateString(
    currentLang === 'ar' ? 'ar-EG' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  
  const classes = [
    'announcement-card',
    ann.is_pinned ? 'pinned' : '',
    ann.priority === 'urgent' ? 'urgent' : ''
  ].filter(Boolean).join(' ');
  
  return `
    <div class="${classes}">
      <div class="announcement-header">
        <h4 class="announcement-title">${getLocalField(ann, 'title')}</h4>
        <div class="announcement-badges">
          ${ann.is_pinned ? `<span class="pin-badge">${t('pinned')}</span>` : ''}
          <span class="priority-badge ${ann.priority}">${t(ann.priority)}</span>
        </div>
      </div>
      <p class="announcement-content">${getLocalField(ann, 'content')}</p>
      <span class="announcement-date">📅 ${date}</span>
    </div>
  `;
}

// Close modal on backdrop click
document.getElementById('video-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeVideoModal();
});

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeVideoModal();
});