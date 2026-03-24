// public/js/admin.js

let adminToken = localStorage.getItem('adminToken');
let adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
let adminCourses = [];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  
  // Language
  setLanguage(localStorage.getItem('lang') || 'en');
  
  // Theme toggles
  document.getElementById('admin-theme-toggle')?.addEventListener('click', toggleAdminTheme);
  document.getElementById('admin-lang-toggle')?.addEventListener('click', toggleAdminLang);
  
  // Check auth
  if (adminToken) {
    verifyToken();
  }
  
  // Login form
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  
  // Setup forms
  setupAdminForms();
  
  // Responsive sidebar
  checkMobileSidebar();
  window.addEventListener('resize', checkMobileSidebar);
});

function checkMobileSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  if (toggle) {
    toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  }
}

function toggleSidebar() {
  document.getElementById('admin-sidebar')?.classList.toggle('open');
}

function toggleAdminTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

function toggleAdminLang() {
  const newLang = currentLang === 'en' ? 'ar' : 'en';
  setLanguage(newLang);
  loadAdminData();
}

// ============ AUTH ============
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    
    if (data.success) {
      adminToken = data.token;
      adminUser = data.admin;
      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      showDashboard();
    } else {
      errorEl.style.display = 'block';
      errorEl.textContent = data.error || t('login_error');
    }
  } catch (error) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Connection error. Please try again.';
  }
}

async function verifyToken() {
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showDashboard();
    } else {
      adminLogout();
    }
  } catch {
    adminLogout();
  }
}

function adminLogout() {
  adminToken = null;
  adminUser = null;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
  
  const welcome = document.getElementById('admin-welcome');
  if (welcome && adminUser) {
    welcome.textContent = `👋 ${currentLang === 'ar' ? adminUser.full_name_ar || adminUser.username : adminUser.full_name_en || adminUser.username}`;
  }
  
  loadAdminData();
}

// ============ API HELPERS ============
async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return res.json();
}

async function adminPost(url, body) {
  return adminFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function adminPut(url, body) {
  return adminFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function adminDelete(url) {
  return adminFetch(url, { method: 'DELETE' });
}

// ============ NAVIGATION ============
function showAdminSection(sectionId, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  
  document.getElementById(sectionId)?.classList.add('active');
  if (btn) btn.classList.add('active');
  
  // Close mobile sidebar
  document.getElementById('admin-sidebar')?.classList.remove('open');
}

// ============ TOAST ============
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.remove(), 4000);
}

// ============ LOAD DATA ============
async function loadAdminData() {
  await loadAdminCourses();
  await loadAdminStats();
  await loadAdminFiles();
  await loadAdminVideos();
  await loadAdminExams();
  await loadAdminAnnouncements();
  applyTranslations();
}

async function loadAdminCourses() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();
    adminCourses = data.success ? data.data : [];
    populateAdminCourseSelects();
    renderAdminCourses();
  } catch (e) {
    console.error(e);
  }
}

function populateAdminCourseSelects() {
  const selects = ['file-course', 'video-course', 'exam-course', 'announcement-course'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">-- ${t('select_course')} --</option>`;
    adminCourses.forEach(c => {
      sel.innerHTML += `<option value="${c.id}">${c.code} - ${getLocalField(c, 'name')}</option>`;
    });
  });
}

async function loadAdminStats() {
  try {
    const data = await adminFetch('/api/admin/stats');
    if (data.success) {
      document.getElementById('admin-stat-files').textContent = data.data.files || 0;
      document.getElementById('admin-stat-videos').textContent = data.data.videos || 0;
      document.getElementById('admin-stat-exams').textContent = data.data.exams || 0;
      document.getElementById('admin-stat-courses').textContent = data.data.courses || 0;
      document.getElementById('admin-stat-downloads').textContent = data.data.total_downloads || 0;
      document.getElementById('admin-stat-views').textContent = data.data.total_views || 0;
    }
  } catch (e) {
    console.error(e);
  }
}

