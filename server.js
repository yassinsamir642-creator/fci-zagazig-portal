// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Ensure upload directories exist
const dirs = ['public/uploads/files', 'public/uploads/videos', 'public/uploads/thumbnails'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============ DATABASE CONNECTION ============
let db;

async function initDatabase() {
  try {
    // First connect without database to create it
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });

    await tempConn.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConn.end();

    // Create connection pool
    db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4'
    });

    // Create tables
    await createTables();
    // Create default admin
    await createDefaultAdmin();

    console.log('✅ Database connected and initialized successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Running without database - some features will be unavailable');
  }
}

async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS admins (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name_en VARCHAR(100) DEFAULT '',
      full_name_ar VARCHAR(100) DEFAULT '',
      role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
      is_active BOOLEAN DEFAULT TRUE,
      last_login DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS courses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(20) UNIQUE NOT NULL,
      name_en VARCHAR(150) NOT NULL,
      name_ar VARCHAR(150) NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      credit_hours INT DEFAULT 3,
      semester ENUM('first', 'second', 'summer') DEFAULT 'second',
      academic_year VARCHAR(10) DEFAULT '2025-2026',
      instructor_en VARCHAR(100),
      instructor_ar VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS files (
      id INT PRIMARY KEY AUTO_INCREMENT,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      title_en VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT DEFAULT 0,
      mime_type VARCHAR(100),
      file_type ENUM('lecture', 'section', 'assignment', 'reference', 'other') DEFAULT 'lecture',
      course_id INT,
      download_count INT DEFAULT 0,
      uploaded_by INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS videos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      title_en VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      video_url VARCHAR(500),
      filename VARCHAR(255),
      file_path VARCHAR(500),
      file_size BIGINT DEFAULT 0,
      mime_type VARCHAR(100),
      duration VARCHAR(20),
      thumbnail_path VARCHAR(500),
      video_type ENUM('uploaded', 'youtube', 'external') DEFAULT 'uploaded',
      course_id INT,
      view_count INT DEFAULT 0,
      uploaded_by INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS exam_schedules (
      id INT PRIMARY KEY AUTO_INCREMENT,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      course_id INT,
      exam_type ENUM('midterm', 'final', 'quiz', 'practical', 'oral') DEFAULT 'final',
      exam_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      location_en VARCHAR(200),
      location_ar VARCHAR(200),
      hall_number VARCHAR(50),
      notes_en TEXT,
      notes_ar TEXT,
      semester ENUM('first', 'second', 'summer') DEFAULT 'second',
      academic_year VARCHAR(10) DEFAULT '2025-2026',
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS announcements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      title_en VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      content_en TEXT,
      content_ar TEXT,
      priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
      is_pinned BOOLEAN DEFAULT FALSE,
      course_id INT,
      created_by INT,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS activity_log (
      id INT PRIMARY KEY AUTO_INCREMENT,
      admin_id INT,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id INT,
      details TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
    )`
  ];

  for (const sql of tables) {
    await db.execute(sql);
  }
}

async function createDefaultAdmin() {
  try {
    const [rows] = await db.execute('SELECT id FROM admins LIMIT 1');
    if (rows.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@FCI2026', 12);
      await db.execute(
        'INSERT INTO admins (username, email, password_hash, full_name_en, full_name_ar, role) VALUES (?, ?, ?, ?, ?, ?)',
        [
          process.env.ADMIN_USERNAME || 'admin',
          process.env.ADMIN_EMAIL || 'admin@fci.zu.edu.eg',
          hash,
          'System Administrator',
          'مدير النظام',
          'super_admin'
        ]
      );
      console.log('✅ Default admin account created');

      // Insert default courses
      const courses = [
        ['CS102', 'Data Structures', 'هياكل البيانات', 'Introduction to data structures and algorithms', 'مقدمة في هياكل البيانات والخوارزميات', 3, 'Dr. Ahmed Hassan', 'د. أحمد حسن'],
        ['CS104', 'Object-Oriented Programming', 'البرمجة الشيئية', 'OOP concepts using Java/C++', 'مفاهيم البرمجة الشيئية', 3, 'Dr. Sara Mohamed', 'د. سارة محمد'],
        ['MATH102', 'Linear Algebra', 'الجبر الخطي', 'Matrices, vectors, and linear transformations', 'المصفوفات والمتجهات والتحويلات الخطية', 3, 'Dr. Mahmoud Ali', 'د. محمود علي'],
        ['MATH104', 'Calculus II', 'التفاضل والتكامل 2', 'Advanced calculus', 'التفاضل والتكامل المتقدم', 3, 'Dr. Fatma Ibrahim', 'د. فاطمة إبراهيم'],
        ['IS102', 'Database Fundamentals', 'أساسيات قواعد البيانات', 'Introduction to relational databases', 'مقدمة في قواعد البيانات العلائقية', 3, 'Dr. Khaled Yousef', 'د. خالد يوسف'],
        ['CS106', 'Digital Logic Design', 'تصميم الدوائر المنطقية', 'Boolean algebra and logic gates', 'الجبر البولياني والبوابات المنطقية', 3, 'Dr. Omar Mostafa', 'د. عمر مصطفى'],
        ['ENG102', 'Technical English', 'اللغة الإنجليزية التقنية', 'English for CS students', 'الإنجليزية لطلاب الحاسب', 2, 'Dr. Nadia Samir', 'د. نادية سمير'],
        ['HR101', 'Human Rights', 'حقوق الإنسان', 'Introduction to human rights', 'مقدمة في حقوق الإنسان', 2, 'Dr. Amr Gamal', 'د. عمرو جمال']
      ];

      for (const c of courses) {
        await db.execute(
          'INSERT IGNORE INTO courses (code, name_en, name_ar, description_en, description_ar, credit_hours, semester, academic_year, instructor_en, instructor_ar) VALUES (?, ?, ?, ?, ?, ?, "second", "2025-2026", ?, ?)',
          c
        );
      }

      // Insert sample exam schedules
      const [courseRows] = await db.execute('SELECT id, code FROM courses');
      const courseMap = {};
      courseRows.forEach(r => courseMap[r.code] = r.id);

      const exams = [
        [courseMap['CS102'], 'midterm', '2026-04-05', '09:00', '11:00', 'Building A - Hall 1', 'المبنى أ - القاعة 1', 'A-101'],
        [courseMap['CS104'], 'midterm', '2026-04-06', '09:00', '11:00', 'Building A - Hall 2', 'المبنى أ - القاعة 2', 'A-102'],
        [courseMap['MATH102'], 'midterm', '2026-04-07', '11:00', '13:00', 'Building B - Hall 1', 'المبنى ب - القاعة 1', 'B-101'],
        [courseMap['MATH104'], 'midterm', '2026-04-08', '09:00', '11:00', 'Building B - Hall 2', 'المبنى ب - القاعة 2', 'B-102'],
        [courseMap['IS102'], 'midterm', '2026-04-09', '11:00', '13:00', 'Building A - Hall 3', 'المبنى أ - القاعة 3', 'A-103'],
        [courseMap['CS102'], 'final', '2026-06-15', '09:00', '12:00', 'Main Hall A', 'القاعة الرئيسية أ', 'A-MAIN'],
        [courseMap['CS104'], 'final', '2026-06-17', '09:00', '12:00', 'Main Hall A', 'القاعة الرئيسية أ', 'A-MAIN'],
        [courseMap['MATH102'], 'final', '2026-06-19', '09:00', '12:00', 'Main Hall B', 'القاعة الرئيسية ب', 'B-MAIN'],
        [courseMap['MATH104'], 'final', '2026-06-21', '09:00', '12:00', 'Main Hall B', 'القاعة الرئيسية ب', 'B-MAIN'],
        [courseMap['IS102'], 'final', '2026-06-23', '09:00', '12:00', 'Main Hall A', 'القاعة الرئيسية أ', 'A-MAIN'],
        [courseMap['CS106'], 'final', '2026-06-25', '09:00', '12:00', 'Lab C', 'المعمل ج', 'C-LAB']
      ];

      for (const e of exams) {
        await db.execute(
          'INSERT INTO exam_schedules (uuid, course_id, exam_type, exam_date, start_time, end_time, location_en, location_ar, hall_number, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "second", "2025-2026")',
          [uuidv4(), ...e]
        );
      }

      // Insert sample announcements
      const announcements = [
        ['Welcome to Second Semester 2026', 'مرحباً بكم في الفصل الدراسي الثاني 2026', 'Welcome first-year students!', 'مرحباً بطلاب الفرقة الأولى!', 'high', true],
        ['Midterm Schedule Published', 'تم نشر جدول امتحانات منتصف الفصل', 'Check the exam schedules section.', 'يرجى مراجعة قسم جداول الامتحانات.', 'urgent', true],
        ['New Materials Available', 'مواد جديدة متاحة', 'New lecture notes uploaded.', 'تم رفع ملاحظات محاضرات جديدة.', 'normal', false]
      ];

      for (const a of announcements) {
        await db.execute(
          'INSERT INTO announcements (uuid, title_en, title_ar, content_en, content_ar, priority, is_pinned, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [uuidv4(), ...a]
        );
      }

      console.log('✅ Sample data inserted');
    }
  } catch (error) {
    console.error('Error creating defaults:', error.message);
  }
}

// ============ FILE UPLOAD CONFIG ============
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/files'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/videos'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadFile = multer({
  storage: fileStorage,
  limits: { fileSize: (process.env.MAX_FILE_SIZE || 100) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|txt|png|jpg|jpeg|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: (process.env.MAX_VIDEO_SIZE || 500) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|avi|mkv|mov|wmv|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Invalid video format'));
  }
});

// ============ AUTH MIDDLEWARE ============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ============ PUBLIC API ROUTES ============

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM courses WHERE is_active = TRUE AND semester = "second" AND academic_year = "2025-2026" ORDER BY code'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files (with optional course filter)
app.get('/api/files', async (req, res) => {
  try {
    let sql = `SELECT f.*, c.name_en as course_name_en, c.name_ar as course_name_ar, c.code as course_code 
               FROM files f LEFT JOIN courses c ON f.course_id = c.id 
               WHERE f.is_active = TRUE`;
    const params = [];

    if (req.query.course_id) {
      sql += ' AND f.course_id = ?';
      params.push(req.query.course_id);
    }
    if (req.query.type) {
      sql += ' AND f.file_type = ?';
      params.push(req.query.type);
    }
    sql += ' ORDER BY f.created_at DESC';

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download file & increment counter
app.get('/api/files/download/:uuid', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM files WHERE uuid = ? AND is_active = TRUE', [req.params.uuid]);
    if (rows.length === 0) return res.status(404).json({ error: 'File not found' });

    await db.execute('UPDATE files SET download_count = download_count + 1 WHERE uuid = ?', [req.params.uuid]);
    res.download(rows[0].file_path, rows[0].original_name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get videos
app.get('/api/videos', async (req, res) => {
  try {
    let sql = `SELECT v.*, c.name_en as course_name_en, c.name_ar as course_name_ar, c.code as course_code 
               FROM videos v LEFT JOIN courses c ON v.course_id = c.id 
               WHERE v.is_active = TRUE`;
    const params = [];

    if (req.query.course_id) {
      sql += ' AND v.course_id = ?';
      params.push(req.query.course_id);
    }
    sql += ' ORDER BY v.created_at DESC';

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View video & increment counter
app.get('/api/videos/view/:uuid', async (req, res) => {
  try {
    await db.execute('UPDATE videos SET view_count = view_count + 1 WHERE uuid = ?', [req.params.uuid]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exam schedules
app.get('/api/exams', async (req, res) => {
  try {
    let sql = `SELECT e.*, c.name_en as course_name_en, c.name_ar as course_name_ar, c.code as course_code 
               FROM exam_schedules e LEFT JOIN courses c ON e.course_id = c.id 
               WHERE e.is_active = TRUE`;
    const params = [];

    if (req.query.type) {
      sql += ' AND e.exam_type = ?';
      params.push(req.query.type);
    }
    if (req.query.course_id) {
      sql += ' AND e.course_id = ?';
      params.push(req.query.course_id);
    }
    sql += ' ORDER BY e.exam_date ASC, e.start_time ASC';

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.*, c.name_en as course_name_en, c.name_ar as course_name_ar 
       FROM announcements a LEFT JOIN courses c ON a.course_id = c.id 
       WHERE a.is_active = TRUE AND (a.expires_at IS NULL OR a.expires_at > NOW())
       ORDER BY a.is_pinned DESC, a.priority DESC, a.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const [[files]] = await db.execute('SELECT COUNT(*) as count FROM files WHERE is_active = TRUE');
    const [[videos]] = await db.execute('SELECT COUNT(*) as count FROM videos WHERE is_active = TRUE');
    const [[exams]] = await db.execute('SELECT COUNT(*) as count FROM exam_schedules WHERE is_active = TRUE');
    const [[courses]] = await db.execute('SELECT COUNT(*) as count FROM courses WHERE is_active = TRUE');
    const [[announcements]] = await db.execute('SELECT COUNT(*) as count FROM announcements WHERE is_active = TRUE');

    res.json({
      success: true,
      data: {
        files: files.count,
        videos: videos.count,
        exams: exams.count,
        courses: courses.count,
        announcements: announcements.count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN AUTH ROUTES ============
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE (username = ? OR email = ?) AND is_active = TRUE',
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await db.execute('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await db.execute(
      'INSERT INTO activity_log (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.id, 'login', 'Admin login successful', req.ip]
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name_en: admin.full_name_en,
        full_name_ar: admin.full_name_ar,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============ ADMIN CRUD ROUTES ============

// --- FILES ---
app.post('/api/admin/files', authenticateToken, uploadFile.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { title_en, title_ar, description_en, description_ar, file_type, course_id } = req.body;
    const fileUuid = uuidv4();

    await db.execute(
      `INSERT INTO files (uuid, title_en, title_ar, description_en, description_ar, filename, original_name, file_path, file_size, mime_type, file_type, course_id, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileUuid, title_en, title_ar || title_en, description_en || '', description_ar || '',
       req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype,
       file_type || 'lecture', course_id || null, req.user.id]
    );

    await db.execute(
      'INSERT INTO activity_log (admin_id, action, entity_type, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'upload_file', 'file', `Uploaded: ${title_en}`, req.ip]
    );

    res.json({ success: true, message: 'File uploaded successfully', uuid: fileUuid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/files/:id', authenticateToken, async (req, res) => {
  try {
    const { title_en, title_ar, description_en, description_ar, file_type, course_id } = req.body;
    await db.execute(
      `UPDATE files SET title_en=?, title_ar=?, description_en=?, description_ar=?, file_type=?, course_id=? WHERE id=?`,
      [title_en, title_ar, description_en, description_ar, file_type, course_id || null, req.params.id]
    );
    res.json({ success: true, message: 'File updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/files/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM files WHERE id = ?', [req.params.id]);
    if (rows.length > 0 && fs.existsSync(rows[0].file_path)) {
      fs.unlinkSync(rows[0].file_path);
    }
    await db.execute('DELETE FROM files WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- VIDEOS ---
app.post('/api/admin/videos', authenticateToken, uploadVideo.single('video'), async (req, res) => {
  try {
    const { title_en, title_ar, description_en, description_ar, video_url, video_type, course_id, duration } = req.body;
    const videoUuid = uuidv4();
    const vType = video_type || (req.file ? 'uploaded' : 'youtube');

    await db.execute(
      `INSERT INTO videos (uuid, title_en, title_ar, description_en, description_ar, video_url, filename, file_path, file_size, mime_type, duration, video_type, course_id, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [videoUuid, title_en, title_ar || title_en, description_en || '', description_ar || '',
       video_url || '', req.file?.filename || '', req.file?.path || '', req.file?.size || 0,
       req.file?.mimetype || '', duration || '', vType, course_id || null, req.user.id]
    );

    res.json({ success: true, message: 'Video added successfully', uuid: videoUuid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/videos/:id', authenticateToken, async (req, res) => {
  try {
    const { title_en, title_ar, description_en, description_ar, video_url, course_id, duration } = req.body;
    await db.execute(
      `UPDATE videos SET title_en=?, title_ar=?, description_en=?, description_ar=?, video_url=?, course_id=?, duration=? WHERE id=?`,
      [title_en, title_ar, description_en, description_ar, video_url, course_id || null, duration, req.params.id]
    );
    res.json({ success: true, message: 'Video updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/videos/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (rows.length > 0 && rows[0].file_path && fs.existsSync(rows[0].file_path)) {
      fs.unlinkSync(rows[0].file_path);
    }
    await db.execute('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EXAM SCHEDULES ---
app.post('/api/admin/exams', authenticateToken, async (req, res) => {
  try {
    const { course_id, exam_type, exam_date, start_time, end_time, location_en, location_ar, hall_number, notes_en, notes_ar } = req.body;
    const examUuid = uuidv4();

    await db.execute(
      `INSERT INTO exam_schedules (uuid, course_id, exam_type, exam_date, start_time, end_time, location_en, location_ar, hall_number, notes_en, notes_ar, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [examUuid, course_id, exam_type, exam_date, start_time, end_time, location_en || '', location_ar || '', hall_number || '', notes_en || '', notes_ar || '', req.user.id]
    );

    res.json({ success: true, message: 'Exam schedule created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/exams/:id', authenticateToken, async (req, res) => {
  try {
    const { course_id, exam_type, exam_date, start_time, end_time, location_en, location_ar, hall_number, notes_en, notes_ar } = req.body;
    await db.execute(
      `UPDATE exam_schedules SET course_id=?, exam_type=?, exam_date=?, start_time=?, end_time=?, location_en=?, location_ar=?, hall_number=?, notes_en=?, notes_ar=? WHERE id=?`,
      [course_id, exam_type, exam_date, start_time, end_time, location_en, location_ar, hall_number, notes_en, notes_ar, req.params.id]
    );
    res.json({ success: true, message: 'Exam schedule updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/exams/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM exam_schedules WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Exam schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ANNOUNCEMENTS ---
app.post('/api/admin/announcements', authenticateToken, async (req, res) => {
  try {
    const { title_en, title_ar, content_en, content_ar, priority, is_pinned, course_id, expires_at } = req.body;
    await db.execute(
      `INSERT INTO announcements (uuid, title_en, title_ar, content_en, content_ar, priority, is_pinned, course_id, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), title_en, title_ar, content_en, content_ar, priority || 'normal', is_pinned || false, course_id || null, req.user.id, expires_at || null]
    );
    res.json({ success: true, message: 'Announcement created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const { title_en, title_ar, content_en, content_ar, priority, is_pinned, course_id } = req.body;
    await db.execute(
      `UPDATE announcements SET title_en=?, title_ar=?, content_en=?, content_ar=?, priority=?, is_pinned=?, course_id=? WHERE id=?`,
      [title_en, title_ar, content_en, content_ar, priority, is_pinned, course_id || null, req.params.id]
    );
    res.json({ success: true, message: 'Announcement updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/announcements/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- COURSES CRUD ---
app.post('/api/admin/courses', authenticateToken, async (req, res) => {
  try {
    const { code, name_en, name_ar, description_en, description_ar, credit_hours, instructor_en, instructor_ar } = req.body;
    await db.execute(
      `INSERT INTO courses (code, name_en, name_ar, description_en, description_ar, credit_hours, semester, academic_year, instructor_en, instructor_ar)
       VALUES (?, ?, ?, ?, ?, ?, 'second', '2025-2026', ?, ?)`,
      [code, name_en, name_ar, description_en || '', description_ar || '', credit_hours || 3, instructor_en || '', instructor_ar || '']
    );
    res.json({ success: true, message: 'Course created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/courses/:id', authenticateToken, async (req, res) => {
  try {
    const { code, name_en, name_ar, description_en, description_ar, credit_hours, instructor_en, instructor_ar } = req.body;
    await db.execute(
      `UPDATE courses SET code=?, name_en=?, name_ar=?, description_en=?, description_ar=?, credit_hours=?, instructor_en=?, instructor_ar=? WHERE id=?`,
      [code, name_en, name_ar, description_en, description_ar, credit_hours, instructor_en, instructor_ar, req.params.id]
    );
    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/courses/:id', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin stats
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const [[files]] = await db.execute('SELECT COUNT(*) as count, COALESCE(SUM(file_size),0) as total_size FROM files');
    const [[videos]] = await db.execute('SELECT COUNT(*) as count FROM videos');
    const [[exams]] = await db.execute('SELECT COUNT(*) as count FROM exam_schedules');
    const [[courses]] = await db.execute('SELECT COUNT(*) as count FROM courses');
    const [[announcements]] = await db.execute('SELECT COUNT(*) as count FROM announcements');
    const [[downloads]] = await db.execute('SELECT COALESCE(SUM(download_count),0) as total FROM files');
    const [[views]] = await db.execute('SELECT COALESCE(SUM(view_count),0) as total FROM videos');
    const [recentActivity] = await db.execute(
      'SELECT al.*, a.username FROM activity_log al LEFT JOIN admins a ON al.admin_id = a.id ORDER BY al.created_at DESC LIMIT 20'
    );

    res.json({
      success: true,
      data: {
        files: files.count,
        total_file_size: files.total_size,
        videos: videos.count,
        exams: exams.count,
        courses: courses.count,
        announcements: announcements.count,
        total_downloads: downloads.total,
        total_views: views.total,
        recent_activity: recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity log
app.get('/api/admin/activity', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT al.*, a.username FROM activity_log al LEFT JOIN admins a ON al.admin_id = a.id ORDER BY al.created_at DESC LIMIT 50'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎓 FCI Zagazig University Portal                          ║
║   📚 First Year - Second Semester 2025-2026                  ║
║                                                              ║
║   🌐 Server running on: http://localhost:${PORT}              ║
║   👤 Admin panel: http://localhost:${PORT}/admin              ║
║                                                              ║
║   Default Admin Login:                                       ║
║   Username: admin                                            ║
║   Password: Admin@FCI2026                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
});