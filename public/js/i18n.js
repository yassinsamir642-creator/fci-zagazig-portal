// public/js/i18n.js
const translations = {
  en: {
    loading: "Loading...",
    admin_panel: "Admin Panel",
    subtitle: "Zagazig University | First Year - Second Semester 2025/2026",
    nav_home: "Home",
    nav_courses: "Courses",
    nav_files: "Files & Materials",
    nav_videos: "Videos",
    nav_exams: "Exam Schedule",
    nav_announcements: "Announcements",
    hero_title: "Welcome, First Year Students! 🎓",
    hero_desc: "Your complete academic portal for the Second Semester 2025/2026. Access all your course materials, exam schedules, and important announcements in one place.",
    view_exams: "📅 View Exam Schedule",
    browse_materials: "📁 Browse Materials",
    stat_courses: "Courses",
    stat_files: "Files",
    stat_videos: "Videos",
    stat_exams: "Exams",
    latest_announcements: "📢 Latest Announcements",
    courses_title: "📚 Second Semester Courses 2025/2026",
    courses_desc: "All courses for first-year students this semester",
    files_title: "📁 Files & Course Materials",
    files_desc: "Download lectures, assignments, and reference materials",
    videos_title: "🎬 Educational Videos",
    videos_desc: "Watch course lectures and tutorials",
    exams_title: "📅 Exam Schedule",
    exams_desc: "Midterm and final exam schedules for the second semester",
    announcements_title: "📢 Announcements",
    announcements_desc: "Important news and updates",
    all_courses: "All Courses",
    all_types: "All Types",
    all_exams: "All Exams",
    lecture: "Lecture",
    section: "Section",
    assignment: "Assignment",
    reference: "Reference",
    other: "Other",
    midterm: "Midterm",
    final_exam: "Final",
    quiz: "Quiz",
    practical: "Practical",
    oral: "Oral",
    th_course: "Course",
    th_type: "Type",
    th_date: "Date",
    th_time: "Time",
    th_location: "Location",
    th_notes: "Notes",
    no_files: "No files available yet",
    no_videos: "No videos available yet",
    no_exams: "No exam schedules available yet",
    no_announcements: "No announcements yet",
    download: "Download",
    views: "views",
    downloads: "downloads",
    credit_hours: "Credit Hours",
    instructor: "Instructor",
    footer_about: "About",
    footer_about_text: "Faculty of Computers and Information, Zagazig University. Preparing the next generation of technology leaders.",
    footer_links: "Quick Links",
    footer_zu: "Zagazig University",
    footer_contact: "Contact",
    footer_address: "Zagazig, Sharqia, Egypt",
    footer_copyright: "Faculty of Computers & Information - Zagazig University. All rights reserved.",
    pinned: "📌 Pinned",
    // Admin translations
    admin_login: "Admin Login",
    username: "Username",
    password: "Password",
    login: "Login",
    login_error: "Invalid username or password",
    dashboard: "Dashboard",
    manage_files: "Manage Files",
    manage_videos: "Manage Videos",
    manage_exams: "Manage Exams",
    manage_courses: "Manage Courses",
    manage_announcements: "Announcements",
    activity_log: "Activity Log",
    logout: "Logout",
    add_new: "Add New",
    title_en: "Title (English)",
    title_ar: "Title (Arabic)",
    desc_en: "Description (English)",
    desc_ar: "Description (Arabic)",
    select_course: "Select Course",
    file_type: "File Type",
    choose_file: "Choose File",
    video_url: "Video URL (YouTube)",
    video_type: "Video Type",
    uploaded: "Upload Video",
    youtube: "YouTube Link",
    external: "External Link",
    duration: "Duration",
    exam_type: "Exam Type",
    exam_date: "Exam Date",
    start_time: "Start Time",
    end_time: "End Time",
    location_en: "Location (English)",
    location_ar: "Location (Arabic)",
    hall_number: "Hall Number",
    notes_en: "Notes (English)",
    notes_ar: "Notes (Arabic)",
    priority: "Priority",
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
    pin_announcement: "Pin Announcement",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    confirm_delete: "Are you sure you want to delete this item?",
    total_downloads: "Total Downloads",
    total_views: "Total Views",
    total_size: "Total Storage",
    course_code: "Course Code",
    course_name_en: "Course Name (English)",
    course_name_ar: "Course Name (Arabic)",
    no_data: "No data available"
  },
  ar: {
    loading: "جاري التحميل...",
    admin_panel: "لوحة التحكم",
    subtitle: "جامعة الزقازيق | الفرقة الأولى - الفصل الدراسي الثاني 2025/2026",
    nav_home: "الرئيسية",
    nav_courses: "المقررات",
    nav_files: "الملفات والمواد",
    nav_videos: "الفيديوهات",
    nav_exams: "جدول الامتحانات",
    nav_announcements: "الإعلانات",
    hero_title: "مرحباً بطلاب الفرقة الأولى! 🎓",
    hero_desc: "بوابتك الأكاديمية الشاملة للفصل الدراسي الثاني 2025/2026. يمكنك الوصول إلى جميع المواد الدراسية وجداول الامتحانات والإعلانات المهمة في مكان واحد.",
    view_exams: "📅 عرض جدول الامتحانات",
    browse_materials: "📁 تصفح المواد",
    stat_courses: "مقررات",
    stat_files: "ملفات",
    stat_videos: "فيديوهات",
    stat_exams: "امتحانات",
    latest_announcements: "📢 آخر الإعلانات",
    courses_title: "📚 مقررات الفصل الدراسي الثاني 2025/2026",
    courses_desc: "جميع مقررات طلاب الفرقة الأولى هذا الفصل",
    files_title: "📁 الملفات والمواد الدراسية",
    files_desc: "حمّل المحاضرات والتكليفات والمراجع",
    videos_title: "🎬 الفيديوهات التعليمية",
    videos_desc: "شاهد محاضرات ودروس المقررات",
    exams_title: "📅 جدول الامتحانات",
    exams_desc: "جداول امتحانات منتصف ونهاية الفصل الدراسي الثاني",
    announcements_title: "📢 الإعلانات",
    announcements_desc: "الأخبار والتحديثات المهمة",
    all_courses: "جميع المقررات",
    all_types: "جميع الأنواع",
    all_exams: "جميع الامتحانات",
    lecture: "محاضرة",
    section: "سكشن",
    assignment: "تكليف",
    reference: "مرجع",
    other: "أخرى",
    midterm: "منتصف الفصل",
    final_exam: "نهاية الفصل",
    quiz: "كويز",
    practical: "عملي",
    oral: "شفهي",
    th_course: "المقرر",
    th_type: "النوع",
    th_date: "التاريخ",
    th_time: "الوقت",
    th_location: "المكان",
    th_notes: "ملاحظات",
    no_files: "لا توجد ملفات متاحة حتى الآن",
    no_videos: "لا توجد فيديوهات متاحة حتى الآن",
    no_exams: "لا توجد جداول امتحانات متاحة حتى الآن",
    no_announcements: "لا توجد إعلانات حتى الآن",
    download: "تحميل",
    views: "مشاهدات",
    downloads: "تحميلات",
    credit_hours: "ساعات معتمدة",
    instructor: "المحاضر",
    footer_about: "حول",
    footer_about_text: "كلية الحاسبات والمعلومات، جامعة الزقازيق. إعداد الجيل القادم من قادة التكنولوجيا.",
    footer_links: "روابط سريعة",
    footer_zu: "جامعة الزقازيق",
    footer_contact: "اتصل بنا",
    footer_address: "الزقازيق، الشرقية، مصر",
    footer_copyright: "كلية الحاسبات والمعلومات - جامعة الزقازيق. جميع الحقوق محفوظة.",
    pinned: "📌 مثبت",
    admin_login: "تسجيل دخول المسؤول",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    login_error: "اسم المستخدم أو كلمة المرور غير صحيحة",
    dashboard: "لوحة المعلومات",
    manage_files: "إدارة الملفات",
    manage_videos: "إدارة الفيديوهات",
    manage_exams: "إدارة الامتحانات",
    manage_courses: "إدارة المقررات",
    manage_announcements: "الإعلانات",
    activity_log: "سجل النشاط",
    logout: "تسجيل الخروج",
    add_new: "إضافة جديد",
    title_en: "العنوان (إنجليزي)",
    title_ar: "العنوان (عربي)",
    desc_en: "الوصف (إنجليزي)",
    desc_ar: "الوصف (عربي)",
    select_course: "اختر المقرر",
    file_type: "نوع الملف",
    choose_file: "اختر ملف",
    video_url: "رابط الفيديو (يوتيوب)",
    video_type: "نوع الفيديو",
    uploaded: "رفع فيديو",
    youtube: "رابط يوتيوب",
    external: "رابط خارجي",
    duration: "المدة",
    exam_type: "نوع الامتحان",
    exam_date: "تاريخ الامتحان",
    start_time: "وقت البداية",
    end_time: "وقت النهاية",
    location_en: "المكان (إنجليزي)",
    location_ar: "المكان (عربي)",
    hall_number: "رقم القاعة",
    notes_en: "ملاحظات (إنجليزي)",
    notes_ar: "ملاحظات (عربي)",
    priority: "الأولوية",
    low: "منخفضة",
    normal: "عادية",
    high: "عالية",
    urgent: "عاجلة",
    pin_announcement: "تثبيت الإعلان",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    confirm_delete: "هل أنت متأكد من حذف هذا العنصر؟",
    total_downloads: "إجمالي التحميلات",
    total_views: "إجمالي المشاهدات",
    total_size: "إجمالي التخزين",
    course_code: "كود المقرر",
    course_name_en: "اسم المقرر (إنجليزي)",
    course_name_ar: "اسم المقرر (عربي)",
    no_data: "لا توجد بيانات"
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function t(key) {
  return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translation;
    } else {
      el.textContent = translation;
    }
  });
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  
  const html = document.documentElement;
  if (lang === 'ar') {
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'ar');
    document.body.style.fontFamily = 'var(--font-ar)';
  } else {
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', 'en');
    document.body.style.fontFamily = 'var(--font-en)';
  }
  
  const langText = document.getElementById('lang-text');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'English' : 'العربية';
  }
  
  applyTranslations();
}

function toggleLanguage() {
  setLanguage(currentLang === 'en' ? 'ar' : 'en');
  // Refresh dynamic content
  if (typeof loadAllData === 'function') loadAllData();
}

// Helper functions for localized field
function getLocalField(item, field) {
  if (currentLang === 'ar') {
    return item[`${field}_ar`] || item[`${field}_en`] || '';
  }
  return item[`${field}_en`] || item[`${field}_ar`] || '';
}