// ============ FILES MANAGEMENT ============
async function loadAdminFiles() {
  try {
    const res = await fetch('/api/files');
    const data = await res.json();
    const files = data.success ? data.data : [];
    
    const tbody = document.getElementById('admin-files-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = files.length === 0 
      ? `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-secondary);">${t('no_data')}</td></tr>`
      : files.map(f => `
        <tr>
          <td><strong>${getLocalField(f, 'title')}</strong></td>
          <td>${f.course_code || '-'}</td>
          <td><span class="file-badge">${f.file_type}</span></td>
          <td>${formatSize(f.file_size)}</td>
          <td>${f.download_count}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-edit" onclick='editFile(${JSON.stringify(f)})'>${t('edit')}</button>
              <button class="btn-delete" onclick="deleteFile(${f.id})">${t('delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
  } catch (e) {
    console.error(e);
  }
}

function showFileForm() {
  document.getElementById('file-form-card').style.display = 'block';
  document.getElementById('file-edit-id').value = '';
  document.getElementById('file-upload-form').reset();
  document.getElementById('file-input-group').style.display = 'block';
}

function hideFileForm() {
  document.getElementById('file-form-card').style.display = 'none';
}

function editFile(file) {
  showFileForm();
  document.getElementById('file-edit-id').value = file.id;
  document.getElementById('file-title-en').value = file.title_en;
  document.getElementById('file-title-ar').value = file.title_ar;
  document.getElementById('file-desc-en').value = file.description_en || '';
  document.getElementById('file-desc-ar').value = file.description_ar || '';
  document.getElementById('file-course').value = file.course_id || '';
  document.getElementById('file-type').value = file.file_type;
  document.getElementById('file-input-group').style.display = 'none';
}

async function deleteFile(id) {
  if (!confirm(t('confirm_delete'))) return;
  const data = await adminDelete(`/api/admin/files/${id}`);
  showToast(data.message || 'Deleted', data.success ? 'success' : 'error');
  loadAdminFiles();
  loadAdminStats();
}

// ============ VIDEOS MANAGEMENT ============
async function loadAdminVideos() {
  try {
    const res = await fetch('/api/videos');
    const data = await res.json();
    const videos = data.success ? data.data : [];
    
    const tbody = document.getElementById('admin-videos-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = videos.length === 0
      ? `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-secondary);">${t('no_data')}</td></tr>`
      : videos.map(v => `
        <tr>
          <td><strong>${getLocalField(v, 'title')}</strong></td>
          <td>${v.course_code || '-'}</td>
          <td>${v.video_type}</td>
          <td>${v.view_count}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-edit" onclick='editVideo(${JSON.stringify(v)})'>${t('edit')}</button>
              <button class="btn-delete" onclick="deleteVideo(${v.id})">${t('delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
  } catch (e) {
    console.error(e);
  }
}

function showVideoForm() {
  document.getElementById('video-form-card').style.display = 'block';
  document.getElementById('video-edit-id').value = '';
  document.getElementById('video-upload-form').reset();
  toggleVideoInput();
}

function hideVideoForm() {
  document.getElementById('video-form-card').style.display = 'none';
}

function toggleVideoInput() {
  const type = document.getElementById('video-type-select').value;
  document.getElementById('video-url-group').style.display = type !== 'uploaded' ? 'block' : 'none';
  document.getElementById('video-file-group').style.display = type === 'uploaded' ? 'block' : 'none';
}

function editVideo(video) {
  showVideoForm();
  document.getElementById('video-edit-id').value = video.id;
  document.getElementById('video-title-en').value = video.title_en;
  document.getElementById('video-title-ar').value = video.title_ar;
  document.getElementById('video-desc-en').value = video.description_en || '';
  document.getElementById('video-desc-ar').value = video.description_ar || '';
  document.getElementById('video-course').value = video.course_id || '';
  document.getElementById('video-type-select').value = video.video_type;
  document.getElementById('video-url').value = video.video_url || '';
  document.getElementById('video-duration').value = video.duration || '';
  toggleVideoInput();
}

async function deleteVideo(id) {
  if (!confirm(t('confirm_delete'))) return;
  const data = await adminDelete(`/api/admin/videos/${id}`);
  showToast(data.message || 'Deleted', data.success ? 'success' : 'error');
  loadAdminVideos();
  loadAdminStats();
}

// ============ EXAMS MANAGEMENT ============
async function loadAdminExams() {
  try {
    const res = await fetch('/api/exams');
    const data = await res.json();
    const exams = data.success ? data.data : [];
    
    const tbody = document.getElementById('admin-exams-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = exams.length === 0
      ? `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-secondary);">${t('no_data')}</td></tr>`
      : exams.map(e => {
        const date = new Date(e.exam_date).toLocaleDateString();
        return `
          <tr>
            <td><strong>${e.course_code || ''}</strong> ${getLocalField(e, 'course_name')}</td>
            <td><span class="exam-type-badge ${e.exam_type}">${e.exam_type}</span></td>
            <td>${date}</td>
            <td>${(e.start_time||'').substring(0,5)} - ${(e.end_time||'').substring(0,5)}</td>
            <td>${getLocalField(e, 'location')}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-edit" onclick='editExam(${JSON.stringify(e)})'>${t('edit')}</button>
                <button class="btn-delete" onclick="deleteExam(${e.id})">${t('delete')}</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
  } catch (e) {
    console.error(e);
  }
}

function showExamForm() {
  document.getElementById('exam-form-card').style.display = 'block';
  document.getElementById('exam-edit-id').value = '';
  document.getElementById('exam-form').reset();
}

function hideExamForm() {
  document.getElementById('exam-form-card').style.display = 'none';
}

function editExam(exam) {
  showExamForm();
  document.getElementById('exam-edit-id').value = exam.id;
  document.getElementById('exam-course').value = exam.course_id || '';
  document.getElementById('exam-type-input').value = exam.exam_type;
  document.getElementById('exam-date').value = exam.exam_date?.substring(0, 10) || '';
  document.getElementById('exam-start').value = exam.start_time?.substring(0, 5) || '';
  document.getElementById('exam-end').value = exam.end_time?.substring(0, 5) || '';
  document.getElementById('exam-location-en').value = exam.location_en || '';
  document.getElementById('exam-location-ar').value = exam.location_ar || '';
  document.getElementById('exam-hall').value = exam.hall_number || '';
  document.getElementById('exam-notes-en').value = exam.notes_en || '';
  document.getElementById('exam-notes-ar').value = exam.notes_ar || '';
}

async function deleteExam(id) {
  if (!confirm(t('confirm_delete'))) return;
  const data = await adminDelete(`/api/admin/exams/${id}`);
  showToast(data.message || 'Deleted', data.success ? 'success' : 'error');
  loadAdminExams();
  loadAdminStats();
}

// ============ COURSES MANAGEMENT ============
function renderAdminCourses() {
  const tbody = document.getElementById('admin-courses-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = adminCourses.length === 0
    ? `<tr><td colspan="5" style="text-align:center; padding:30px;">${t('no_data')}</td></tr>`
    : adminCourses.map(c => `
      <tr>
        <td><span class="course-code" style="font-size:0.8rem;">${c.code}</span></td>
        <td><strong>${getLocalField(c, 'name')}</strong></td>
        <td>${getLocalField(c, 'instructor')}</td>
        <td>${c.credit_hours}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick='editCourse(${JSON.stringify(c)})'>${t('edit')}</button>
            <button class="btn-delete" onclick="deleteCourse(${c.id})">${t('delete')}</button>
          </div>
        </td>
      </tr>
    `).join('');
}

function showCourseForm() {
  document.getElementById('course-form-card').style.display = 'block';
  document.getElementById('course-edit-id').value = '';
  document.getElementById('course-form').reset();
}

function hideCourseForm() {
  document.getElementById('course-form-card').style.display = 'none';
}

function editCourse(course) {
  showCourseForm();
  document.getElementById('course-edit-id').value = course.id;
  document.getElementById('course-code').value = course.code;
  document.getElementById('course-name-en').value = course.name_en;
  document.getElementById('course-name-ar').value = course.name_ar;
  document.getElementById('course-desc-en').value = course.description_en || '';
  document.getElementById('course-desc-ar').value = course.description_ar || '';
  document.getElementById('course-credits').value = course.credit_hours;
  document.getElementById('course-instructor-en').value = course.instructor_en || '';
  document.getElementById('course-instructor-ar').value = course.instructor_ar || '';
}

async function deleteCourse(id) {
  if (!confirm(t('confirm_delete'))) return;
  const data = await adminDelete(`/api/admin/courses/${id}`);
  showToast(data.message || 'Deleted', data.success ? 'success' : 'error');
  loadAdminCourses();
  loadAdminStats();
}

// ============ ANNOUNCEMENTS MANAGEMENT ============
async function loadAdminAnnouncements() {
  try {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    const anns = data.success ? data.data : [];
    
    const tbody = document.getElementById('admin-announcements-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = anns.length === 0
      ? `<tr><td colspan="5" style="text-align:center; padding:30px;">${t('no_data')}</td></tr>`
      : anns.map(a => `
        <tr>
          <td><strong>${getLocalField(a, 'title')}</strong></td>
          <td><span class="priority-badge ${a.priority}">${a.priority}</span></td>
          <td>${a.is_pinned ? '📌' : ''}</td>
          <td>${new Date(a.created_at).toLocaleDateString()}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-edit" onclick='editAnnouncement(${JSON.stringify(a)})'>${t('edit')}</button>
              <button class="btn-delete" onclick="deleteAnnouncement(${a.id})">${t('delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
  } catch (e) {
    console.error(e);
  }
}

function showAnnouncementForm() {
  document.getElementById('announcement-form-card').style.display = 'block';
  document.getElementById('announcement-edit-id').value = '';
  document.getElementById('announcement-form').reset();
}

function hideAnnouncementForm() {
  document.getElementById('announcement-form-card').style.display = 'none';
}

function editAnnouncement(ann) {
  showAnnouncementForm();
  document.getElementById('announcement-edit-id').value = ann.id;
  document.getElementById('announcement-title-en').value = ann.title_en;
  document.getElementById('announcement-title-ar').value = ann.title_ar;
  document.getElementById('announcement-content-en').value = ann.content_en || '';
  document.getElementById('announcement-content-ar').value = ann.content_ar || '';
  document.getElementById('announcement-priority').value = ann.priority;
  document.getElementById('announcement-course').value = ann.course_id || '';
  document.getElementById('announcement-pinned').checked = ann.is_pinned;
}

async function deleteAnnouncement(id) {
  if (!confirm(t('confirm_delete'))) return;
  const data = await adminDelete(`/api/admin/announcements/${id}`);
  showToast(data.message || 'Deleted', data.success ? 'success' : 'error');
  loadAdminAnnouncements();
  loadAdminStats();
}

// ============ FORM SUBMISSIONS ============
function setupAdminForms() {
  // File upload form
  document.getElementById('file-upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('file-edit-id').value;
    
    if (editId) {
      // Update
      const data = await adminPut(`/api/admin/files/${editId}`, {
        title_en: document.getElementById('file-title-en').value,
        title_ar: document.getElementById('file-title-ar').value,
        description_en: document.getElementById('file-desc-en').value,
        description_ar: document.getElementById('file-desc-ar').value,
        course_id: document.getElementById('file-course').value || null,
        file_type: document.getElementById('file-type').value
      });
      showToast(data.message, data.success ? 'success' : 'error');
    } else {
      // Upload new
      const formData = new FormData();
      formData.append('title_en', document.getElementById('file-title-en').value);
      formData.append('title_ar', document.getElementById('file-title-ar').value);
      formData.append('description_en', document.getElementById('file-desc-en').value);
      formData.append('description_ar', document.getElementById('file-desc-ar').value);
      formData.append('course_id', document.getElementById('file-course').value);
      formData.append('file_type', document.getElementById('file-type').value);
      formData.append('file', document.getElementById('file-input').files[0]);
      
      const data = await adminFetch('/api/admin/files', {
        method: 'POST',
        body: formData
      });
      showToast(data.message, data.success ? 'success' : 'error');
    }
    
    hideFileForm();
    loadAdminFiles();
    loadAdminStats();
  });

  // Video form
  document.getElementById('video-upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('video-edit-id').value;
    const videoType = document.getElementById('video-type-select').value;
    
    if (editId) {
      const data = await adminPut(`/api/admin/videos/${editId}`, {
        title_en: document.getElementById('video-title-en').value,
        title_ar: document.getElementById('video-title-ar').value,
        description_en: document.getElementById('video-desc-en').value,
        description_ar: document.getElementById('video-desc-ar').value,
        video_url: document.getElementById('video-url').value,
        course_id: document.getElementById('video-course').value || null,
        duration: document.getElementById('video-duration').value
      });
      showToast(data.message, data.success ? 'success' : 'error');
    } else {
      const formData = new FormData();
      formData.append('title_en', document.getElementById('video-title-en').value);
      formData.append('title_ar', document.getElementById('video-title-ar').value);
      formData.append('description_en', document.getElementById('video-desc-en').value);
      formData.append('description_ar', document.getElementById('video-desc-ar').value);
      formData.append('video_type', videoType);
      formData.append('video_url', document.getElementById('video-url').value);
      formData.append('course_id', document.getElementById('video-course').value);
      formData.append('duration', document.getElementById('video-duration').value);
      
      if (videoType === 'uploaded') {
        const file = document.getElementById('video-file-input').files[0];
        if (file) formData.append('video', file);
      }
      
      const data = await adminFetch('/api/admin/videos', {
        method: 'POST',
        body: formData
      });
      showToast(data.message, data.success ? 'success' : 'error');
    }
    
    hideVideoForm();
    loadAdminVideos();
    loadAdminStats();
  });

  // Exam form
  document.getElementById('exam-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('exam-edit-id').value;
    
    const body = {
      course_id: document.getElementById('exam-course').value,
      exam_type: document.getElementById('exam-type-input').value,
      exam_date: document.getElementById('exam-date').value,
      start_time: document.getElementById('exam-start').value,
      end_time: document.getElementById('exam-end').value,
      location_en: document.getElementById('exam-location-en').value,
      location_ar: document.getElementById('exam-location-ar').value,
      hall_number: document.getElementById('exam-hall').value,
      notes_en: document.getElementById('exam-notes-en').value,
      notes_ar: document.getElementById('exam-notes-ar').value
    };
    
    const data = editId
      ? await adminPut(`/api/admin/exams/${editId}`, body)
      : await adminPost('/api/admin/exams', body);
    
    showToast(data.message, data.success ? 'success' : 'error');
    hideExamForm();
    loadAdminExams();
    loadAdminStats();
  });

  // Course form
  document.getElementById('course-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('course-edit-id').value;
    
    const body = {
      code: document.getElementById('course-code').value,
      name_en: document.getElementById('course-name-en').value,
      name_ar: document.getElementById('course-name-ar').value,
      description_en: document.getElementById('course-desc-en').value,
      description_ar: document.getElementById('course-desc-ar').value,
      credit_hours: document.getElementById('course-credits').value,
      instructor_en: document.getElementById('course-instructor-en').value,
      instructor_ar: document.getElementById('course-instructor-ar').value
    };
    
    const data = editId
      ? await adminPut(`/api/admin/courses/${editId}`, body)
      : await adminPost('/api/admin/courses', body);
    
    showToast(data.message, data.success ? 'success' : 'error');
    hideCourseForm();
    loadAdminCourses();
    loadAdminStats();
  });

  // Announcement form
  document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('announcement-edit-id').value;
    
    const body = {
      title_en: document.getElementById('announcement-title-en').value,
      title_ar: document.getElementById('announcement-title-ar').value,
      content_en: document.getElementById('announcement-content-en').value,
      content_ar: document.getElementById('announcement-content-ar').value,
      priority: document.getElementById('announcement-priority').value,
      course_id: document.getElementById('announcement-course').value || null,
      is_pinned: document.getElementById('announcement-pinned').checked
    };
    
    const data = editId
      ? await adminPut(`/api/admin/announcements/${editId}`, body)
      : await adminPost('/api/admin/announcements', body);
    
    showToast(data.message, data.success ? 'success' : 'error');
    hideAnnouncementForm();
    loadAdminAnnouncements();
    loadAdminStats();
  });
}

// ============ UTILITIES ============
function formatSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}