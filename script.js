// script.js - موقع نوات ستيم
// المعلمة: أستاذة أميرة عبدالله الحكمي

'use strict';

// ===== الحالة العامة =====
const state = {
  currentSection: 'lessons',
  currentGrade: null,
  currentUnit: null,
  currentLesson: null,
  currentSemester: 1,
  selectedGradeId: 'grade1',
  currentGradeData: null,
  quiz: {
    lessonId: null,
    questions: [],
    current: 0,
    score: 0,
    timer: null,
    timeLeft: 20,
    answered: false
  },
  game: {
    lessonId: null,
    data: null,
    score: 0,
    total: 0,
    matchSelected: null
  }
};

// نقاط مخزّنة
const scores = JSON.parse(localStorage.getItem('nawat_scores') || '{}');

// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', () => {
  showLanding();
  setupKeyboardNav();
});

// ============================================================
// ===== منطق Landing Page =====
// ============================================================

function showLanding() {
  const landingEl = document.getElementById('landing-page');
  const appEl = document.getElementById('app-content');
  if (landingEl) landingEl.style.display = 'block';
  if (appEl) appEl.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enterApp(gradeId = state.selectedGradeId || 'grade1') {
  state.selectedGradeId = gradeId;
  state.currentSemester = 1;
  state.currentGrade = null;
  state.currentGradeData = null;
  state.currentUnit = null;
  state.currentLesson = null;

  const landingEl = document.getElementById('landing-page');
  const appEl = document.getElementById('app-content');

  if (landingEl) {
    landingEl.style.opacity = '0';
    landingEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      landingEl.style.display = 'none';
      landingEl.style.opacity = '';
      landingEl.style.transition = '';
    }, 300);
  }

  if (appEl) {
    appEl.style.display = 'block';
    appEl.style.opacity = '0';
    appEl.style.transition = 'opacity 0.35s ease';
    setTimeout(() => { appEl.style.opacity = '1'; }, 30);
    setTimeout(() => {
      appEl.style.opacity = '';
      appEl.style.transition = '';
    }, 400);
  }

  renderLessonsSection();
  renderGamesSection();
  renderQuizSection();
  initChatbot();
  showUnits(state.selectedGradeId);
  updateAppGradeChip();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToLanding() {
  if (state.quiz.timer) {
    clearInterval(state.quiz.timer);
    state.quiz.timer = null;
  }
  showLanding();
}

function scrollToGrades() {
  const section = document.getElementById('grades-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== التنقل بين الأقسام =====
function showSection(name) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById(`section-${name}`);
  if (panel) panel.classList.add('active');

  const btns = document.querySelectorAll('.nav-btn');
  const idx = ['lessons', 'games', 'quiz', 'chatbot'].indexOf(name);
  if (btns[idx]) {
    btns[idx].classList.add('active');
    btns[idx].setAttribute('aria-selected', 'true');
  }

  state.currentSection = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAppGradeChip() {
  const chip = document.getElementById('currentGradeChip');
  if (!chip) return;
  const grade = state.currentGradeData || state.currentGrade || getPrimaryGrade(state.selectedGradeId);
  chip.textContent = grade ? grade.name.replace(' الابتدائي','') : 'نوات ستيم';
  chip.title = grade ? grade.name : 'نوات ستيم';
}

function setupKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'BUTTON') e.target.click();
    if (e.key === 'Escape') {
      const backBtn = document.querySelector('.btn-back:not([style*="none"])');
      if (backBtn) backBtn.click();
    }
  });
}

// ============================================================
// ===== مساعد: بيانات الصفوف والفصول =====
// ============================================================

function getPrimaryGrade(gradeId) {
  const gradeSources = [
    window.nawatData,
    window.grade2Data,
    window.grade3Data,
    window.grade4Data,
    window.grade5Data,
    window.grade6Data
  ].filter(Boolean);

  for (const source of gradeSources) {
    if (!source.grades) continue;
    const grade = source.grades.find(g => g.id === gradeId);
    if (grade) return grade;
  }
  return null;
}

function getAvailableGrades() {
  return ['grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6']
    .map(getPrimaryGrade)
    .filter(Boolean);
}

function getAvailableSemestersForGrade(gradeId) {
  if (gradeId === 'grade2' && window.grade2Data) {
    return Array.isArray(grade2Data.availableSemesters) ? grade2Data.availableSemesters : [1];
  }
  if (gradeId === 'grade3' && window.grade3Data) {
    return Array.isArray(grade3Data.availableSemesters) ? grade3Data.availableSemesters : [1];
  }
  if (gradeId === 'grade4' && window.grade4Data) {
    return Array.isArray(grade4Data.availableSemesters) ? grade4Data.availableSemesters : [1];
  }
  if (gradeId === 'grade5' && window.grade5Data) {
    return Array.isArray(grade5Data.availableSemesters) ? grade5Data.availableSemesters : [1];
  }
  if (gradeId === 'grade6' && window.grade6Data) {
    return Array.isArray(grade6Data.availableSemesters) ? grade6Data.availableSemesters : [1];
  }
  const semesters = [1];
  if (gradeId === 'grade1' && window.semester2Data && semester2Data.grades && semester2Data.grades.length) semesters.push(2);
  return semesters;
}

function getAllLessonsFlat(gradeId = state.selectedGradeId) {
  const result = [];

  if (gradeId === 'grade2' || gradeId === 'grade3' || gradeId === 'grade4' || gradeId === 'grade5' || gradeId === 'grade6') {
    const source = gradeId === 'grade2'
      ? window.grade2Data
      : (gradeId === 'grade3'
        ? window.grade3Data
        : (gradeId === 'grade4'
          ? window.grade4Data
          : (gradeId === 'grade5' ? window.grade5Data : window.grade6Data)));
    if (source && source.grades) {
      const grade = source.grades.find(g => g.id === gradeId) || source.grades[0];
      if (grade) {
        (grade.units || []).forEach(unit => {
          (unit.lessons || []).forEach(lesson => result.push({ lesson, unit, grade, semester: 1 }));
        });
      }
    }
    return result;
  }

  if (window.nawatData && nawatData.grades) {
    const grade = nawatData.grades.find(g => g.id === gradeId);
    if (grade) {
      (grade.units || []).forEach(unit => {
        (unit.lessons || []).forEach(lesson => result.push({ lesson, unit, grade, semester: 1 }));
      });
    }
  }

  if (gradeId === 'grade1' && window.semester2Data && semester2Data.grades) {
    const sem2Grade = semester2Data.grades.find(g => g.id === 'grade1-s2' || g.id === 'grade1') || semester2Data.grades[0];
    if (sem2Grade && semester2Data.lessons) {
      (sem2Grade.units || []).forEach((unit, idx) => {
        const normalizedUnit = {
          id: unit.id,
          number: unit.number || idx + 1,
          name: unit.title || unit.name,
          icon: unit.icon || '📗',
          color: unit.color || '#4CAF50',
          lessons: (unit.lessons || []).map(id => semester2Data.lessons.find(l => l.id === id)).filter(Boolean)
        };
        normalizedUnit.lessons.forEach(lesson => result.push({ lesson, unit: normalizedUnit, grade: sem2Grade, semester: 2 }));
      });
    }
  }

  return result;
}

function getCloudLessonPrintCss() {
  return `:root{--navy:#183f64;--navy-deep:#122f4a;--blue:#0e79b7;--text:#17324a;--muted:#58728a;--line:#d8e0e7;--paper:#ffffff;--page-bg:#edf3f7}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:"IBM Plex Sans Arabic","Tajawal","Cairo",sans-serif;background:var(--page-bg);color:var(--text);direction:rtl}.toolbar{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;background:rgba(237,243,247,.96);backdrop-filter:blur(10px);border-bottom:1px solid rgba(24,63,100,.08)}.toolbar-note{color:var(--muted);font-size:15px}.print-button{border:0;border-radius:14px;background:var(--navy);color:#fff;font:inherit;font-size:16px;font-weight:700;padding:10px 18px;cursor:pointer}.document{width:min(100%,920px);margin:0 auto;padding:24px 12px 42px}.sheet{position:relative;width:210mm;min-height:297mm;margin:0 auto 18px;background:var(--paper);box-shadow:0 20px 50px rgba(15,29,45,.12);overflow:hidden}.sheet::after{content:"";position:absolute;right:0;bottom:0;left:0;height:18mm;background:repeating-linear-gradient(to left,rgba(24,63,100,.12) 0 1mm,transparent 1mm 5mm);opacity:.45}.sheet-inner{position:relative;padding:14mm 12mm 18mm}.top-strip{display:grid;grid-template-columns:22mm 1fr 22mm;align-items:center;gap:6mm;margin-bottom:11mm}.top-strip .cap{height:13mm;border-radius:0 0 4mm 4mm;background:var(--blue)}.top-strip .title-bar{min-height:13mm;border-radius:0 0 4mm 4mm;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:flex-end;padding:0 7mm;font-size:20px;font-weight:700}.hero-block{border-radius:5mm;background:var(--navy);color:#fff;padding:8mm 9mm;margin-bottom:6mm}.hero-block h1{margin:0 0 3mm;font-size:24px;line-height:1.35;font-weight:700}.hero-block p{margin:0;font-size:17px;line-height:1.75}.inline-meta{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-bottom:8mm}.info-box{border-radius:4mm;background:var(--navy);color:#fff;padding:5.5mm 6mm;min-height:26mm}.info-box p{margin:0;font-size:16px;line-height:1.85;font-weight:700}.two-col{display:grid;grid-template-columns:30mm 1fr;gap:6mm;margin-bottom:6mm;align-items:start}.label-box{border-radius:0 0 0 4mm;background:var(--blue);color:#fff;padding:4mm 3mm;min-height:20mm;display:flex;align-items:center;justify-content:center;text-align:center;font-size:17px;font-weight:700;line-height:1.35}.content-box{border-radius:4mm;background:var(--navy);color:#fff;padding:4.5mm 6mm;min-height:20mm}.content-box.light{background:#fff;color:var(--text);border:.4mm solid var(--line)}.content-box p,.content-box li,.content-box strong{margin:0;font-size:16px;line-height:1.9}.content-box ul,.content-box ol{margin:0;padding:0 5mm 0 0}.content-box li+li{margin-top:1.2mm}.stem-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.stem-panel{border:.4mm solid var(--line);border-radius:4mm;overflow:hidden;background:#fff}.stem-panel h3{margin:0;padding:3.5mm 5mm;background:var(--navy);color:#fff;font-size:16px;line-height:1.4}.stem-panel p{margin:0;padding:4.5mm 5mm 5mm;font-size:15px;line-height:1.85;min-height:29mm}.tools-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}.tool-item{text-align:center;padding:4mm;border:.4mm solid var(--line);border-radius:3mm;background:linear-gradient(180deg,#f8fbfd,#edf3f7);min-height:20mm;display:flex;align-items:center;justify-content:center}.tool-item span{font-size:15px;font-weight:700;color:var(--navy)}.worksheet-box{min-height:122mm;border:.5mm solid #6c7e8f;background:#fff;padding:8mm}.worksheet-box h3{margin:0 0 5mm;text-align:center;font-size:20px}.worksheet-box p{margin:0 0 3mm;font-size:15px;line-height:1.85}.rubric{width:100%;border-collapse:collapse}.rubric th,.rubric td{border:.4mm solid #8ea0b1;padding:3.2mm;text-align:right;vertical-align:top;font-size:14px;line-height:1.7}.rubric thead th{background:var(--navy);color:#fff}.page-number{position:absolute;right:12mm;bottom:6mm;width:8mm;height:8mm;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}.print-credit{margin-top:8mm;padding-top:4mm;border-top:.4mm solid #c9d4de;text-align:center;font-size:17px;font-weight:700;color:var(--navy)}.section-title{margin:0 0 5mm;padding:3.4mm 5mm;border-radius:3mm;background:var(--navy);color:#fff;font-size:18px;font-weight:800}.section-card{border:.4mm solid var(--line);border-radius:4mm;background:#fff;padding:5mm;margin-bottom:5mm}.section-card h3{margin:0 0 3mm;color:var(--navy);font-size:17px}.section-card p,.section-card li{font-size:14.5px;line-height:1.75;margin:0}.section-card ul,.section-card ol{margin:0;padding:0 5mm 0 0}.chips{display:flex;flex-wrap:wrap;gap:2.5mm}.chip{padding:2.5mm 4mm;border:.35mm solid var(--line);border-radius:99px;background:#f6fafc;font-size:13.5px;font-weight:700;color:var(--navy)}.compact-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.compact-table{width:100%;border-collapse:collapse;table-layout:fixed}.compact-table th,.compact-table td{border:.35mm solid #94a7b8;padding:2.7mm;vertical-align:top;text-align:right;font-size:12.5px;line-height:1.55}.compact-table th{background:var(--navy);color:#fff}.compact-table .time-col{width:18mm}.compact-table .stage-col{width:27mm}.worksheet-page .worksheet-box{min-height:190mm}.worksheet-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:5mm}.worksheet-meta div{border:.35mm solid var(--line);border-radius:3mm;padding:3mm;text-align:center;background:#f7fafc;font-size:13px;line-height:1.45}.worksheet-prompt{white-space:pre-line;font-size:15px;line-height:1.9}.answer-lines{margin-top:6mm;background:repeating-linear-gradient(to bottom,transparent 0 9mm,#cdd8e1 9mm 9.35mm);min-height:105mm}.note-box{border-right:2mm solid var(--blue);background:#f6fafc;padding:4mm 5mm;margin-bottom:4mm;border-radius:2mm;font-size:14px;line-height:1.75}.safety-box{border:.4mm solid #e0a33a;background:#fffaf0;padding:4mm 5mm;border-radius:3mm;font-size:14px;line-height:1.75}.project-box{border:.5mm solid var(--navy);border-radius:4mm;padding:6mm;background:#fbfdff}.small-text{font-size:13px!important;line-height:1.6!important}.question-list{display:flex;flex-direction:column;gap:4mm}.question-card{border:.35mm solid #cbd7e1;border-radius:3mm;padding:4mm 5mm;background:#fff;break-inside:avoid}.question-card .q-head{font-size:15px;font-weight:800;color:var(--navy);line-height:1.7;margin-bottom:2.5mm}.question-card .q-type{display:inline-block;margin-left:2mm;padding:1mm 2.5mm;border-radius:99px;background:#edf4f8;color:var(--blue);font-size:11.5px;font-weight:800}.option-grid{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm 5mm;font-size:13.5px;line-height:1.7}.option-item{display:flex;gap:2mm;align-items:flex-start}.bubble{width:5mm;height:5mm;border:.35mm solid #7f94a6;border-radius:50%;flex:0 0 auto;margin-top:.7mm}.tf-row{display:flex;gap:10mm;font-size:14px;font-weight:700}.blank-line{display:inline-block;min-width:45mm;border-bottom:.35mm solid #667b8e;height:5mm;vertical-align:bottom}.short-lines{margin-top:2mm;background:repeating-linear-gradient(to bottom,transparent 0 8mm,#d6e0e8 8mm 8.3mm);min-height:24mm}.order-list{margin:0;padding-right:6mm}.order-list li{margin-bottom:2mm;font-size:13.5px;line-height:1.65}.match-table{width:100%;border-collapse:collapse}.match-table td{border:.3mm solid #b7c5d1;padding:2.5mm;font-size:13px;line-height:1.55}.question-note{font-size:12px;color:var(--muted);margin-top:2mm}@page{size:A4;margin:0}@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:none}.document{width:auto;margin:0;padding:0}.sheet{width:210mm;min-height:297mm;margin:0;box-shadow:none;overflow:hidden;break-after:page;page-break-after:always}}`;
}

function renderWorksheetQuestion(q, idx) {
  if (!q) return '';
  const type = q.type || 'short';
  const labels = {
    mcq: 'اختيار من متعدد',
    trueFalse: 'صح أم خطأ',
    fill: 'أكمل',
    short: 'إجابة قصيرة',
    explain: 'فسر / علل',
    order: 'رتب',
    match: 'صل'
  };
  const head = `<div class="q-head"><span class="q-type">${labels[type] || 'سؤال'}</span>${idx + 1}) ${q.text || ''}</div>`;
  if (type === 'mcq') {
    return `<div class="question-card">${head}<div class="option-grid">${(q.options || []).map(o => `<div class="option-item"><span class="bubble"></span><span>${o}</span></div>`).join('')}</div></div>`;
  }
  if (type === 'trueFalse') {
    return `<div class="question-card">${head}<div class="tf-row"><span>□ صح</span><span>□ خطأ</span></div></div>`;
  }
  if (type === 'fill') {
    return `<div class="question-card">${head}<div><span class="blank-line"></span></div></div>`;
  }
  if (type === 'order') {
    return `<div class="question-card">${head}<ol class="order-list">${(q.items || []).map(x => `<li>___ &nbsp; ${x}</li>`).join('')}</ol></div>`;
  }
  if (type === 'match') {
    const letters = ['أ','ب','ج','د','هـ','و'];
    const pairs = q.pairs || [];
    const rights = pairs.map(p => p.right);
    const rotated = rights.length > 1 ? rights.slice(1).concat(rights.slice(0,1)) : rights;
    return `<div class="question-card">${head}<table class="match-table"><tbody>${pairs.map((p,i) => `<tr><td>${i+1}. ${p.left}</td><td style="width:20mm;text-align:center">_____</td><td>${letters[i] || '-'} . ${rotated[i] || ''}</td></tr>`).join('')}</tbody></table></div>`;
  }
  return `<div class="question-card">${head}<div class="short-lines" style="min-height:${q.lines ? Math.max(16, q.lines * 8) : 24}mm"></div></div>`;
}

function buildMagnetStyleLessonSheets(lesson, unit, grade) {
  const unitNumber = unit.number || '';
  const unitTitle = unit.name || unit.title || '';
  const gradeName = (grade && grade.name) || 'الصف الثالث الابتدائي';
  const stem = lesson.stem || {};
  const act = lesson.stemActivity || {};
  const escList = (arr) => (arr || []).map(x => `<li>${x}</li>`).join('');
  const chips = (arr) => (arr || []).map(x => `<span class="chip">${x}</span>`).join('');
  const concepts = (lesson.concepts || []).map(c => `<li><strong>${c.term || c}:</strong> ${c.definition || ''}</li>`).join('');
  const activities = (lesson.accompanyingActivities || []).map((a,i) => `
    <tr><td>${i+1}</td><td>${a.name || ''}</td><td>${a.type || ''}</td><td>${a.source || ''}</td></tr>
  `).join('');
  const flowRows = (lesson.lessonFlow || []).map(x => `
    <tr><td>${x.stage || ''}</td><td>${x.teacherRole || ''}</td><td>${x.studentRole || ''}</td><td>${x.time || ''}</td></tr>
  `).join('');
  const rubricRows = (lesson.rubric || []).map(r => `
    <tr><td>${r.criterion || ''}</td><td>${r.excellent || ''}</td><td>${r.good || ''}</td><td>${r.needsSupport || ''}</td></tr>
  `).join('');
  const pageHead = (title) => `<div class="top-strip"><div class="cap"></div><div class="title-bar">${title}</div><div class="cap"></div></div>`;
  const pageNum = (n) => `<div class="page-number">${n}</div>`;
  const worksheets = (lesson.worksheets || []).map((w,idx) => `
    <section class="sheet worksheet-page"><div class="sheet-inner">
      ${pageHead(w.title || `ورقة عمل (${idx+1})`)}
      <div class="worksheet-meta">
        <div><strong>رقم النشاط</strong><br>${w.number || idx+1}</div>
        <div><strong>الزمن</strong><br>عمل ${w.workMinutes || '-'} د / مناقشة ${w.discussionMinutes || '-'} د</div>
        <div><strong>أسلوب التنفيذ</strong><br>${w.execution || 'فردي'}</div>
        <div><strong>هدف النشاط</strong><br>${w.objective || ''}</div>
      </div>
      <div class="worksheet-box">
        <h3>${w.title || `ورقة عمل (${idx+1})`}</h3>
        ${Array.isArray(w.questions) && w.questions.length
          ? `<div class="question-list">${w.questions.map((q,qIdx) => renderWorksheetQuestion(q,qIdx)).join('')}</div><div class="question-note">مساحة إضافية للإجابة / الملاحظات:</div><div class="answer-lines" style="min-height:18mm"></div>`
          : `<p class="worksheet-prompt">${w.prompt || ''}</p><div class="answer-lines"></div>`}
      </div>
      ${pageNum(8+idx)}
    </div></section>
  `).join('');

  return `
  <section class="sheet"><div class="sheet-inner" style="min-height:297mm;display:flex;flex-direction:column;justify-content:center">
    <div style="text-align:center;margin-bottom:18mm">
      <div style="font-size:18px;font-weight:800;color:var(--muted);margin-bottom:7mm">سلسلة الدروس النموذجية التعليمية STEM</div>
      <div style="font-size:42px;font-weight:900;color:var(--navy);line-height:1.35;margin-bottom:9mm">${lesson.title || ''}</div>
      <div style="width:44mm;height:2.5mm;background:var(--blue);margin:0 auto 10mm;border-radius:99px"></div>
      <div style="font-size:23px;font-weight:800;color:var(--navy)">العلوم - ${gradeName}</div>
      <div style="font-size:19px;color:var(--muted);margin-top:3mm">الفصل الدراسي الأول</div>
    </div>
    <div class="hero-block" style="margin:0 auto;width:82%;text-align:center">
      <p>الوحدة ${unitNumber}: ${unitTitle}</p>
      <p>${lesson.chapter || ''}</p>
      <p style="margin-top:4mm">إعداد أ. أميرة عبدالله الحكمي | نوات ستيم</p>
    </div>
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead(lesson.title || '')}
    <div class="hero-block">
      <h1>اسم الدرس: ${lesson.title || ''}</h1>
      <p>المبحث: العلوم | الصف: ${gradeName}</p>
      <p>رقم الوحدة وعنوانها: الوحدة ${unitNumber} - ${unitTitle}</p>
      <p>${lesson.chapter || ''} | الفصل الدراسي الأول</p>
    </div>
    <div class="inline-meta">
      <div class="info-box">
        <p>عدد الجلسات: ${lesson.sessions || 'جلستان'}</p>
        <p>مدة الدرس: ${lesson.duration || '90 دقيقة'}</p>
      </div>
      <div class="info-box">
        <p>مصادر التعلم: ${lesson.resources || ''}</p>
        <p>مرجع الكتاب: ${lesson.bookPages || ''}</p>
      </div>
    </div>
    <div class="two-col"><div class="label-box">الوسائل التعليمية</div><div class="content-box light"><p>${lesson.teachingAids || ''}</p></div></div>
    <div class="two-col"><div class="label-box">الأهداف التعليمية</div><div class="content-box"><ul>${escList(lesson.objectives)}</ul></div></div>
    <div class="two-col"><div class="label-box">ملخص الدرس</div><div class="content-box light"><p>${lesson.summary || ''}</p></div></div>
    ${pageNum(1)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('تكامل العلوم والتقنية والهندسة والرياضيات STEM')}
    <div class="stem-grid">
      <div class="stem-panel"><h3>Science | العلوم</h3><p>${stem.science || ''}</p></div>
      <div class="stem-panel"><h3>Technology | التقنية</h3><p>${stem.technology || ''}</p></div>
      <div class="stem-panel"><h3>Engineering | الهندسة</h3><p>${stem.engineering || ''}</p></div>
      <div class="stem-panel"><h3>Mathematics | الرياضيات</h3><p>${stem.mathematics || ''}</p></div>
    </div>
    <div class="section-title" style="margin-top:7mm">المحتوى العلمي والمفاهيم</div>
    <div class="section-card"><p>${lesson.content || lesson.summary || ''}</p></div>
    <div class="section-card"><h3>المفاهيم والمفردات</h3><ul>${concepts}</ul></div>
    <div class="section-card"><h3>الأفكار الرئيسة للدرس</h3><ul>${escList(lesson.mainIdeas)}</ul></div>
    ${pageNum(2)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('عادات العقل ومهارات القرن الحادي والعشرين')}
    <div class="compact-grid">
      <div class="section-card"><h3>عادات العقل</h3><ul>${escList(lesson.habitsOfMind)}</ul></div>
      <div class="section-card"><h3>مهارات القرن الحادي والعشرين</h3><ul>${escList(lesson.skills21)}</ul></div>
    </div>
    <div class="section-card"><h3>توجيه الأسئلة</h3><ul>${escList(lesson.guidingQuestions)}</ul></div>
    <div class="section-card"><h3>المفردات</h3><div class="chips">${chips(lesson.vocabulary)}</div></div>
    <div class="section-card"><h3>معالجة المفاهيم الشائعة (غير الصحيحة) عند الطلبة</h3><ul>${escList(lesson.misconceptions)}</ul></div>
    ${pageNum(3)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('الفروق الفردية والتعلم السابق')}
    <div class="section-card"><h3>الفروق الفردية</h3><ol>${escList(lesson.differentiation)}</ol></div>
    <div class="section-card"><h3>تقويم ومناقشة التعلم السابق</h3><ul>${escList(lesson.priorLearning)}</ul></div>
    <div class="section-card"><h3>الإجراءات | التمهيد</h3><p>${lesson.introduction || ''}</p></div>
    <div class="section-card"><h3>خطوات التدريس والإجراءات</h3><ol>${escList(lesson.teachingSteps)}</ol></div>
    <div class="safety-box"><strong>السلامة:</strong> ${act.safety || lesson.teacherNotes || 'اتباع تعليمات السلامة الصفية.'}</div>
    ${pageNum(4)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('التوسع والإثراء والأنشطة المرافقة')}
    <div class="section-card"><h3>التوسع والإثراء</h3><p>${lesson.extension || ''}</p></div>
    <div class="section-title">الأنشطة المرافقة للدرس</div>
    <table class="compact-table">
      <thead><tr><th style="width:14mm">#</th><th>النشاط</th><th>نوع النشاط</th><th>المصدر/المرجع</th></tr></thead>
      <tbody>${activities}</tbody>
    </table>
    <div class="section-card" style="margin-top:6mm"><h3>تطبيقات حياتية</h3><ul>${escList(lesson.realLifeApplications)}</ul></div>
    <div class="section-card"><h3>أسئلة امتداد</h3><ul>${escList((lesson.guidingQuestions || []).slice(-3))}</ul></div>
    ${pageNum(5)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('خطة تنفيذ الدرس: دور المعلم والطالب والزمن')}
    <table class="compact-table">
      <thead><tr><th class="stage-col">أجزاء الدرس</th><th>دور المعلم</th><th>دور الطالب</th><th class="time-col">الزمن</th></tr></thead>
      <tbody>${flowRows}</tbody>
    </table>
    <div class="compact-grid" style="margin-top:5mm">
      <div class="section-card"><h3>النتائج وتحليلها</h3><ul>${escList(lesson.resultsAnalysis)}</ul></div>
      <div class="section-card"><h3>التقويم</h3><ul>${escList(lesson.assessmentQuestions)}</ul></div>
    </div>
    ${pageNum(6)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('النشاط العملي / الاستقصائي STEM')}
    <div class="hero-block">
      <h1>${act.title || lesson.activityName || 'النشاط العملي'}</h1>
      <p>الزمن: ${act.time || '25 دقيقة'} | أسلوب التنفيذ: مجموعات صغيرة</p>
      <p>هدف النشاط: ${act.expectedOutcome || lesson.activityDescription || ''}</p>
    </div>
    <div class="two-col"><div class="label-box">الأدوات والمواد</div><div class="content-box light"><ul>${escList(act.materials || lesson.activityTools)}</ul></div></div>
    <div class="two-col"><div class="label-box">الخطوات</div><div class="content-box light"><ol>${escList(act.steps || lesson.activitySteps)}</ol></div></div>
    <div class="two-col"><div class="label-box">أسئلة التفكير</div><div class="content-box light"><ul>${escList(act.thinkingQuestions)}</ul></div></div>
    <div class="two-col"><div class="label-box">النتيجة المتوقعة</div><div class="content-box"><p>${act.expectedOutcome || ''}</p></div></div>
    <div class="safety-box"><strong>قواعد السلامة:</strong> ${act.safety || 'اتباع تعليمات المعلم.'}</div>
    ${pageNum(7)}
  </div></section>

  ${worksheets}

  <section class="sheet"><div class="sheet-inner">
    ${pageHead((lesson.projectSheet && lesson.projectSheet.title) || 'المشروع التطبيقي')}
    <div class="project-box">
      <div class="worksheet-meta">
        <div><strong>الزمن</strong><br>عمل ${(lesson.projectSheet||{}).workMinutes || 20} د</div>
        <div><strong>العرض والمناقشة</strong><br>${(lesson.projectSheet||{}).discussionMinutes || 10} د</div>
        <div><strong>أسلوب التنفيذ</strong><br>${(lesson.projectSheet||{}).execution || 'مجموعات صغيرة'}</div>
        <div><strong>هدف المشروع</strong><br>${(lesson.projectSheet||{}).objective || ''}</div>
      </div>
      <h3>${(lesson.projectSheet||{}).title || ''}</h3>
      <p class="worksheet-prompt">${(lesson.projectSheet||{}).prompt || ''}</p>
      <div class="compact-grid" style="margin-top:5mm">
        <div class="section-card"><h3>الأدوات والمواد المقترحة</h3><ul>${escList((lesson.projectSheet||{}).tools || act.materials || lesson.activityTools)}</ul></div>
        <div class="section-card"><h3>خطوات المشروع</h3><ol>${escList((lesson.projectSheet||{}).steps || [
          'أحدد السؤال أو المشكلة.',
          'أقترح حلاً أو تصميماً أولياً.',
          'أنفذ النموذج أو المهمة وأسجل البيانات.',
          'أختبر النتيجة وأقترح تحسيناً.',
          'أعرض المنتج والنتائج وأناقشها.'
        ])}</ol></div>
      </div>
      <div class="answer-lines" style="min-height:55mm"></div>
    </div>
    <div class="section-card" style="margin-top:6mm"><h3>ملاحظات المعلم</h3><p>${lesson.teacherNotes || ''}</p></div>
    ${pageNum(12)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('سلم التقدير والتقويم الأدائي')}
    <table class="rubric">
      <thead><tr><th>المعيار</th><th>متميز</th><th>جيد</th><th>بحاجة إلى دعم</th></tr></thead>
      <tbody>${rubricRows}</tbody>
    </table>
    <div class="section-card" style="margin-top:7mm"><h3>التقويم الختامي</h3><ul>${escList(lesson.assessmentQuestions)}</ul></div>
    <div class="section-card"><h3>توثيق تعلم الطالب</h3><p>اسم الطالب: ____________________ &nbsp;&nbsp; الصف: __________ &nbsp;&nbsp; التاريخ: __________</p><div class="answer-lines" style="min-height:65mm"></div></div>
    <div class="print-credit">إعداد أ. أميرة عبدالله الحكمي | نوات ستيم</div>
    ${pageNum(13)}
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    ${pageHead('التقويم والمراجع')}
    <div class="section-card">
      <h3>استراتيجية التقويم</h3>
      <p>${(lesson.evaluationPlan || {}).strategy || 'التقويم المعتمد على الأداء والتقويم التكويني.'}</p>
    </div>
    <div class="section-card">
      <h3>أداة التقويم</h3>
      <p>${(lesson.evaluationPlan || {}).tool || 'سلم تقدير رقمي.'}</p>
    </div>
    <div class="section-title">مؤشرات الأداء</div>
    <table class="compact-table">
      <thead><tr><th style="width:15mm">الرقم</th><th>مؤشر الأداء</th></tr></thead>
      <tbody>${((lesson.evaluationPlan || {}).indicators || []).map((x,i)=>`<tr><td>${i+1}</td><td>${x}</td></tr>`).join('')}</tbody>
    </table>
    <div class="section-card" style="margin-top:6mm">
      <h3>المراجع</h3>
      <ul>${escList(lesson.references)}</ul>
    </div>
    <div class="print-credit">إعداد أ. أميرة عبدالله الحكمي | نوات ستيم</div>
    ${pageNum(14)}
  </div></section>`;
}

function buildCloudLessonSheets(lesson, unit, grade) {
  if (lesson && lesson.printModel === 'magnet-full') {
    return buildMagnetStyleLessonSheets(lesson, unit, grade);
  }
  const unitNumber = unit.number || (unit.id || '').replace('g3-unit', '').replace('g2-unit', '').replace('unit', '').replace('-s2', '');
  const unitTitle = unit.name || unit.title || '';
  const lessonTitle = lesson.title || '';
  const gradeName = (grade && grade.name) || ({grade1:'الصف الأول الابتدائي',grade2:'الصف الثاني الابتدائي',grade3:'الصف الثالث الابتدائي'}[state.selectedGradeId] || 'المرحلة الابتدائية');
  const stemAct = lesson.stemActivity || {};
  const ws = lesson.worksheet || {};
  const li = (arr) => (arr || []).map(x => `<li>${x}</li>`).join('');
  const joinArr = (arr, sep) => (arr || []).join(sep || ' | ');
  const conceptsHtml = (lesson.concepts || []).map(c => `<li><strong>${c.term || c}:</strong> ${c.definition || ''}</li>`).join('');
  const stemMaterials = (stemAct.materials || []).map(x => `<li>${x}</li>`).join('');
  const toolsHtml = (lesson.activityTools || []).map(t => `<div class="tool-item"><span>${t}</span></div>`).join('');
  const rubricRows = (lesson.rubric || []).map(r => `
    <tr>
      <td>${r.criterion}</td>
      <td>${r.excellent}</td>
      <td>${r.good}</td>
      <td>${r.needsSupport}</td>
    </tr>
  `).join('');

  return `
  <section class="sheet"><div class="sheet-inner">
    <div class="top-strip"><div class="cap"></div><div class="title-bar">${lessonTitle}</div><div class="cap"></div></div>
    <div class="hero-block">
      <h1>عنوان الدرس: ${lessonTitle}</h1>
      <p>المبحث: العلوم | الصف: ${gradeName}</p>
      <p>الوحدة ${unitNumber}: ${unitTitle}${lesson.chapter ? ` | ${lesson.chapter}` : ''}</p>
    </div>
    <div class="inline-meta">
      <div class="info-box"><p>عدد الجلسات: ${lesson.sessions || '2'}</p><p>مصادر التعلم: ${lesson.resources || ''}</p></div>
      <div class="info-box"><p>مدة الدرس: ${lesson.duration || '90 دقيقة'}</p><p>مرجع الكتاب: ${lesson.bookPages || ''}</p></div>
    </div>
    ${lesson.bookPrompt ? `<div class="two-col"><div class="label-box">سؤال الدرس</div><div class="content-box light"><p>${lesson.bookPrompt}</p></div></div>` : ''}
    <div class="two-col"><div class="label-box">ملخص الدرس</div><div class="content-box light"><p>${lesson.summary || ''}</p></div></div>
    <div class="two-col"><div class="label-box">الأهداف التعليمية</div><div class="content-box"><ul>${li(lesson.objectives)}</ul></div></div>
    <div class="two-col"><div class="label-box">المفردات</div><div class="content-box light"><p>${joinArr(lesson.vocabulary, ' | ')}</p></div></div>
    <div class="two-col"><div class="label-box">الأفكار الرئيسة</div><div class="content-box light"><ul>${li(lesson.mainIdeas)}</ul></div></div>
    <div class="page-number">1</div>
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    <div class="top-strip"><div class="cap"></div><div class="title-bar">المحتوى وتكامل STEM</div><div class="cap"></div></div>
    <div class="two-col"><div class="label-box">المحتوى العلمي</div><div class="content-box light"><p>${lesson.content || lesson.summary || ''}</p></div></div>
    <div class="two-col"><div class="label-box">المفاهيم</div><div class="content-box light"><ul>${conceptsHtml}</ul></div></div>
    <div class="two-col"><div class="label-box">الوسائل التعليمية</div><div class="content-box"><p>${lesson.teachingAids || ''}</p></div></div>
    <div class="two-col"><div class="label-box">تكامل STEM</div><div class="content-box light"><div class="stem-grid">
      <div class="stem-panel"><h3>Science: العلوم</h3><p>${(lesson.stem || {}).science || ''}</p></div>
      <div class="stem-panel"><h3>Technology: التقنية</h3><p>${(lesson.stem || {}).technology || ''}</p></div>
      <div class="stem-panel"><h3>Engineering: الهندسة</h3><p>${(lesson.stem || {}).engineering || ''}</p></div>
      <div class="stem-panel"><h3>Mathematics: الرياضيات</h3><p>${(lesson.stem || {}).mathematics || ''}</p></div>
    </div></div></div>
    <div class="two-col"><div class="label-box">التمهيد</div><div class="content-box light"><p>${lesson.introduction || ''}</p></div></div>
    <div class="two-col"><div class="label-box">خطوات التدريس</div><div class="content-box light"><ol>${li(lesson.teachingSteps)}</ol></div></div>
    <div class="page-number">2</div>
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    <div class="top-strip"><div class="cap"></div><div class="title-bar">${lesson.activityName || stemAct.title || 'النشاط العملي STEM'}</div><div class="cap"></div></div>
    <div class="two-col"><div class="label-box">وصف النشاط</div><div class="content-box light">
      <p><strong>اسم النشاط:</strong> ${lesson.activityName || stemAct.title || ''}</p>
      <p><strong>الوصف:</strong> ${lesson.activityDescription || stemAct.expectedOutcome || ''}</p>
      <p><strong>الزمن:</strong> ${stemAct.time || stemAct.duration || ''}</p>
    </div></div>
    <div class="two-col"><div class="label-box">أدوات النشاط</div><div class="content-box light"><div class="tools-grid">${toolsHtml}</div></div></div>
    <div class="two-col"><div class="label-box">مواد STEM</div><div class="content-box light"><ul>${stemMaterials}</ul></div></div>
    <div class="two-col"><div class="label-box">خطوات النشاط</div><div class="content-box light"><ol>${li(lesson.activitySteps || stemAct.steps)}</ol></div></div>
    <div class="two-col"><div class="label-box">الناتج المتوقع</div><div class="content-box"><p>${stemAct.expectedOutcome || lesson.activityDescription || ''}</p></div></div>
    <div class="two-col"><div class="label-box">أسئلة التفكير</div><div class="content-box light"><ul>${li(stemAct.thinkingQuestions)}</ul></div></div>
    <div class="two-col"><div class="label-box">التقويم</div><div class="content-box light"><ul>${li(lesson.assessmentQuestions)}</ul></div></div>
    <div class="page-number">3</div>
  </div></section>

  <section class="sheet"><div class="sheet-inner">
    <div class="top-strip"><div class="cap"></div><div class="title-bar">ورقة العمل والتقويم الأدائي</div><div class="cap"></div></div>
    <div class="two-col"><div class="label-box">ورقة عمل قابلة للطباعة</div><div class="content-box light"><div class="worksheet-box">
      <h3>${ws.title || 'ورقة عمل'}</h3>
      <p><strong>التعليمات:</strong> ${ws.instructions || ''}</p>
      <p style="white-space:pre-line">${ws.content || ''}</p>
    </div></div></div>
    <div class="two-col"><div class="label-box">سلم التقدير</div><div class="content-box light"><table class="rubric">
      <thead><tr><th>المعيار</th><th>متميز</th><th>جيد</th><th>بحاجة إلى دعم</th></tr></thead>
      <tbody>${rubricRows}</tbody>
    </table></div></div>
    <div class="two-col"><div class="label-box">ملاحظات للمعلم</div><div class="content-box light"><p>${lesson.teacherNotes || ''}</p></div></div>
    <div class="print-credit">إعداد أ. أميرة عبدالله الحكمي | نوات ستيم</div>
    <div class="page-number">4</div>
  </div></section>`;
}

// ============================================================
// ===== قسم الدروس =====
// ============================================================

function renderLessonsSection() {
  const tabsEl = document.getElementById('semester-tabs');
  if (tabsEl) tabsEl.style.display = 'none';

  const view = document.getElementById('lessons-view');
  if (!view) return;
  const grades = getAvailableGrades();

  view.innerHTML = `
    <div class="section-header section-header--rich">
      <span class="section-kicker">مسارك الدراسي</span>
      <h2>الصفوف ودروس STEM</h2>
      <p>اختر الصف الدراسي للانتقال إلى وحداته ودروسه وأنشطته التفاعلية.</p>
    </div>
    <div class="cards-grid grade-selection-grid">
      ${grades.map((grade, idx) => {
        const isSelected = grade.id === state.selectedGradeId;
        const unitsCount = (grade.units || []).length;
        const lessonsCount = (grade.units || []).reduce((a,u) => a + (u.lessons || []).length, 0);
        const completed = getAllLessonsFlat(grade.id).filter(({lesson}) => scores[lesson.id] !== undefined).length;
        const progress = lessonsCount ? Math.round((completed / lessonsCount) * 100) : 0;
        const color = ['#0e79b7','#183f64','#2784ad','#315a78','#167e97','#205b84'][idx % 6];
        return `
          <div class="card grade-select-card ${isSelected ? 'is-selected' : ''}" style="--card-color:${color}"
               onclick="showUnits('${grade.id}')"
               role="button" tabindex="0" aria-label="${grade.name}">
            <div class="card-topline">
              <span class="card-icon">${grade.icon || '📚'}</span>
              <div class="card-badge" style="background:${color}">${isSelected ? 'الصف الحالي' : 'مفتوح الآن'}</div>
            </div>
            <h3>${grade.name}</h3>
            <p>${unitsCount} وحدات دراسية &bull; ${lessonsCount} درساً</p>
            <div class="card-progress" aria-label="نسبة الاختبارات المكتملة ${progress}%">
              <div class="card-progress-head"><span>تقدم الاختبارات</span><b>${progress}%</b></div>
              <div class="card-progress-track"><i style="width:${progress}%"></i></div>
            </div>
            <div class="card-action">استكشف الصف <span aria-hidden="true">←</span></div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
function showUnits(gradeId) {
  const grade = getPrimaryGrade(gradeId);
  if (!grade) return;

  state.selectedGradeId = gradeId;
  const semesters = getAvailableSemestersForGrade(gradeId);
  if (!semesters.includes(state.currentSemester)) state.currentSemester = semesters[0] || 1;
  state.currentGrade = grade;
  state.currentGradeData = grade;
  state.currentUnit = null;
  state.currentLesson = null;

  showSemesterTabs(gradeId);
  _renderUnitsForSemester(grade, state.currentSemester);
  renderGamesSection();
  renderQuizSection();
}

function showSemesterTabs(gradeId) {
  const tabsEl = document.getElementById('semester-tabs');
  if (!tabsEl) return;

  const semesters = getAvailableSemestersForGrade(gradeId);
  if (!semesters.length) {
    tabsEl.style.display = 'none';
    return;
  }

  tabsEl.style.display = 'flex';
  tabsEl.innerHTML = semesters.map(semesterNum => {
    const label = semesterNum === 2 ? '📗 الفصل الدراسي الثاني' : '📘 الفصل الدراسي الأول';
    return `
      <button
        class="semester-tab-btn${state.currentSemester === semesterNum ? ' active' : ''}"
        onclick="switchSemester(${semesterNum}, '${gradeId}')"
        role="tab"
        aria-selected="${state.currentSemester === semesterNum}">
        ${label}
      </button>
    `;
  }).join('');
}

function switchSemester(semesterNum, gradeId) {
  const id = gradeId || state.selectedGradeId;
  const semesters = getAvailableSemestersForGrade(id);
  if (!semesters.includes(semesterNum)) return;

  state.currentSemester = semesterNum;
  state.currentUnit = null;
  state.currentLesson = null;

  const grade = getPrimaryGrade(id);
  if (!grade) return;
  showSemesterTabs(id);
  _renderUnitsForSemester(grade, semesterNum);
}

function _getGradeData(grade, semesterNum) {
  if (!grade) return null;
  if (grade.id === 'grade2' || grade.id === 'grade3' || grade.id === 'grade4' || grade.id === 'grade5' || grade.id === 'grade6') return semesterNum === 1 ? grade : null;

  if (semesterNum === 2 && window.semester2Data) {
    const sem2Grade = semester2Data.grades
      ? semester2Data.grades.find(g => g.id === grade.id || g.id === grade.id + '-s2')
      : null;
    if (sem2Grade) return _normalizeSem2Grade(sem2Grade);
  }
  return grade;
}

function _normalizeSem2Grade(sem2Grade) {
  const normalizedUnits = (sem2Grade.units || []).map((unit, idx) => ({
    id: unit.id,
    number: unit.number || idx + 1,
    name: unit.title || unit.name,
    icon: unit.icon || '📗',
    color: unit.color || '#4CAF50',
    lessons: (unit.lessons || []).map(lessonId => semester2Data.lessons.find(l => l.id === lessonId)).filter(Boolean)
  }));
  return {
    id: sem2Grade.id,
    name: sem2Grade.name,
    icon: sem2Grade.icon || '📗',
    units: normalizedUnits
  };
}

function _renderUnitsForSemester(grade, semesterNum) {
  const gradeData = _getGradeData(grade, semesterNum);
  const view = document.getElementById('lessons-view');
  if (!view || !gradeData) return;

  const semLabel = semesterNum === 2 ? 'الفصل الدراسي الثاني' : 'الفصل الدراسي الأول';
  const unitColors = ['#0e79b7', '#183f64', '#2784ad', '#315a78', '#167e97', '#205b84'];
  const units = gradeData.units || [];
  const lessonCount = units.reduce((sum,u) => sum + (u.lessons || []).length, 0);
  const completed = units.reduce((sum,u) => sum + (u.lessons || []).filter(l => scores[l.id] !== undefined).length, 0);
  const progress = lessonCount ? Math.round((completed / lessonCount) * 100) : 0;

  view.innerHTML = `
    <button class="btn-back" onclick="renderLessonsSection()" aria-label="العودة للصفوف">
      <span aria-hidden="true">→</span> جميع الصفوف
    </button>

    <section class="grade-overview" aria-label="ملخص الصف">
      <div class="grade-overview-main">
        <span class="overview-icon">${gradeData.icon || '📗'}</span>
        <div>
          <span class="section-kicker section-kicker--light">${semLabel}</span>
          <h2>${gradeData.name}</h2>
          <p>اختر وحدة لتبدأ رحلة التعلم، ثم انتقل بين الدرس والنشاط واللعبة والاختبار.</p>
        </div>
      </div>
      <div class="overview-stats">
        <div><b>${units.length}</b><span>وحدات</span></div>
        <div><b>${lessonCount}</b><span>دروس</span></div>
        <div><b>${completed}</b><span>اختبارات مكتملة</span></div>
        <div class="overview-progress"><b>${progress}%</b><span>التقدم</span></div>
      </div>
    </section>

    <div class="cards-grid unit-grid">
      ${units.map((unit, idx) => {
        const color = unit.color || unitColors[idx % unitColors.length];
        const unitLabel = `الوحدة ${unit.number || idx + 1}`;
        const unitLessons = unit.lessons || [];
        const unitCompleted = unitLessons.filter(l => scores[l.id] !== undefined).length;
        return `
          <div class="card unit-card" style="--card-color:${color}"
               onclick="showLessons('${unit.id}')"
               role="button" tabindex="0" aria-label="وحدة: ${unit.name}">
            <div class="card-topline">
              <span class="card-icon">${unit.icon || '📚'}</span>
              <div class="card-badge" style="background:${color}">${unitLabel}</div>
            </div>
            <h3>${unit.name}</h3>
            <p>${unitLessons.length} دروس تفاعلية مع أنشطة STEM وأوراق عمل واختبارات.</p>
            <div class="card-meta-line">
              <span>✓ ${unitCompleted} مكتمل</span>
              <span>${unitLessons.length - unitCompleted} متبقٍ</span>
            </div>
            <div class="card-action">عرض الدروس <span aria-hidden="true">←</span></div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  state.currentGrade = gradeData;
  state.currentGradeData = gradeData;
  updateAppGradeChip();
}
function showLessons(unitId) {
  const grade = state.currentGradeData || state.currentGrade;
  if (!grade) return;
  const unit = (grade.units || []).find(u => u.id === unitId);
  if (!unit) return;
  state.currentUnit = unit;

  const color = unit.color || '#0e79b7';
  const lessons = unit.lessons || [];
  const completed = lessons.filter(l => scores[l.id] !== undefined).length;
  const view = document.getElementById('lessons-view');

  view.innerHTML = `
    <button class="btn-back" onclick="showUnits('${state.selectedGradeId}')" aria-label="العودة للوحدات">
      <span aria-hidden="true">→</span> الوحدات
    </button>

    <section class="unit-overview" style="--unit-color:${color}" aria-label="ملخص الوحدة">
      <div class="unit-overview-copy">
        <span class="overview-icon overview-icon--small">${unit.icon || '📚'}</span>
        <div>
          <span class="section-kicker">الوحدة ${unit.number || ''}</span>
          <h2>${unit.name}</h2>
          <p>${lessons.length} دروس • ${completed} اختبارات مكتملة • اختر درساً لعرض ملفه التعليمي الكامل.</p>
        </div>
      </div>
      <div class="unit-progress-pill"><b>${lessons.length ? Math.round(completed / lessons.length * 100) : 0}%</b><span>تقدم الوحدة</span></div>
    </section>

    <div class="cards-grid-3 cards-grid lesson-grid">
      ${lessons.map((lesson, idx) => {
        const sc = scores[lesson.id];
        return `
          <div class="card lesson-card" style="--card-color:${color}"
               onclick="showLesson('${lesson.id}')"
               role="button" tabindex="0" aria-label="درس: ${lesson.title}">
            <div class="card-topline">
              <span class="lesson-index">${String(idx+1).padStart(2,'0')}</span>
              <div class="card-badge" style="background:${color}">الدرس ${idx+1}</div>
            </div>
            <h3>${lesson.title}</h3>
            <p>${(lesson.summary || '').substring(0, 125)}${(lesson.summary || '').length > 125 ? '...' : ''}</p>
            <div class="lesson-card-footer">
              ${sc !== undefined ? `<div class="badge badge-success">✓ اختبار ${sc}%</div>` : `<div class="badge badge-primary">جاهز للبدء</div>`}
              <span class="card-action card-action--inline">افتح الدرس ←</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
function showLesson(lessonId) {
  const grade = state.currentGrade;
  const unit = state.currentUnit;
  if (!unit) return;

  let lesson = unit.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  state.currentLesson = lesson;

  const view = document.getElementById('lessons-view');
  view.innerHTML = `
    <button class="btn-back no-print" onclick="showLessons('${unit.id}')" aria-label="العودة للدروس">
      ← العودة للدروس
    </button>
    <div class="cloud-lesson-view">
      <div class="cloud-toolbar no-print">
        <span class="toolbar-note">${lesson.title}</span>
        <div class="cloud-toolbar-actions">
          <button class="btn btn-primary" onclick="startQuizFromLesson('${lessonId}')">📝 ابدأ اختبار هذا الدرس</button>
          <button class="btn btn-success" onclick="startGameFromLesson('${lessonId}')">🎮 العب لعبة هذا الدرس</button>
          <button class="btn-print" onclick="printLesson('${lessonId}')">🖨️ طباعة الدرس</button>
        </div>
      </div>
      <div class="document cloud-document" id="lessonPrintArea">${buildCloudLessonSheets(lesson, unit, findLessonById(lessonId).grade || grade)}</div>
    </div>
  `;
}

function printLesson(lessonId) {
  const id = lessonId || (state.currentLesson && state.currentLesson.id);
  if (!id) { window.print(); return; }

  const { lesson, unit, grade } = findLessonById(id);
  if (!lesson) { window.print(); return; }

  const lessonTitle = lesson.title;
  const css = getCloudLessonPrintCss();
  const sheets = buildCloudLessonSheets(lesson, unit, grade);
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>طباعة: ${lessonTitle}</title>
<style>${css}</style>
</head>
<body>
<div class="toolbar">
  <span style="font-weight:700;font-size:18px;color:var(--navy)">${lessonTitle}</span>
  <button class="print-button" onclick="window.print()">🖨️ طباعة</button>
</div>
<div class="document">
  ${sheets}
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=800');
  if (!win) {
    window.print();
    return;
  }
  win.document.write(html);
  win.document.close();
}

function startQuizFromLesson(lessonId) {
  showSection('quiz');
  setTimeout(() => startQuiz(lessonId), 100);
}

function startGameFromLesson(lessonId) {
  showSection('games');
  setTimeout(() => startGame(lessonId), 100);
}

// ============================================================
// ===== قسم الألعاب =====
// ============================================================

function renderGamesSection() {
  const view = document.getElementById('games-view');
  if (!view) return;

  const allLessons = getAllLessonsFlat();
  const playedCount = allLessons.filter(({lesson}) => scores[`game_${lesson.id}`] !== undefined).length;

  view.innerHTML = `
    <div class="section-header section-header--rich">
      <span class="section-kicker">تعلّم باللعب</span>
      <h2>ألعب مع ستيم 🎮</h2>
      <p>اختر لعبة مرتبطة بأحد الدروس، واجمع النقاط وأعد المحاولة لتحسين نتيجتك.</p>
      <div class="section-summary-pills">
        <span><b>${allLessons.length}</b> لعبة</span>
        <span><b>${playedCount}</b> تم لعبها</span>
      </div>
    </div>
    <div id="gameScoreBoard" class="highlight mb-3" style="display:none"></div>
    <div id="gameContent">
      <div class="cards-grid content-cards-grid">
        ${allLessons.map(({lesson, unit, semester}) => {
          const sc = scores[`game_${lesson.id}`];
          const game = lesson.game || {};
          const gameType = game.type || '';
          const gameTypeIcon = getGameTypeIcon(gameType);
          const gameTypeName = getGameTypeName(gameType);
          const color = unit.color || '#0e79b7';
          const gameTitle = game.title || lesson.title;
          const semBadge = semester === 2 ? 'الفصل الثاني' : 'الفصل الأول';
          return `
            <div class="card activity-card" style="--card-color:${color}"
                 onclick="startGame('${lesson.id}')"
                 role="button" tabindex="0" aria-label="لعبة: ${gameTitle}">
              <div class="card-topline">
                <span class="card-icon activity-icon">${gameTypeIcon}</span>
                <div class="card-badge" style="background:${color}">${gameTypeName}</div>
              </div>
              <h3>${gameTitle}</h3>
              <p>${lesson.title} &bull; ${unit.name || unit.title}</p>
              <div class="card-meta-line"><span>${semBadge}</span><span>${sc !== undefined ? `🏆 ${sc} نقطة` : 'لم تلعب بعد'}</span></div>
              <div class="card-action">ابدأ اللعبة <span aria-hidden="true">←</span></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
function getGameTypeIcon(type) {
  const icons = {
    sorting: '🗂️',
    dragDrop: '🧲',
    matching: '🔗',
    sequencing: '🔢',
    multiple_choice: '🎯',
    multipleChoice: '🎯',
    trueFalse: '✅'
  };
  return icons[type] || '🎮';
}

function getGameTypeName(type) {
  const names = {
    sorting: 'فرز وتصنيف',
    dragDrop: 'سحب وإفلات',
    matching: 'مطابقة',
    sequencing: 'ترتيب',
    multiple_choice: 'اختيار متعدد',
    multipleChoice: 'اختيار متعدد',
    trueFalse: 'صح أم خطأ'
  };
  return names[type] || 'لعبة';
}

function startGame(lessonId) {
  const { lesson, unit } = findLessonById(lessonId);
  if (!lesson || !lesson.game) return;

  state.game.lessonId = lessonId;
  state.game.data = lesson.game;
  state.game.score = 0;
  state.game.total = 0;
  state.game.matchSelected = null;

  const gameType = lesson.game.type;

  switch (gameType) {
    case 'sorting':
      renderSortingGame(lesson.game, unit, lesson);
      break;
    case 'dragDrop':
      renderDragDropGame(lesson.game, unit, lesson);
      break;
    case 'matching':
      renderMatchingGame(lesson.game, unit, lesson);
      break;
    case 'sequencing':
      renderSequencingGame(lesson.game, unit, lesson);
      break;
    case 'multiple_choice':
    case 'multipleChoice':
      renderMCQGame(lesson.game, unit, lesson);
      break;
    case 'trueFalse':
      renderTrueFalseGame(lesson.game, unit, lesson);
      break;
    default: {
      const view = document.getElementById('gameContent');
      if (view) view.innerHTML = `<div class="game-container"><p class="not-available">هذه اللعبة غير متوفرة حالياً.</p></div>`;
    }
  }
}

// ---- لعبة الفرز (sorting) ----
function renderSortingGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  const shuffled = shuffleArray([...game.items]);

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div style="text-align:center">
          <div class="score-label">التقدم</div>
          <div id="gameProgress" class="badge badge-primary">0/${game.items.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>

      <div class="sort-items-pool" id="sortPool">
        ${shuffled.map(item => `
          <div class="sort-item"
               draggable="true"
               id="sitem-${item.id}"
               data-id="${item.id}"
               data-category="${item.category}"
               title="${item.hint || ''}"
               aria-label="${item.text}"
               ondragstart="onDragStart(event)"
               onclick="onSortItemClick(this)">
            <span class="item-emoji">${item.image || ''}</span>
            <span>${item.text}</span>
          </div>
        `).join('')}
      </div>

      <div class="sort-areas">
        ${game.categories.map(cat => {
          const catId = (typeof cat === 'string') ? cat : cat.id;
          const catName = (typeof cat === 'string') ? cat : cat.name;
          const catColor = (typeof cat === 'object' && cat.color) ? cat.color : '#1565C0';
          return `
            <div class="sort-zone"
                 id="zone-${catId}"
                 data-category="${catId}"
                 ondragover="onDragOver(event)"
                 ondrop="onDrop(event)"
                 ondragenter="onDragEnter(event)"
                 ondragleave="onDragLeave(event)">
              <div class="sort-zone-label" style="background:${catColor}">${catName}</div>
              <div class="zone-items" id="zitems-${catId}"></div>
            </div>
          `;
        }).join('')}
      </div>

      <div id="sortFeedback" style="margin-top:12px;text-align:center;font-weight:700;font-size:1rem"></div>
    </div>
  `;

  state.game.sortItems = game.items;
  state.game.sortPlaced = {};
  state.game.sortClickSelected = null;
}

// ---- لعبة السحب والإفلات (dragDrop) - مشابهة للفرز لكن الفئات strings ----
function renderDragDropGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  const shuffled = shuffleArray([...game.items]);
  const categories = game.categories || [];

  // إعداد نسخة موحدة من العناصر بـ id
  const itemsWithId = shuffled.map((item, idx) => ({
    ...item,
    id: item.id !== undefined ? item.id : idx
  }));

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div style="text-align:center">
          <div class="score-label">التقدم</div>
          <div id="gameProgress" class="badge badge-primary">0/${game.items.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>

      <div class="sort-items-pool" id="sortPool">
        ${itemsWithId.map(item => `
          <div class="sort-item"
               draggable="true"
               id="sitem-${item.id}"
               data-id="${item.id}"
               data-category="${item.category}"
               aria-label="${item.text}"
               ondragstart="onDragStart(event)"
               onclick="onSortItemClick(this)">
            <span>${item.text}</span>
          </div>
        `).join('')}
      </div>

      <div class="sort-areas">
        ${categories.map(cat => `
          <div class="sort-zone"
               id="zone-${cat}"
               data-category="${cat}"
               ondragover="onDragOver(event)"
               ondrop="onDrop(event)"
               ondragenter="onDragEnter(event)"
               ondragleave="onDragLeave(event)">
            <div class="sort-zone-label" style="background:#1565C0">${cat}</div>
            <div class="zone-items" id="zitems-${cat}"></div>
          </div>
        `).join('')}
      </div>

      <div id="sortFeedback" style="margin-top:12px;text-align:center;font-weight:700;font-size:1rem"></div>
    </div>
  `;

  // حفظ نسخة موحدة للعناصر
  const gameDataCopy = { ...game, items: itemsWithId };
  state.game.data = gameDataCopy;
  state.game.sortItems = itemsWithId;
  state.game.sortPlaced = {};
  state.game.sortClickSelected = null;
}

let dragItem = null;

function onDragStart(e) {
  dragItem = e.target.closest('.sort-item');
  e.dataTransfer.setData('text/plain', dragItem.dataset.id);
  setTimeout(() => { if (dragItem) dragItem.classList.add('dragging'); }, 0);
}

function onDragOver(e) { e.preventDefault(); }

function onDragEnter(e) { e.currentTarget.classList.add('drag-over'); }

function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

function onDrop(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove('drag-over');
  const rawId = e.dataTransfer.getData('text/plain');
  const itemId = isNaN(rawId) ? rawId : parseInt(rawId);
  placeSortItem(itemId, zone.dataset.category);
}

function onSortItemClick(el) {
  if (!el || el.dataset.placed) return;

  if (!state.game.sortClickSelected) {
    document.querySelectorAll('.sort-item').forEach(i => i.style.outline = '');
    el.style.outline = '3px solid var(--accent)';
    state.game.sortClickSelected = el;
  } else if (state.game.sortClickSelected === el) {
    el.style.outline = '';
    state.game.sortClickSelected = null;
  }
}

document.addEventListener('click', (e) => {
  const zone = e.target.closest('.sort-zone');
  if (zone && state.game.sortClickSelected) {
    const itemEl = state.game.sortClickSelected;
    itemEl.style.outline = '';
    state.game.sortClickSelected = null;
    const rawId = itemEl.dataset.id;
    const itemId = isNaN(rawId) ? rawId : parseInt(rawId);
    placeSortItem(itemId, zone.dataset.category);
  }
});

function placeSortItem(itemId, categoryId) {
  const gameData = state.game.data;
  if (!gameData) return;
  const item = gameData.items.find(i => String(i.id) === String(itemId));
  if (!item || state.game.sortPlaced[String(itemId)]) return;

  const el = document.getElementById(`sitem-${itemId}`);
  if (!el) return;

  const correct = String(item.category) === String(categoryId);
  state.game.sortPlaced[String(itemId)] = true;

  const zoneItems = document.getElementById(`zitems-${categoryId}`);
  if (zoneItems) {
    el.draggable = false;
    el.style.cursor = 'default';
    el.style.border = `2px solid ${correct ? 'var(--success)' : 'var(--danger)'}`;
    el.style.background = correct ? 'rgba(46,125,50,0.08)' : 'rgba(198,40,40,0.08)';
    el.setAttribute('data-placed', '1');
    zoneItems.appendChild(el);
  }

  if (correct) {
    state.game.score++;
    showSortFeedback(`✅ أحسنت! ${item.hint || ''}`, true);
  } else {
    showSortFeedback(`❌ حاول مرة أخرى!`, false);
  }

  const placed = Object.keys(state.game.sortPlaced).length;
  const scoreEl = document.getElementById('gameScore');
  const progEl = document.getElementById('gameProgress');
  if (scoreEl) scoreEl.textContent = state.game.score;
  if (progEl) progEl.textContent = `${placed}/${gameData.items.length}`;

  if (placed === gameData.items.length) {
    setTimeout(() => showGameResult(state.game.score, gameData.items.length, gameData.type || 'sorting'), 800);
  }
}

function showSortFeedback(msg, correct) {
  const el = document.getElementById('sortFeedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = correct ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => { el.textContent = ''; }, 2000);
}

// ---- لعبة المطابقة (matching) ----
function renderMatchingGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  // دعم كلا التنسيقين: pairs بـ {id, left, right} أو {term, definition}
  const normalizedPairs = (game.pairs || []).map((p, idx) => ({
    id: p.id !== undefined ? p.id : idx,
    left: p.left || p.term,
    right: p.right || p.definition
  }));
  const shuffledRight = shuffleArray([...normalizedPairs]);

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div>
          <div class="score-label">التقدم</div>
          <div id="gameProgress" class="badge badge-primary">0/${normalizedPairs.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <div class="matching-container">
        <div>
          <div class="matching-col-header">العمود الأول</div>
          ${normalizedPairs.map(pair => `
            <div class="match-item" id="left-${pair.id}"
                 data-id="${pair.id}" data-side="left"
                 onclick="onMatchClick(this)"
                 role="button" tabindex="0" aria-label="${pair.left}">
              ${pair.left}
            </div>
          `).join('')}
        </div>
        <div>
          <div class="matching-col-header">العمود الثاني</div>
          ${shuffledRight.map(pair => `
            <div class="match-item" id="right-${pair.id}"
                 data-id="${pair.id}" data-side="right"
                 onclick="onMatchClick(this)"
                 role="button" tabindex="0" aria-label="${pair.right}">
              ${pair.right}
            </div>
          `).join('')}
        </div>
      </div>
      <div id="matchFeedback" style="text-align:center;font-weight:700;margin-top:12px;min-height:24px"></div>
    </div>
  `;

  // تحديث بيانات اللعبة بالأزواج المعيارية
  state.game.data = { ...game, pairs: normalizedPairs };
  state.game.matchSelected = null;
  state.game.matchMatched = {};
  state.game.score = 0;
}

function onMatchClick(el) {
  if (el.classList.contains('matched-correct')) return;
  const side = el.dataset.side;
  const id = parseInt(el.dataset.id);

  if (!state.game.matchSelected) {
    document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    state.game.matchSelected = { el, side, id };
  } else {
    const prev = state.game.matchSelected;

    if (prev.el === el) {
      el.classList.remove('selected');
      state.game.matchSelected = null;
      return;
    }

    if (prev.side === side) {
      document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      state.game.matchSelected = { el, side, id };
      return;
    }

    const correct = prev.id === id;
    document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));

    if (correct) {
      prev.el.classList.add('matched-correct');
      el.classList.add('matched-correct');
      prev.el.setAttribute('tabindex', '-1');
      el.setAttribute('tabindex', '-1');
      state.game.score++;
      const placed = state.game.score;
      const scoreEl = document.getElementById('gameScore');
      const progEl = document.getElementById('gameProgress');
      if (scoreEl) scoreEl.textContent = state.game.score;
      if (progEl) progEl.textContent = `${placed}/${state.game.data.pairs.length}`;
      showMatchFeedback('✅ ممتاز! تطابق صحيح', true);
      if (placed === state.game.data.pairs.length) {
        setTimeout(() => showGameResult(state.game.score, state.game.data.pairs.length, 'matching'), 800);
      }
    } else {
      prev.el.classList.add('matched-wrong');
      el.classList.add('matched-wrong');
      showMatchFeedback('❌ حاول مرة أخرى!', false);
      setTimeout(() => {
        prev.el.classList.remove('matched-wrong');
        el.classList.remove('matched-wrong');
      }, 600);
    }

    state.game.matchSelected = null;
  }
}

function showMatchFeedback(msg, correct) {
  const el = document.getElementById('matchFeedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = correct ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => { el.textContent = ''; }, 1800);
}

// ---- لعبة الترتيب (sequencing) ----
function renderSequencingGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  const shuffled = shuffleArray([...game.items]);

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:16px;font-size:0.875rem">
        انقر على الأزرار ▲ ▼ لتحريك العناصر وترتيبها
      </p>
      <div class="sequence-items" id="seqList">
        ${shuffled.map((item, idx) => `
          <div class="sequence-item" data-order="${item.order}" data-idx="${idx}" id="seq-${item.order}">
            <span class="sequence-num">${idx+1}</span>
            <span style="flex:1">${item.text}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-outline" style="padding:6px 10px;min-height:36px"
                      onclick="moveSeqUp(${idx})" aria-label="نقل للأعلى">▲</button>
              <button class="btn btn-outline" style="padding:6px 10px;min-height:36px"
                      onclick="moveSeqDown(${idx})" aria-label="نقل للأسفل">▼</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:20px">
        <button class="btn btn-primary btn-lg" onclick="checkSequence()">
          ✅ تحقق من الترتيب
        </button>
      </div>
      <div id="seqFeedback" style="text-align:center;font-weight:700;margin-top:16px;min-height:28px"></div>
    </div>
  `;

  state.game.seqItems = [...shuffled];
}

function moveSeqUp(idx) {
  if (idx === 0) return;
  const list = document.getElementById('seqList');
  const items = list.querySelectorAll('.sequence-item');
  list.insertBefore(items[idx], items[idx - 1]);
  updateSeqNumbers();
  state.game.seqItems = getSeqCurrentOrder();
}

function moveSeqDown(idx) {
  const list = document.getElementById('seqList');
  const items = list.querySelectorAll('.sequence-item');
  if (idx >= items.length - 1) return;
  list.insertBefore(items[idx + 1], items[idx]);
  updateSeqNumbers();
  state.game.seqItems = getSeqCurrentOrder();
}

function updateSeqNumbers() {
  const items = document.querySelectorAll('#seqList .sequence-item');
  items.forEach((item, idx) => {
    item.querySelector('.sequence-num').textContent = idx + 1;
  });
}

function getSeqCurrentOrder() {
  const items = document.querySelectorAll('#seqList .sequence-item');
  const result = [];
  items.forEach(item => result.push(parseInt(item.dataset.order)));
  return result;
}

function checkSequence() {
  const current = getSeqCurrentOrder();
  const expected = state.game.data.items.map(i => i.order).sort((a,b) => a-b);
  const correct = current.every((v, i) => v === expected[i]);
  const fb = document.getElementById('seqFeedback');

  if (correct) {
    if (fb) { fb.textContent = '🎉 رائع! الترتيب صحيح تماماً!'; fb.style.color = 'var(--success)'; }
    document.querySelectorAll('#seqList .sequence-item').forEach(el => {
      el.style.borderColor = 'var(--success)';
      el.style.background = 'rgba(46,125,50,0.08)';
    });
    setTimeout(() => showGameResult(state.game.data.items.length, state.game.data.items.length, 'sequencing'), 1200);
  } else {
    if (fb) { fb.textContent = '❌ الترتيب غير صحيح. حاول مرة أخرى!'; fb.style.color = 'var(--danger)'; }
    document.querySelectorAll('#seqList .sequence-item').forEach(el => {
      el.style.borderColor = '';
      el.style.background = '';
    });
  }
}

// ---- لعبة الاختيار المتعدد (multiple_choice / multipleChoice) ----
function renderMCQGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  state.game.mcqCurrent = 0;
  state.game.score = 0;

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div>
          <div class="score-label">السؤال</div>
          <div id="gameProgress" class="badge badge-primary">1/${game.questions.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <div id="mcqArea"></div>
    </div>
  `;

  renderMCQQuestion(0);
}

function renderMCQQuestion(idx) {
  const game = state.game.data;
  if (idx >= game.questions.length) {
    showGameResult(state.game.score, game.questions.length, game.type);
    return;
  }

  const q = game.questions[idx];
  const area = document.getElementById('mcqArea');
  if (!area) return;

  const progEl = document.getElementById('gameProgress');
  if (progEl) progEl.textContent = `${idx+1}/${game.questions.length}`;

  area.innerHTML = `
    <div class="mcq-game">
      <div class="question-image">${q.image || ''}</div>
      <div class="question-text">${q.question}</div>
      <div class="mcq-options">
        ${q.options.map((opt, i) => `
          <button class="mcq-option"
                  onclick="answerMCQ(${i}, ${q.correct})"
                  aria-label="${opt}">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="mcqFeedback" style="text-align:center;font-weight:700;margin-top:12px;min-height:24px"></div>
    </div>
  `;
}

function answerMCQ(chosen, correct) {
  const opts = document.querySelectorAll('.mcq-option');
  opts.forEach(o => o.disabled = true);

  const fb = document.getElementById('mcqFeedback');
  if (opts[correct]) opts[correct].classList.add('correct');

  if (chosen === correct) {
    if (opts[chosen]) opts[chosen].classList.add('correct');
    state.game.score++;
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = state.game.score;
    if (fb) { fb.textContent = '✅ إجابة صحيحة! أحسنت'; fb.style.color = 'var(--success)'; }
  } else {
    if (opts[chosen]) opts[chosen].classList.add('wrong');
    if (fb) { fb.textContent = '❌ إجابة خاطئة. الإجابة الصحيحة ملوّنة بالأخضر'; fb.style.color = 'var(--danger)'; }
  }

  state.game.mcqCurrent++;
  setTimeout(() => renderMCQQuestion(state.game.mcqCurrent), 1400);
}

// ---- لعبة صح أم خطأ (trueFalse) ----
function renderTrueFalseGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  state.game.tfCurrent = 0;
  state.game.score = 0;

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div>
          <div class="score-label">السؤال</div>
          <div id="gameProgress" class="badge badge-primary">1/${game.questions.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <div id="tfArea"></div>
    </div>
  `;

  renderTFQuestion(0);
}

function renderTFQuestion(idx) {
  const game = state.game.data;
  if (idx >= game.questions.length) {
    showGameResult(state.game.score, game.questions.length, 'trueFalse');
    return;
  }

  const q = game.questions[idx];
  const area = document.getElementById('tfArea');
  if (!area) return;

  const progEl = document.getElementById('gameProgress');
  if (progEl) progEl.textContent = `${idx+1}/${game.questions.length}`;

  area.innerHTML = `
    <div class="mcq-game">
      <div class="question-text" style="font-size:1.1rem;margin-bottom:24px">${q.statement}</div>
      <div class="mcq-options" style="display:flex;gap:16px;justify-content:center">
        <button class="mcq-option tf-btn" style="flex:1;font-size:1.2rem;background:rgba(46,125,50,0.08)"
                onclick="answerTF(true, ${q.answer})"
                aria-label="صح">
          ✅ صح
        </button>
        <button class="mcq-option tf-btn" style="flex:1;font-size:1.2rem;background:rgba(198,40,40,0.08)"
                onclick="answerTF(false, ${q.answer})"
                aria-label="خطأ">
          ❌ خطأ
        </button>
      </div>
      <div id="tfFeedback" style="text-align:center;font-weight:700;margin-top:16px;min-height:40px;font-size:0.9rem;padding:8px"></div>
    </div>
  `;
}

function answerTF(chosen, correct) {
  const btns = document.querySelectorAll('.tf-btn');
  btns.forEach(b => b.disabled = true);

  const fb = document.getElementById('tfFeedback');
  const game = state.game.data;
  const q = game.questions[state.game.tfCurrent];

  if (chosen === correct) {
    state.game.score++;
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = state.game.score;
    if (fb) {
      fb.textContent = `✅ إجابة صحيحة! ${q.explanation || ''}`;
      fb.style.color = 'var(--success)';
    }
  } else {
    if (fb) {
      fb.textContent = `❌ إجابة خاطئة. ${q.explanation || ''}`;
      fb.style.color = 'var(--danger)';
    }
  }

  state.game.tfCurrent++;
  setTimeout(() => renderTFQuestion(state.game.tfCurrent), 1800);
}

// ---- نتيجة اللعبة ----
function showGameResult(score, total, type) {
  const view = document.getElementById('gameContent');
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = percent === 100 ? '🏆' : percent >= 60 ? '⭐' : '💪';
  const msg = percent === 100 ? 'ممتاز! أنت بطل!' : percent >= 60 ? 'أداء جيد! استمر!' : 'حاول مرة أخرى!';

  // تخزين النقاط
  const key = `game_${state.game.lessonId}`;
  const prev = scores[key] || 0;
  if (score > prev) {
    scores[key] = score;
    localStorage.setItem('nawat_scores', JSON.stringify(scores));
  }

  view.innerHTML = `
    <div class="game-container">
      <div class="game-result">
        <div class="result-emoji bounce">${emoji}</div>
        <div class="result-title">${msg}</div>
        <div class="result-score">حصلت على <strong>${score}</strong> من <strong>${total}</strong> نقطة</div>
        <div class="progress-bar" style="max-width:300px;margin:0 auto 24px">
          <div class="progress-fill" style="width:${percent}%;background:${percent>=80?'var(--success)':percent>=50?'var(--warning)':'var(--danger)'}"></div>
        </div>
        <div class="gap-row" style="justify-content:center">
          <button class="btn btn-primary btn-lg" onclick="startGame('${state.game.lessonId}')">
            🔄 إعادة اللعبة
          </button>
          <button class="btn btn-outline btn-lg" onclick="renderGamesSection()">
            🎮 ألعاب أخرى
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// ===== قسم الاختبارات =====
// ============================================================

function renderQuizSection() {
  const view = document.getElementById('quiz-view');
  if (!view) return;

  const allLessons = getAllLessonsFlat();
  const completedCount = allLessons.filter(({lesson}) => scores[lesson.id] !== undefined).length;

  view.innerHTML = `
    <div class="section-header section-header--rich">
      <span class="section-kicker">قياس التعلّم</span>
      <h2>اختبر معلوماتك 📝</h2>
      <p>اختبارات قصيرة لكل درس مع نتيجة فورية وشارات تشجيعية تساعدك على متابعة تقدمك.</p>
      <div class="section-summary-pills">
        <span><b>${allLessons.length}</b> اختبار</span>
        <span><b>${completedCount}</b> مكتمل</span>
      </div>
    </div>
    <div id="quizContent">
      <div class="cards-grid content-cards-grid">
        ${allLessons.map(({lesson, unit, semester}) => {
          const sc = scores[lesson.id];
          const badge = sc !== undefined ? getBadgeForScore(sc) : null;
          const color = unit.color || '#0e79b7';
          const quizQuestions = _getLessonQuizQuestions(lesson);
          const qCount = quizQuestions.length;
          const semBadge = semester === 2 ? 'الفصل الثاني' : 'الفصل الأول';

          return `
            <div class="card activity-card quiz-list-card" style="--card-color:${color}"
                 onclick="startQuiz('${lesson.id}')"
                 role="button" tabindex="0" aria-label="اختبار: ${lesson.title}">
              <div class="card-topline">
                <span class="card-icon activity-icon">📝</span>
                <div class="card-badge" style="background:${color}">${qCount} أسئلة</div>
              </div>
              <h3>${lesson.title}</h3>
              <p>${unit.name || unit.title}</p>
              <div class="card-meta-line"><span>${semBadge}</span><span>${badge ? `${badge.icon} ${badge.label} • ${sc}%` : 'جاهز للاختبار'}</span></div>
              <div class="card-action">${sc !== undefined ? 'أعد الاختبار' : 'ابدأ الاختبار'} <span aria-hidden="true">←</span></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
function _getLessonQuizQuestions(lesson) {
  if (!lesson.quiz) return [];
  // الفصل الأول: lesson.quiz = مصفوفة أسئلة مباشرة
  if (Array.isArray(lesson.quiz)) return lesson.quiz;
  // الفصل الثاني: lesson.quiz = { questions: [...] }
  if (lesson.quiz.questions && Array.isArray(lesson.quiz.questions)) return lesson.quiz.questions;
  return [];
}

function getBadgeForScore(sc) {
  if (sc >= 80) return { icon: '🥇', label: 'ذهبية' };
  if (sc >= 60) return { icon: '🥈', label: 'فضية' };
  return { icon: '🥉', label: 'برونزية' };
}

function startQuiz(lessonId) {
  const { lesson, unit } = findLessonById(lessonId);
  if (!lesson) return;

  const questions = _getLessonQuizQuestions(lesson);
  if (questions.length === 0) {
    const view = document.getElementById('quizContent');
    if (view) view.innerHTML = `
      <button class="btn-back" onclick="renderQuizSection()">← العودة للاختبارات</button>
      <div class="quiz-container" style="text-align:center;padding:40px">
        <p style="font-size:1.2rem">لا توجد أسئلة لهذا الدرس بعد.</p>
        <button class="btn btn-outline mt-3" onclick="renderQuizSection()">← العودة</button>
      </div>
    `;
    return;
  }

  state.quiz.lessonId = lessonId;
  state.quiz.questions = [...questions];
  state.quiz.current = 0;
  state.quiz.score = 0;
  state.quiz.answered = false;

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const view = document.getElementById('quizContent');
  const { questions, current } = state.quiz;
  const { lesson } = findLessonById(state.quiz.lessonId);

  if (current >= questions.length) {
    showQuizResult();
    return;
  }

  const q = questions[current];
  const progress = Math.round((current / questions.length) * 100);
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];

  view.innerHTML = `
    <button class="btn-back" onclick="renderQuizSection()">← العودة للاختبارات</button>
    <div class="quiz-container">
      <div class="quiz-header">
        <div>
          <div style="font-size:0.8rem;opacity:0.85">اختبار: ${lesson ? lesson.title : ''}</div>
          <div style="margin-top:4px">
            <div class="quiz-progress">
              <span style="font-size:0.875rem">${current + 1}/${questions.length}</span>
              <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width:${progress}%"></div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:0.8rem;opacity:0.85;text-align:center">الوقت</div>
          <div class="quiz-timer" id="quizTimer">20</div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-num">السؤال ${current + 1} من ${questions.length}</div>
        <div class="question-text">${q.question}</div>
        <div class="quiz-options" id="quizOptions">
          ${q.options.map((opt, i) => `
            <button class="quiz-option"
                    onclick="answerQuiz(${i})"
                    aria-label="الخيار ${letters[i]}: ${opt}">
              <span class="option-letter">${letters[i]}</span>
              ${opt}
            </button>
          `).join('')}
        </div>
        <div class="feedback-box" id="quizFeedback"></div>
      </div>
    </div>
  `;

  clearInterval(state.quiz.timer);
  state.quiz.timeLeft = 20;
  state.quiz.answered = false;
  updateTimerDisplay(20);
  state.quiz.timer = setInterval(tickTimer, 1000);
}

function tickTimer() {
  state.quiz.timeLeft--;
  updateTimerDisplay(state.quiz.timeLeft);

  if (state.quiz.timeLeft <= 5) {
    const timerEl = document.getElementById('quizTimer');
    if (timerEl) timerEl.classList.add('warning');
  }

  if (state.quiz.timeLeft <= 0) {
    clearInterval(state.quiz.timer);
    if (!state.quiz.answered) autoAnswerWrong();
  }
}

function updateTimerDisplay(t) {
  const el = document.getElementById('quizTimer');
  if (el) el.textContent = t;
}

function autoAnswerWrong() {
  state.quiz.answered = true;
  const q = state.quiz.questions[state.quiz.current];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach((o, i) => {
    o.disabled = true;
    if (i === q.correct) o.classList.add('correct');
  });
  showQuizFeedback(false, `⏰ انتهى الوقت! الإجابة الصحيحة: ${q.options[q.correct]}`);
  setTimeout(nextQuizQuestion, 2000);
}

function answerQuiz(chosen) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;
  clearInterval(state.quiz.timer);

  const q = state.quiz.questions[state.quiz.current];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach(o => o.disabled = true);

  const correct = chosen === q.correct;
  if (opts[q.correct]) opts[q.correct].classList.add('correct');

  if (correct) {
    if (opts[chosen]) opts[chosen].classList.add('correct');
    state.quiz.score++;
    showQuizFeedback(true, `✅ إجابة صحيحة! ${q.explanation || ''}`);
  } else {
    if (opts[chosen]) opts[chosen].classList.add('wrong');
    showQuizFeedback(false, `❌ إجابة خاطئة. ${q.explanation || ''}`);
  }

  setTimeout(nextQuizQuestion, 2200);
}

function showQuizFeedback(correct, msg) {
  const fb = document.getElementById('quizFeedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.className = `feedback-box show ${correct ? 'correct-fb' : 'wrong-fb'}`;
}

function nextQuizQuestion() {
  state.quiz.current++;
  renderQuizQuestion();
}

function showQuizResult() {
  const view = document.getElementById('quizContent');
  const { score, questions } = state.quiz;
  const total = questions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  const prev = scores[state.quiz.lessonId] || 0;
  if (percent > prev) {
    scores[state.quiz.lessonId] = percent;
    localStorage.setItem('nawat_scores', JSON.stringify(scores));
  }

  let badgeClass, badgeEmoji, msg;
  if (percent >= 80) {
    badgeClass = 'badge-gold'; badgeEmoji = '🥇'; msg = 'ممتاز! حصلت على الشارة الذهبية!';
  } else if (percent >= 60) {
    badgeClass = 'badge-silver'; badgeEmoji = '🥈'; msg = 'جيد! حصلت على الشارة الفضية!';
  } else {
    badgeClass = 'badge-bronze'; badgeEmoji = '🥉'; msg = 'حصلت على الشارة البرونزية. حاول مرة أخرى!';
  }

  const { lesson } = findLessonById(state.quiz.lessonId);

  view.innerHTML = `
    <div class="quiz-container">
      <div class="question-card">
        <div class="quiz-result">
          <div class="result-badge ${badgeClass}">${badgeEmoji}</div>
          <div class="result-message">${msg}</div>
          <div class="result-details">
            <p>الدرس: <strong>${lesson ? lesson.title : ''}</strong></p>
            <p>نتيجتك: <strong>${score}</strong> من <strong>${total}</strong> إجابة صحيحة</p>
            <p>النسبة المئوية: <strong>${percent}%</strong></p>
          </div>
          <div class="progress-bar" style="max-width:300px;margin:0 auto 24px">
            <div class="progress-fill" style="width:${percent}%;background:${percent>=80?'var(--success)':percent>=60?'var(--warning)':'var(--danger)'}"></div>
          </div>
          <div class="gap-row" style="justify-content:center">
            <button class="btn btn-primary btn-lg" onclick="startQuiz('${state.quiz.lessonId}')">
              🔄 إعادة الاختبار
            </button>
            <button class="btn btn-outline btn-lg" onclick="renderQuizSection()">
              📝 اختبارات أخرى
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// ===== الشات بوت =====
// ============================================================

let botTyping = false;

function initChatbot() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  msgs.innerHTML = '';

  const greetings = (nawatData.chatbot && nawatData.chatbot.greetings && nawatData.chatbot.greetings.length)
    ? nawatData.chatbot.greetings
    : ['مرحباً! أنا نوات، مساعدك في تعلم العلوم والـ STEM. اسألني عن أي درس!'];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  addMessage(greeting, 'bot');

  renderQuickQuestions();

  const input = document.getElementById('chatInput');
  if (input) {
    input.replaceWith(input.cloneNode(true));
    const newInput = document.getElementById('chatInput');
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

function renderQuickQuestions() {
  const container = document.getElementById('quickQuestions');
  if (!container) return;
  const quick = [
    'ما هي المخلوقات الحية؟',
    'ما أجزاء النبات؟',
    'الفصول الأربعة',
    'ما هو الصلب؟',
    'ما هو الهواء؟',
    'ما هي الطاقة؟',
    'الليل والنهار',
    'ما هو المخلوط؟',
    'الدفع والسحب',
    'أطوار القمر'
  ];

  container.innerHTML = quick.map(q => `
    <button class="quick-q" onclick="sendQuickMessage('${q}')" aria-label="${q}">${q}</button>
  `).join('');
}

function sendQuickMessage(text) {
  const input = document.getElementById('chatInput');
  if (input) input.value = text;
  sendMessage();
}

function sendMessage() {
  if (botTyping) return;
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';
  input.focus();

  botTyping = true;
  setTimeout(() => {
    const response = getBotResponse(text);
    addMessage(response, 'bot');
    botTyping = false;
  }, 700 + Math.random() * 500);
}

// ===== قاعدة معرفة البوت الشاملة =====
function getBotResponse(text) {
  const lower = text.toLowerCase().trim();

  // ===== مفاهيم الصف السادس الابتدائي =====
  if (state.selectedGradeId === 'grade6') {
    if (matchKeywords(lower, ['نظرية الخلية', 'الخلية', 'النسيج', 'العضو', 'الجهاز الحيوي'])) {
      return 'تنص نظرية الخلية على أن المخلوقات الحية تتكون من خلية أو أكثر، وأن الخلية هي الوحدة الأساسية للتركيب والوظيفة، وأن الخلايا الجديدة تنتج من خلايا موجودة. وفي المخلوقات عديدة الخلايا تنتظم الخلايا في أنسجة ثم أعضاء ثم أجهزة.';
    }
    if (matchKeywords(lower, ['الخلية النباتية', 'الخلية الحيوانية', 'البلاستيدات', 'الفجوة', 'الغشاء البلازمي'])) {
      return 'تشترك الخلايا النباتية والحيوانية في تراكيب أساسية مثل الغشاء البلازمي والسيتوبلازم والنواة، وتمتاز الخلية النباتية بجدار خلوي وبلاستيدات خضراء وفجوة عصارية كبيرة عادة.';
    }
    if (matchKeywords(lower, ['انقسام الخلايا', 'الانقسام المتساوي', 'الانقسام المنصف', 'دورة الخلية', 'الكروموسوم'])) {
      return 'تمر الخلية بدورة نمو واستعداد وانقسام. ينتج الانقسام المتساوي خليتين لهما العدد نفسه من الكروموسومات تقريباً، بينما ينتج الانقسام المنصف خلايا جنسية بنصف العدد.';
    }
    if (matchKeywords(lower, ['الوراثة والصفات', 'الوراثة', 'الجين', 'الصفة السائدة', 'الصفة المتنحية'])) {
      return 'الوراثة انتقال الصفات من الآباء إلى الأبناء عبر المعلومات الوراثية. الجين جزء من المادة الوراثية، وتستخدم نماذج الصفات السائدة والمتنحية لتفسير بعض أنماط انتقال الصفات.';
    }
    if (matchKeywords(lower, ['عمليات الحياة في النباتات', 'البناء الضوئي', 'النتح', 'التلقيح', 'الإخصاب'])) {
      return 'تمتص الجذور الماء والأملاح، وتنقل السيقان المواد، وتصنع الأوراق الغذاء بالبناء الضوئي. وتفقد النباتات بعض الماء بالنتح، كما يحدث التلقيح ثم الإخصاب في التكاثر الجنسي للنباتات الزهرية.';
    }
    if (matchKeywords(lower, ['المخلوقات الحية الدقيقة', 'البكتيريا', 'الطلائعيات', 'الخميرة'])) {
      return 'المخلوقات الحية الدقيقة صغيرة جداً وتشمل مجموعات متنوعة مثل البكتيريا وبعض الطلائعيات والفطريات المجهرية. تنفذ عمليات الحياة بطرائق مختلفة؛ ومن أمثلتها الخميرة التي قد تنتج غازاً عند استخدام السكر.';
    }
    if (matchKeywords(lower, ['الهضم والإخراج والتنفس والدوران', 'الهضم', 'الإخراج', 'التنفس', 'الدوران'])) {
      return 'تعمل أجهزة الهضم والتنفس والدوران والإخراج معاً: يهضم الجسم الغذاء ويمتص مواده، ويحصل على الأكسجين، وينقل الدم المواد إلى الخلايا، ثم يتخلص من الفضلات.';
    }
    if (matchKeywords(lower, ['الحركة والإحساس', 'الجهاز الهيكلي', 'الجهاز العضلي', 'الجهاز العصبي', 'الحواس'])) {
      return 'تنتج الحركة من تكامل العضلات والعظام والمفاصل، بينما يستقبل الجهاز العصبي المعلومات من الحواس ويعالجها ثم ينسق الاستجابة.';
    }
    if (matchKeywords(lower, ['السلاسل والشبكات الغذائية', 'هرم الطاقة', 'السلسلة الغذائية', 'الشبكة الغذائية', 'المستوى الغذائي'])) {
      return 'توضح السلسلة الغذائية مسار انتقال الطاقة، وتربط الشبكة الغذائية عدة سلاسل معاً. ويبين هرم الطاقة أن الطاقة المتاحة تقل كلما انتقلنا إلى مستويات غذائية أعلى.';
    }
    if (matchKeywords(lower, ['مقارنة الأنظمة البيئية', 'النظام البيئي', 'العوامل الحيوية', 'العوامل اللاحيوية', 'المنطقة الحيوية'])) {
      return 'يضم النظام البيئي مخلوقات حية وعوامل غير حية تتفاعل معاً. وتختلف الأنظمة بحسب الماء والحرارة والتربة والضوء والمخلوقات، لذلك يمكن مقارنتها بعوامل حيوية ولاحيوية.';
    }
    if (matchKeywords(lower, ['التربة', 'الدبال', 'التربة السطحية', 'نفاذية التربة'])) {
      return 'التربة مزيج من فتات الصخور والمواد العضوية والماء والهواء. تختلف أنواعها في حجم الحبيبات وكمية الدبال وقدرتها على تمرير الماء والاحتفاظ به.';
    }
    if (matchKeywords(lower, ['حماية الموارد', 'الموارد الطبيعية', 'المورد المتجدد', 'المورد غير المتجدد', 'إعادة التدوير'])) {
      return 'تحافظ المجتمعات على موارد الأرض بتقليل الاستهلاك وإعادة الاستخدام والتدوير ومنع التلوث. بعض الموارد يتجدد خلال زمن مناسب، وبعضها غير متجدد ويتكون ببطء شديد.';
    }
    if (matchKeywords(lower, ['نظام الأرض والشمس', 'دوران الأرض', 'محور الأرض', 'الفصول الأربعة'])) {
      return 'يسبب دوران الأرض حول محورها تعاقب الليل والنهار، بينما تدور حول الشمس خلال سنة. ويسهم ميل محور الأرض في اختلاف زاوية أشعة الشمس وطول النهار وحدوث الفصول.';
    }
    if (matchKeywords(lower, ['نظام الأرض والشمس والقمر', 'أطوار القمر', 'كسوف الشمس', 'خسوف القمر', 'الجاذبية'])) {
      return 'تتغير أطوار القمر بسبب تغير موضعه بالنسبة إلى الأرض والشمس والجزء المضاء الذي نراه. يحدث كسوف الشمس عندما يقع القمر بين الأرض والشمس، ويحدث خسوف القمر عندما تقع الأرض بين الشمس والقمر.';
    }
    if (matchKeywords(lower, ['النظام الشمسي', 'الكوكب', 'الكويكب', 'المذنب'])) {
      return 'يتكون النظام الشمسي من الشمس والكواكب وأقمارها وأجسام أصغر مثل الكويكبات والمذنبات. تدور الكواكب حول الشمس في مدارات وتختلف في الحجم والمسافة ومدة الدوران.';
    }
    if (matchKeywords(lower, ['النجوم والمجرات', 'النجم', 'المجموعة النجمية', 'السنة الضوئية', 'المجرة'])) {
      return 'النجوم أجرام غازية شديدة السخونة تنتج الضوء والطاقة. تتجمع أعداد هائلة من النجوم والغاز والغبار في مجرات، وتنتمي الشمس إلى مجرة درب التبانة. وتستخدم السنة الضوئية لقياس المسافات الكبيرة.';
    }
    if (matchKeywords(lower, ['الخصائص الفيزيائية للمادة', 'الكتلة', 'الحجم', 'الكثافة', 'الطفو'])) {
      return 'يمكن وصف المادة بخصائص فيزيائية مثل الكتلة والحجم والكثافة والحالة والتوصيل. الكثافة تساوي الكتلة مقسومة على الحجم، وتفيد في تفسير الطفو والمقارنة بين المواد.';
    }
    if (matchKeywords(lower, ['الماء والمخاليط', 'المخلوط', 'المحلول', 'المذاب', 'المذيب'])) {
      return 'المخلوط يجمع مادتين أو أكثر دون تكوين مادة جديدة. المحلول مخلوط متجانس يذوب فيه المذاب في المذيب، ويمكن فصل مخاليط بخصائص فيزيائية مثل الترشيح والتبخر والمغناطيسية.';
    }
    if (matchKeywords(lower, ['التغيرات الكيميائية', 'التغير الكيميائي', 'التفاعل الكيميائي', 'المتفاعلات', 'النواتج'])) {
      return 'في التغير الكيميائي تتكون مواد جديدة تختلف عن المواد الأصلية. من دلائله الممكنة تكون غاز أو راسب أو تغير دائم في اللون أو الطاقة، وتسمى المواد قبل التفاعل متفاعلات وبعده نواتج.';
    }
    if (matchKeywords(lower, ['الخصائص الكيميائية', 'قابلية الاحتراق', 'التفاعل مع الأكسجين', 'المقاومة الكيميائية'])) {
      return 'الخاصية الكيميائية تصف قدرة المادة على التفاعل وتكوين مواد جديدة، مثل قابلية الاحتراق أو التفاعل مع الأكسجين. تساعد معرفة هذه الخصائص في اختيار المواد واستخدامها وتخزينها بأمان.';
    }
    if (matchKeywords(lower, ['الحركة', 'السرعة', 'السرعة المتجهة', 'التسارع', 'نقطة مرجعية'])) {
      return 'الحركة تغير موقع جسم بالنسبة إلى نقطة مرجعية مع الزمن. تحسب السرعة المتوسطة من المسافة والزمن، والسرعة المتجهة تتضمن الاتجاه، والتسارع هو تغير السرعة أو الاتجاه مع الزمن.';
    }
    if (matchKeywords(lower, ['القوى والحركة', 'القوة', 'القوة المحصلة', 'الاحتكاك', 'الجاذبية'])) {
      return 'القوة دفع أو سحب، وتحدد القوة المحصلة تغير حركة الجسم. القوى غير المتزنة تسبب تسارعاً، والاحتكاك يعارض الحركة، والجاذبية تسحب الأجسام نحو الأرض قرب سطحها.';
    }
    if (matchKeywords(lower, ['الكهرباء', 'الشحنة الكهربائية', 'التيار الكهربائي', 'الدائرة الكهربائية', 'الموصل', 'العازل'])) {
      return 'يمر التيار الكهربائي عندما يوجد مسار مغلق في دائرة مناسبة. تحتاج الدائرة إلى مصدر وطريق موصل وحمل، وتسمح الموصلات بمرور الشحنات بسهولة نسبية بينما تعيقها العوازل.';
    }
    if (matchKeywords(lower, ['المغناطيسية', 'المغناطيس', 'المجال المغناطيسي', 'المغناطيس الكهربائي', 'المولد', 'المحرك'])) {
      return 'للمغناطيس قطبان ويظهر حوله مجال مغناطيسي. الأقطاب المتشابهة تتنافر والمختلفة تتجاذب. ويمكن صنع مغناطيس كهربائي بمرور تيار في ملف، وتستخدم المغناطيسية في المحركات والمولدات والرافعات وتطبيقات الرفع المغناطيسي.';
    }
  }

  // ===== مفاهيم الصف الخامس الابتدائي =====
  if (state.selectedGradeId === 'grade5') {
    if (matchKeywords(lower, ['تصنيف المخلوقات الحية', 'التصنيف', 'المملكة', 'النوع'])) {
      return 'يصنف العلماء المخلوقات الحية في مجموعات بحسب صفات مشتركة. من مستويات التصنيف مجموعات واسعة ثم مجموعات أكثر تحديداً، ويساعد ذلك على تنظيم التنوع الحيوي ومقارنة المخلوقات.';
    }
    if (matchKeywords(lower, ['النباتات', 'النباتات الوعائية', 'النباتات اللاوعائية', 'الخشب', 'اللحاء'])) {
      return 'تنقسم النباتات إلى وعائية ولاوعائية. ينقل الخشب الماء والأملاح من الجذور إلى أعلى النبات، وينقل اللحاء السكريات الناتجة عن البناء الضوئي إلى الأجزاء التي تحتاج إليها.';
    }
    if (matchKeywords(lower, ['التكاثر', 'التكاثر الجنسي', 'التكاثر اللاجنسي', 'التكاثر الخضري', 'الإخصاب'])) {
      return 'التكاثر الجنسي يتضمن اتحاد خلايا جنسية وينتج تنوعاً في صفات الأبناء، أما التكاثر اللاجنسي فينتج أفراداً من أب واحد غالباً، ومن أمثلته الانقسام والتبرعم والتكاثر الخضري.';
    }
    if (matchKeywords(lower, ['دورات الحياة', 'التحول الكامل', 'التحول الناقص', 'التلقيح'])) {
      return 'دورة الحياة هي مراحل النمو والتغير التي يمر بها المخلوق. التحول الكامل يتضمن البيضة واليرقة والعذراء والبالغ، أما التحول الناقص فيمر بالبيضة والحورية والبالغ. وفي النباتات الزهرية يحدث التلقيح ثم الإخصاب وتكوين البذور.';
    }
    if (matchKeywords(lower, ['العلاقات في الأنظمة البيئية', 'المنتج', 'المستهلك', 'المحلل', 'الشبكة الغذائية'])) {
      return 'تنتقل الطاقة في السلاسل الغذائية من المنتجات إلى المستهلكات، وتعيد المحللات مواد إلى البيئة. وترابط عدة سلاسل يكون شبكة غذائية، لذلك قد يؤثر تغير نوع واحد في أنواع أخرى.';
    }
    if (matchKeywords(lower, ['التكيف والبقاء', 'التكيف', 'التمويه', 'تكيف سلوكي', 'تكيف تركيبي'])) {
      return 'التكيف صفة أو سلوك يساعد المخلوق على البقاء والتكاثر. قد يكون تركيبياً مثل لون الجسم وشكل المنقار، أو سلوكياً مثل الهجرة والنشاط الليلي. والتمويه مثال يساعد على تقليل اكتشاف المخلوق.';
    }
    if (matchKeywords(lower, ['الدورات في الأنظمة البيئية', 'دورة الماء', 'دورة الكربون', 'دورة النيتروجين'])) {
      return 'تدور المادة في الأنظمة البيئية. تشمل دورة الماء التبخر والتكاثف والهطول، وتنتقل ذرات الكربون والنيتروجين بين الهواء والتربة والماء والمخلوقات الحية بعمليات متعددة.';
    }
    if (matchKeywords(lower, ['التغيرات في الأنظمة البيئية', 'التعاقب', 'الانقراض', 'الأنواع المهددة'])) {
      return 'قد تتغير الأنظمة البيئية بسبب عوامل طبيعية أو بشرية. التعاقب تغير تدريجي في المجتمع الحيوي، وقد تصبح الأنواع مهددة أو تنقرض إذا انخفضت أعدادها ولم تستطع الاستجابة للتغير.';
    }
    if (matchKeywords(lower, ['معالم سطح الأرض', 'الجبل', 'الهضبة', 'الوادي', 'الرف القاري'])) {
      return 'تتنوع معالم سطح الأرض بين جبال وهضاب وسهول ووديان، كما أن قاع المحيط يضم الرف القاري والمنحدر القاري وسهولاً وأخاديد وسلاسل جبلية.';
    }
    if (matchKeywords(lower, ['العمليات المؤثرة في سطح الأرض', 'الصفائح الأرضية', 'التجوية', 'التعرية', 'الترسيب'])) {
      return 'يتغير سطح الأرض بعمليات داخلية مثل حركة الصفائح والزلازل والبراكين، وبعمليات خارجية مثل التجوية التي تفتت الصخور، والتعرية التي تنقل الفتات، والترسيب الذي يجمع المواد في مكان جديد.';
    }
    if (matchKeywords(lower, ['مصادر الطاقة', 'المورد المتجدد', 'المورد غير المتجدد', 'الوقود الأحفوري', 'الطاقة المتجددة'])) {
      return 'مصادر الطاقة قد تكون غير متجددة مثل النفط والغاز والفحم، أو متجددة مثل الشمس والرياح والمياه. اختيار المصدر يتأثر بالتكلفة والموقع والاستمرارية والأثر البيئي.';
    }
    if (matchKeywords(lower, ['الهواء والماء', 'تلوث الهواء', 'تلوث الماء', 'ترشيد الموارد'])) {
      return 'الهواء والماء موردان أساسيان وقد يتعرضان للتلوث. تساعد معالجة الماء، ومنع الملوثات، وتقليل الهدر، وإعادة الاستخدام حيث يكون آمناً على حماية الموارد.';
    }
    if (matchKeywords(lower, ['الغلاف الجوي والطقس', 'الغلاف الجوي', 'الضغط الجوي', 'الرياح العالمية', 'الرياح المحلية'])) {
      return 'تسخن الشمس سطح الأرض بصورة غير متساوية، فتتكون فروق في درجة الحرارة والضغط. يتحرك الهواء من الضغط المرتفع نحو المنخفض، فتتشكل رياح محلية وعالمية.';
    }
    if (matchKeywords(lower, ['الغيوم والهطول', 'الرطوبة', 'الجبهة الهوائية', 'التكاثف'])) {
      return 'تتشكل الغيوم عندما يبرد بخار الماء ويتكاثف على جسيمات دقيقة. يحدث الهطول عندما تكبر القطرات أو بلورات الجليد، كما تؤثر الكتل والجبهات الهوائية في تغيرات الطقس.';
    }
    if (matchKeywords(lower, ['العواصف', 'العاصفة الرعدية', 'الإعصار القمعي', 'الإعصار الحلزوني', 'موجة العاصفة'])) {
      return 'العواصف قد تكون رعدية أو ثلجية أو رملية، وقد تتكون أعاصير قمعية أو حلزونية. تجمع محطات الرصد والرادار والأقمار الاصطناعية بيانات تساعد على التوقع وإصدار التحذيرات.';
    }
    if (matchKeywords(lower, ['المناخ', 'التيارات المحيطية', 'ظل المطر', 'التغير المناخي'])) {
      return 'المناخ هو متوسط أنماط الطقس خلال مدة طويلة. يتأثر بخط العرض والارتفاع والمسافة عن الماء والتيارات المحيطية والرياح والتضاريس، ومنها تأثير الجبال في تكوين ظل المطر.';
    }
    if (matchKeywords(lower, ['العناصر', 'العنصر', 'الذرة', 'النواة', 'العدد الذري', 'الجدول الدوري'])) {
      return 'العنصر مادة نقية تتكون من نوع واحد من الذرات. تحتوي الذرة نواة فيها بروتونات ونيوترونات وتحيط بها إلكترونات، ويحدد عدد البروتونات هوية العنصر وعدده الذري.';
    }
    if (matchKeywords(lower, ['الفلزات واللافلزات وأشباه الفلزات', 'الفلزات', 'اللافلزات', 'أشباه الفلزات'])) {
      return 'الفلزات غالباً جيدة التوصيل ولامعة وقابلة للتشكيل، واللافلزات تختلف عنها في كثير من الخصائص، وأشباه الفلزات تجمع صفات وسطية وتدخل بعض أنواعها في صناعة الإلكترونيات.';
    }
    if (matchKeywords(lower, ['تغيرات حالة المادة', 'الانصهار', 'التجمد', 'التبخر', 'التكاثف'])) {
      return 'الانصهار تحول الصلب إلى سائل، والتجمد عكسه، والتبخر تحول السائل إلى غاز من سطحه، والتكاثف تحول الغاز إلى سائل. هذه تغيرات فيزيائية لا تنتج مادة جديدة.';
    }
    if (matchKeywords(lower, ['المركبات والتغيرات الكيميائية', 'المركب', 'التغير الكيميائي', 'التفاعل الكيميائي', 'المتفاعلات'])) {
      return 'المركب مادة نقية من عنصرين أو أكثر متحدين كيميائياً بنسبة محددة. في التغير الكيميائي يعاد ترتيب الذرات وتتكون مواد جديدة، ويمكن الاستدلال عليه بأدلة مثل تكوّن غاز أو راسب أو تغير طاقة.';
    }
    if (matchKeywords(lower, ['الشغل والطاقة', 'الشغل', 'الطاقة الحركية', 'طاقة الوضع'])) {
      return 'يحدث الشغل عندما تؤثر قوة فتحرك جسماً مسافة في اتجاهها. الطاقة هي القدرة على بذل شغل أو إحداث تغير، ومن صورها الطاقة الحركية وطاقة الوضع التي يمكن أن تتحول إحداهما إلى الأخرى.';
    }
    if (matchKeywords(lower, ['الآلات البسيطة', 'الرافعة', 'البكرة', 'السطح المائل', 'الفائدة الميكانيكية'])) {
      return 'الآلات البسيطة مثل الرافعة والبكرة والعجلة والمحور والسطح المائل والإسفين والبرغي تغير مقدار القوة أو اتجاهها لتسهيل أداء الشغل، وغالباً يكون المقابل زيادة المسافة.';
    }
    if (matchKeywords(lower, ['الصوت', 'الاهتزاز', 'الموجة الصوتية', 'التردد', 'حدة الصوت'])) {
      return 'ينتج الصوت عن اهتزاز الأجسام وينتقل خلال وسط مادي. يرتبط التردد بحدة الصوت، وترتبط سعة الاهتزاز بالشدة، ولا ينتقل الصوت في الفراغ.';
    }
    if (matchKeywords(lower, ['الضوء', 'الانعكاس', 'الانكسار', 'الطيف المرئي', 'العدسة'])) {
      return 'ينتقل الضوء في الفراغ والمواد الشفافة، وينعكس عن الأسطح وينكسر عند انتقاله بين وسطين شفافين مختلفين. ويمكن للمنشور فصل الضوء الأبيض إلى ألوان الطيف المرئي.';
    }
  }

  // ===== مفاهيم الصف الرابع الابتدائي =====
  if (matchKeywords(lower, ['خلايا الصف الرابع', 'الخلية النباتية', 'الخلية الحيوانية', 'أجزاء الخلية'])) {
    return 'الخلية هي وحدة البناء الأساسية في المخلوق الحي. تشترك الخلايا النباتية والحيوانية في تراكيب مثل الغشاء والنواة والميتوكندريا، وتمتاز الخلية النباتية بوجود جدار خلوي وبلاستيدات خضراء.';
  }
  if (matchKeywords(lower, ['تصنيف المخلوقات الحية', 'الممالك', 'المملكة'])) {
    return 'يصنف العلماء المخلوقات الحية وفق صفات مشتركة مثل عدد الخلايا ووجود النواة وطريقة الحصول على الغذاء. المملكة مجموعة كبيرة تضم مخلوقات تشترك في صفات عامة.';
  }
  if (matchKeywords(lower, ['الحيوانات اللافقارية', 'لافقاريات', 'المفصليات', 'الرخويات'])) {
    return 'اللافقاريات حيوانات لا تمتلك عموداً فقرياً. من مجموعاتها الإسفنجيات واللاسعات والرخويات والديدان وشوكيات الجلد والمفصليات، وتتميز المفصليات بهيكل خارجي وأرجل مفصلية.';
  }
  if (matchKeywords(lower, ['الحيوانات الفقارية', 'فقاريات الصف الرابع', 'ثابتة درجة الحرارة', 'متغيرة درجة الحرارة'])) {
    return 'الفقاريات حيوانات لها عمود فقري، وتشمل الأسماك والبرمائيات والزواحف والطيور والثدييات. الطيور والثدييات ثابتة درجة الحرارة، بينما الأسماك والبرمائيات والزواحف متغيرة درجة الحرارة.';
  }
  if (matchKeywords(lower, ['أجهزة أجسام الحيوانات', 'الجهاز الدوراني', 'الجهاز التنفسي', 'الجهاز العصبي', 'الجهاز الإخراجي'])) {
    return 'تعمل أجهزة جسم الحيوان معاً؛ فالتنفسي يدخل الأكسجين، والدوراني ينقل الدم والمواد، والهضمي يعالج الغذاء، والعصبي ينسق الاستجابات، والإخراجي يساعد على التخلص من الفضلات.';
  }
  if (matchKeywords(lower, ['مقدمة في الأنظمة البيئية', 'العوامل الحيوية', 'العوامل اللاحيوية', 'الموطن'])) {
    return 'النظام البيئي يضم المخلوقات الحية والعوامل غير الحية التي تتفاعل في مكان ما. العوامل الحيوية هي المكونات الحية، واللاحيوية مثل الماء والضوء والهواء والتربة.';
  }
  if (matchKeywords(lower, ['العلاقات في الأنظمة البيئية', 'التنافس', 'التكافل', 'شبكة غذائية الصف الرابع'])) {
    return 'ترتبط المخلوقات في النظام البيئي بعلاقات غذائية وبالتنافس والتكافل. تنتقل الطاقة من المنتجات إلى المستهلكات، وتتداخل السلاسل الغذائية لتكوّن شبكة غذائية.';
  }
  if (matchKeywords(lower, ['التغيرات في الأنظمة البيئية', 'التعاقب البيئي', 'حماية البيئة'])) {
    return 'قد تتغير الأنظمة البيئية بسبب الجفاف والفيضانات والحرائق أو نشاط الإنسان. قد تتغير المواطن وأعداد المخلوقات، وتساعد الحماية وإعادة التأهيل في المحافظة على التنوع الحيوي.';
  }
  if (matchKeywords(lower, ['الأمراض', 'المرض المعدي', 'مسبب المرض', 'العدوى'])) {
    return 'المرض المعدي يمكن أن ينتقل بين المخلوقات بسبب مسببات مثل بعض الفيروسات والبكتيريا والفطريات والطفيليات. تختلف طرق الانتقال، لذلك تساعد معرفة طريقة الانتقال على اختيار الوقاية المناسبة.';
  }
  if (matchKeywords(lower, ['الوقاية من العدوى', 'المناعة', 'اللقاح', 'غسل اليدين'])) {
    return 'من وسائل الوقاية غسل اليدين جيداً، وتغطية الفم والأنف عند السعال أو العطاس، والتعامل الآمن مع الغذاء والماء، واتباع برامج التطعيم والإرشادات الصحية المعتمدة.';
  }
  if (matchKeywords(lower, ['المحافظة على الصحة', 'العادات الصحية', 'النوم الكافي', 'النشاط البدني'])) {
    return 'المحافظة على الصحة تعتمد على عادات متوازنة مثل النظافة والنوم الكافي والنشاط البدني والعناية بالأسنان والابتعاد عن السلوكيات الضارة.';
  }
  if (matchKeywords(lower, ['الغذاء والتغذية', 'العناصر الغذائية', 'الكربوهيدرات', 'البروتينات', 'الفيتامينات'])) {
    return 'يحتاج الجسم إلى غذاء متنوع يوفر الطاقة ومواد البناء والتنظيم. الكربوهيدرات مصدر مهم للطاقة، والبروتينات تساعد في بناء الأنسجة، ويحتاج الجسم أيضاً إلى الفيتامينات والمعادن والماء.';
  }
  if (matchKeywords(lower, ['المعادن والصخور', 'الصخر الناري', 'الصخر الرسوبي', 'الصخر المتحول', 'القساوة'])) {
    return 'المعدن مادة طبيعية غير حية لها خصائص محددة مثل البريق والقساوة والمخدش. الصخور قد تكون نارية أو رسوبية أو متحولة، وتختلف طريقة تكوّن كل نوع.';
  }
  if (matchKeywords(lower, ['الماء الصف الرابع', 'المياه الجوفية', 'الخزان الجوفي', 'تنقية الماء'])) {
    return 'معظم ماء الأرض مالح، أما الماء العذب المتاح فهو محدود. المياه الجوفية تخزن في طبقات تحت سطح الأرض، ويعالج الماء لإزالة الشوائب والملوثات قبل الاستخدام.';
  }
  if (matchKeywords(lower, ['الأرض والشمس والقمر', 'دورة الأرض اليومية', 'دورة الأرض السنوية', 'كسوف', 'خسوف'])) {
    return 'دوران الأرض حول محورها يسبب تعاقب الليل والنهار، ودورانها حول الشمس مع ميل محورها يرتبط بالفصول. ويدور القمر حول الأرض فتظهر أطواره، وقد يحدث الكسوف أو الخسوف عند اصطفاف الأجرام في أوضاع محددة.';
  }
  if (matchKeywords(lower, ['النظام الشمسي الصف الرابع', 'المذنب', 'الجاذبية والكواكب'])) {
    return 'يتكون النظام الشمسي من الشمس والكواكب الثمانية وأقمارها وأجرام أخرى مثل المذنبات والكويكبات. تبقي الجاذبية الأجرام في مداراتها.';
  }
  if (matchKeywords(lower, ['القياس الصف الرابع', 'قياس المادة', 'الكثافة', 'حجم جسم غير منتظم'])) {
    return 'يمكن وصف المادة بخصائص قابلة للقياس مثل الطول والكتلة والحجم والكثافة. نستخدم وحدات معيارية، ويمكن إيجاد حجم جسم غير منتظم بطريقة إزاحة الماء.';
  }
  if (matchKeywords(lower, ['كيف تتغير المادة', 'التغير الفيزيائي والكيميائي', 'تغير كيميائي الصف الرابع'])) {
    return 'التغير الفيزيائي يغير الشكل أو الحجم أو الحالة دون تكوّن مادة جديدة، مثل الانصهار. أما التغير الكيميائي فينتج مواد جديدة، مثل الصدأ والاحتراق.';
  }
  if (matchKeywords(lower, ['المخاليط', 'المذاب', 'المذيب', 'فصل المخاليط'])) {
    return 'المخلوط يجمع مادتين أو أكثر مع بقاء خصائصها الأساسية. المحلول مخلوط متجانس من مذاب ومذيب، ويمكن فصل مخاليط بطرق تعتمد على خواص المكونات مثل الترشيح أو الغربلة أو المغناطيس.';
  }
  if (matchKeywords(lower, ['القوى والحركة', 'القوة والحركة', 'السرعة الصف الرابع'])) {
    return 'القوة دفع أو سحب يمكن أن يغير حركة الجسم أو اتجاهه. نصف الحركة بتغير الموقع بالنسبة إلى نقطة مرجعية، وترتبط السرعة بالمسافة التي يقطعها الجسم والزمن.';
  }
  if (matchKeywords(lower, ['تغير الحركة', 'القوى المتزنة', 'القوى غير المتزنة', 'الاحتكاك'])) {
    return 'القوى المتزنة لا تغير حالة حركة الجسم، بينما القوى غير المتزنة تغير سرعته أو اتجاهه. الاحتكاك قوة تعارض الحركة بين سطحين متلامسين وقد يكون مفيداً أو معيقاً.';
  }
  if (matchKeywords(lower, ['الحرارة الصف الرابع', 'التوصيل الحراري', 'العازل الحراري'])) {
    return 'الحرارة طاقة تنتقل من الجسم الأعلى حرارة إلى الأقل حرارة. تنتقل الحرارة بطرائق منها التوصيل، وتستخدم المواد العازلة لتقليل انتقالها.';
  }
  if (matchKeywords(lower, ['الكهرباء الصف الرابع', 'الكهرباء الساكنة', 'الدائرة المغلقة', 'الموصل والعازل'])) {
    return 'الكهرباء شكل من الطاقة. تعمل الدائرة عندما يكون المسار مغلقاً، والفلزات موصلات جيدة غالباً بينما البلاستيك والمطاط عازلان. الكهرباء الساكنة تنتج عن تراكم شحنات على سطح جسم.';
  }
  if (matchKeywords(lower, ['المغناطيسية الصف الرابع', 'المجال المغناطيسي', 'المغناطيس الكهربائي الصف الرابع'])) {
    return 'للمغناطيس قطبان ومجال مغناطيسي. الأقطاب المختلفة تتجاذب والمتشابهة تتنافر، ويمكن إنتاج مغناطيس كهربائي بمرور تيار منخفض الجهد في ملف حول قلب حديدي مع الالتزام بقواعد السلامة.';
  }

  // ===== مفاهيم الصف الثالث الابتدائي =====
  if (matchKeywords(lower, ['المخلوقات الحية وحاجاتها', 'خصائص المخلوقات الحية', 'حاجات المخلوقات'])) {
    return 'المخلوقات الحية تنمو وتتغير وتستجيب للمؤثرات وتتكاثر، وتحتاج إلى الماء والغذاء والهواء ومكان مناسب للعيش.';
  }
  if (matchKeywords(lower, ['دورات حياة النباتات', 'إنبات', 'التلقيح'])) {
    return 'تبدأ حياة نباتات كثيرة بالبذرة. عند توافر الظروف المناسبة تنبت البذرة، ثم ينمو الجذر والساق والأوراق، وبعد ذلك قد ينتج النبات أزهاراً وبذوراً جديدة.';
  }
  if (matchKeywords(lower, ['السلاسل والشبكات الغذائية', 'الشبكة الغذائية', 'المحللات'])) {
    return 'السلسلة الغذائية توضح انتقال الطاقة بين المخلوقات. المنتج يصنع غذاءه، والمستهلك يأكل مخلوقات أخرى، والمحللات تفكك البقايا. وترابط عدة سلاسل يكون شبكة غذائية.';
  }
  if (matchKeywords(lower, ['التكيف', 'تكيفات'])) {
    return 'التكيف صفة تركيبية أو سلوك يساعد المخلوق الحي على البقاء في موطنه، مثل صفات الجمل ونباتات الصحراء التي تساعد على تحمل قلة الماء.';
  }
  if (matchKeywords(lower, ['تغيرات الأرض السريعة', 'زلزال', 'بركان'])) {
    return 'من تغيرات الأرض السريعة الزلازل والبراكين؛ فالزلزال اهتزاز مفاجئ للقشرة الأرضية، والبركان فتحة تخرج منها مواد منصهرة وغازات.';
  }
  if (matchKeywords(lower, ['التجوية والتعرية', 'التجوية', 'التعرية', 'الترسيب'])) {
    return 'التجوية تفتيت الصخور في مكانها، والتعرية نقل الفتات والتربة، والترسيب تجمع المواد المنقولة في مكان جديد.';
  }
  if (matchKeywords(lower, ['عناصر الطقس', 'الضغط الجوي', 'مقياس المطر', 'دوارة الرياح'])) {
    return 'من عناصر الطقس درجة الحرارة والهطول والرياح والضغط الجوي. وتستخدم أدوات مثل مقياس الحرارة ومقياس المطر ودوارة الرياح والبارومتر لوصف حالة الطقس.';
  }
  if (matchKeywords(lower, ['تقلبات الطقس', 'عاصفة رعدية', 'عاصفة رملية', 'إعصار قمعي', 'إعصار حلزوني'])) {
    return 'تقلبات الطقس قد تشمل العواصف الرعدية والرملية والأعاصير. عند الطقس الشديد نتابع التحذيرات ونتبع تعليمات السلامة والجهات المختصة.';
  }
  if (matchKeywords(lower, ['دورة الماء', 'الهطول', 'التكاثف'])) {
    return 'تسخن الشمس الماء فيتبخر، ثم يبرد بخار الماء فيتكاثف، وقد يسقط هطولاً ويعود إلى سطح الأرض، فتستمر دورة الماء.';
  }
  if (matchKeywords(lower, ['المادة وقياسها', 'الكتلة', 'الحجم'])) {
    return 'المادة كل ما له كتلة ويشغل حيزاً. نقيس الكتلة بميزان، والحجم يصف مقدار الحيز الذي يشغله الجسم، ونستخدم خواص متعددة لوصف المادة.';
  }
  if (matchKeywords(lower, ['التغيرات الفيزيائية', 'تغير فيزيائي', 'مخلوط', 'محلول'])) {
    return 'في التغير الفيزيائي يتغير شكل المادة أو حجمها أو حالتها دون تكوّن مادة جديدة. والمخلوط يجمع مواد تبقى خواصها الأساسية موجودة.';
  }
  if (matchKeywords(lower, ['التغيرات الكيميائية', 'تغير كيميائي', 'الصدأ'])) {
    return 'في التغير الكيميائي تتكون مادة أو مواد جديدة بخصائص مختلفة، ومن أمثلته صدأ الحديد وبعض تغيرات الطهي.';
  }
  if (matchKeywords(lower, ['الآلات البسيطة', 'رافعة', 'بكرة', 'سطح مائل'])) {
    return 'الآلات البسيطة مثل الرافعة والبكرة والسطح المائل والعجلة والمحور تساعد على أداء الشغل بتغيير مقدار القوة أو اتجاهها.';
  }
  if (matchKeywords(lower, ['الصوت', 'الاهتزاز', 'حدة الصوت', 'شدة الصوت'])) {
    return 'الصوت طاقة تنتج من اهتزاز الأجسام وتنتقل خلال مادة. تختلف الأصوات في الشدة والحدة، ولا ينتقل الصوت في الفراغ.';
  }
  if (matchKeywords(lower, ['الضوء', 'الانعكاس', 'الظل', 'شفاف', 'معتم'])) {
    return 'الضوء ينتقل في خطوط مستقيمة تقريباً وينعكس عن الأسطح. الجسم المعتم يحجب الضوء فيكوّن ظلاً، والمواد الشفافة تسمح بمرور معظم الضوء.';
  }
  if (matchKeywords(lower, ['الكهرباء', 'دائرة كهربائية', 'المغناطيس الكهربائي'])) {
    return 'تعمل الدائرة عندما يكون المسار مغلقاً. ويمكن صنع مغناطيس كهربائي تعليمي بتمرير تيار منخفض الجهد في سلك ملفوف حول قلب حديدي، مع الالتزام الكامل بالسلامة وعدم استخدام كهرباء المنزل.';
  }

  // ===== مفاهيم الصف الثاني الابتدائي =====
  if (matchKeywords(lower, ['حاجات المخلوقات', 'حاجات المخلوقات الحية', 'ماذا تحتاج المخلوقات'])) {
    return 'المخلوقات الحية تحتاج إلى الماء والهواء ومكان مناسب للعيش. الحيوانات تحتاج إلى الغذاء، والنباتات تحتاج إلى ضوء الشمس لتصنع غذاءها.';
  }
  if (matchKeywords(lower, ['حبوب اللقاح', 'التلقيح', 'تنتج نباتات جديدة'])) {
    return 'تساعد الزهرة على إنتاج البذور. تنتقل حبوب اللقاح بين الأزهار بوسائل منها الحشرات والرياح، ثم يمكن أن تتكون بذور تنمو إلى نباتات جديدة.';
  }
  if (matchKeywords(lower, ['فقاريات', 'لافقاريات', 'مجموعات الحيوانات'])) {
    return 'الفقاريات حيوانات لها عمود فقري، مثل الأسماك والطيور والثدييات. اللافقاريات لا تملك عموداً فقرياً، مثل الحشرات والديدان.';
  }
  if (matchKeywords(lower, ['دورة حياة الحيوان', 'الحيوانات تنمو وتتغير', 'أبو ذنيبة', 'عذراء'])) {
    return 'تمر الحيوانات بمراحل تسمى دورة الحياة. الفراشة: بيضة ثم يرقة ثم عذراء ثم فراشة بالغة. والضفدع يبدأ من البيض ثم أبو ذنيبة ثم ضفدع صغير فبالغ.';
  }
  if (matchKeywords(lower, ['سلسلة غذائية', 'سلاسل الغذاء', 'منتج', 'مستهلك'])) {
    return 'السلسلة الغذائية تبين انتقال الغذاء والطاقة. تبدأ كثير من السلاسل بالشمس، ثم نبات منتج يصنع غذاءه، ثم حيوان مستهلك يحصل على غذائه بأكل نبات أو حيوان.';
  }
  if (matchKeywords(lower, ['صحراء باردة', 'الصحاري الحارة والباردة'])) {
    return 'الصحاري قليلة الأمطار، وليست كلها حارة؛ توجد صحاري باردة أيضاً. تساعد تكيفات المخلوقات على تحمل قلة الماء والحرارة أو البرودة.';
  }
  if (matchKeywords(lower, ['اليابسة', 'جبل', 'تل', 'سهل', 'وادي'])) {
    return 'من أشكال اليابسة: الجبل وهو مرتفع جداً، والتل أقل ارتفاعاً، والسهل واسع ومستوي تقريباً، والوادي أرض منخفضة بين مناطق مرتفعة.';
  }
  if (matchKeywords(lower, ['الماء على الأرض', 'محيط', 'نهر', 'بحيرة', 'ماء عذب', 'ماء مالح'])) {
    return 'يوجد الماء في المحيطات والبحار والأنهار والبحيرات وغيرها. معظم ماء الأرض في المحيطات والبحار وهو مالح، أما كثير من الأنهار والبحيرات ففيها ماء عذب.';
  }
  if (matchKeywords(lower, ['صخور ومعادن', 'الصخور والمعادن', 'معدن', 'لمعان', 'صلابة'])) {
    return 'الصخر مادة طبيعية صلبة قد تتكون من معدن واحد أو أكثر، والمعدن مادة طبيعية غير حية لها خصائص محددة. نستخدم اللون واللمعان والصلابة والملمس للمقارنة.';
  }
  if (matchKeywords(lower, ['تربة', 'الدبال', 'رملية', 'طينية'])) {
    return 'التربة خليط من فتات الصخور وبقايا المخلوقات الحية والماء والهواء. الدبال بقايا متحللة، والتربة الطينية تحتفظ بالماء أكثر عادة من التربة الرملية.';
  }
  if (matchKeywords(lower, ['الليل والنهار', 'الحركة الدورانية', 'محور الأرض'])) {
    return 'تدور الأرض حول محورها باستمرار. الجهة المواجهة للشمس يكون فيها النهار، والجهة الأخرى يكون فيها الليل. تستغرق دورة كاملة نحو 24 ساعة.';
  }
  if (matchKeywords(lower, ['سبب حدوث الفصول', 'مدار الأرض', 'ميل المحور'])) {
    return 'تدور الأرض حول الشمس في مدار خلال سنة تقريباً، ويبقى محورها مائلاً. يرتبط هذا الميل مع دوران الأرض حول الشمس بتغير كمية الضوء وحدوث الفصول.';
  }
  if (matchKeywords(lower, ['طور القمر', 'أطوار القمر', 'القمر والنجوم'])) {
    return 'القمر لا يصدر ضوءه الخاص؛ نحن نراه لأنه يعكس ضوء الشمس. أثناء دورانه حول الأرض نرى أجزاء مضيئة مختلفة تسمى أطوار القمر.';
  }
  if (matchKeywords(lower, ['النظام الشمسي', 'كواكب', 'الكواكب'])) {
    return 'النظام الشمسي يضم الشمس والكواكب الثمانية وأقمارها وأجساماً أخرى. الشمس نجم في المركز، والكواكب تدور حولها في مدارات.';
  }
  if (matchKeywords(lower, ['تغير حالة المادة', 'انصهار', 'تجمد', 'تبخر', 'تكاثف'])) {
    return 'الانصهار: صلب إلى سائل. التجمد: سائل إلى صلب. التبخر: سائل إلى غاز. التكاثف: غاز إلى سائل. التسخين والتبريد يساعدان على حدوث هذه التغيرات.';
  }
  if (matchKeywords(lower, ['المغناطيسات', 'مغناطيس', 'قطب شمالي', 'قطب جنوبي', 'تجاذب', 'تنافر'])) {
    return 'للمغناطيس قطبان شمالي وجنوبي. الأقطاب المختلفة تتجاذب والمتشابهة تتنافر. يجذب المغناطيس بعض المواد مثل الحديد، لكنه لا يجذب الخشب والبلاستيك عادة.';
  }
  if (matchKeywords(lower, ['استكشاف الكهرباء', 'دائرة كهربائية', 'موصل', 'عازل', 'بطارية', 'مفتاح كهربائي'])) {
    return 'تعمل الدائرة الكهربائية البسيطة عندما يكون المسار مغلقاً من البطارية عبر الأسلاك والمصباح. الفلزات موصلة غالباً والبلاستيك والمطاط عازلان. لا نجرب أبداً بمقابس كهرباء المنزل.';
  }

  // ===== ردود الفصل الأول =====

  // المخلوقات الحية
  if (matchKeywords(lower, ['مخلوق حي', 'مخلوقات حية', 'حي وغير حي', 'حية', 'كائنات حية'])) {
    return 'المخلوقات الحية هي كل الكائنات التي تنمو وتتنفس وتتغذى وتتكاثر. مثلها: النباتات والحيوانات والإنسان. أما الأشياء غير الحية كالحجر والكرسي فلا تملك هذه الخصائص.';
  }
  if (matchKeywords(lower, ['ينمو', 'يتنفس', 'يتغذى', 'يتكاثر', 'خصائص الحياة'])) {
    return 'خصائص المخلوقات الحية أربع: تنمو (تكبر مع الوقت) وتتغذى (تأكل وتشرب) وتتنفس (تأخذ الهواء) وتتكاثر (تنجب صغاراً).';
  }

  // النباتات
  if (matchKeywords(lower, ['نبات', 'نباتات', 'أجزاء النبات', 'أجزاء نبات'])) {
    return 'النبات له أربعة أجزاء رئيسية: الجذور (تثبته وتمتص الماء)، والساق (يحمله ويوصل الماء)، والأوراق (تصنع الغذاء بضوء الشمس)، والأزهار (تنتج البذور).';
  }
  if (matchKeywords(lower, ['جذور', 'الجذور'])) {
    return 'الجذور هي الجزء السفلي من النبات الذي يثبته في التربة ويمتص الماء والأملاح المعدنية من التربة.';
  }
  if (matchKeywords(lower, ['ساق', 'الساق'])) {
    return 'الساق هو الجزء الوسطي الذي يحمل النبات ويوصل الماء والغذاء من الجذور إلى الأوراق.';
  }
  if (matchKeywords(lower, ['أوراق', 'الأوراق', 'ورق النبات'])) {
    return 'الأوراق تصنع الغذاء للنبات باستخدام ضوء الشمس والهواء والماء في عملية تسمى البناء الضوئي.';
  }
  if (matchKeywords(lower, ['أزهار', 'الأزهار', 'زهرة'])) {
    return 'الأزهار هي الجزء الجميل الملون في النبات، وتنتج البذور التي تنمو لتصبح نباتات جديدة.';
  }
  if (matchKeywords(lower, ['بذرة', 'بذور', 'زراعة'])) {
    return 'البذرة تحتاج للنمو: الماء والتربة وضوء الشمس والهواء. تبدأ بالإنبات ثم تخرج الجذور ثم الساق فالأوراق.';
  }

  // الحيوانات
  if (matchKeywords(lower, ['حيوان', 'حيوانات', 'أنواع الحيوانات', 'صفات الحيوانات'])) {
    return 'الحيوانات أنواع كثيرة! بعضها له فرو مثل الأسد والقطة، وبعضها له ريش مثل الطيور، وبعضها له حراشف مثل الأسماك والزواحف.';
  }
  if (matchKeywords(lower, ['فرو', 'الفرو'])) {
    return 'الفرو هو الشعر الكثيف الذي يغطي جسم بعض الحيوانات مثل القطة والأسد والدب، ويحميها من البرد.';
  }
  if (matchKeywords(lower, ['ريش', 'الريش'])) {
    return 'الريش يغطي جسم الطيور ويساعدها على الطيران ويحافظ على دفئها.';
  }
  if (matchKeywords(lower, ['حراشف', 'الحراشف'])) {
    return 'الحراشف قشور صلبة تغطي جسم الأسماك والزواحف مثل التمساح والسمكة، وتحميها وتسهل حركتها في الماء.';
  }

  // مساكن الحيوانات
  if (matchKeywords(lower, ['مسكن', 'مساكن', 'بيئة', 'بيئات', 'أين يعيش'])) {
    return 'كل حيوان يعيش في البيئة التي تناسبه: الأسد في الغابة، والجمل في الصحراء، والسمكة في المحيط والبحر. هذا يسمى التأقلم.';
  }
  if (matchKeywords(lower, ['غابة', 'الغابة'])) {
    return 'الغابة بيئة مليئة بالأشجار والنباتات، تعيش فيها حيوانات كالأسد والقرد والفيل والطيور الملونة.';
  }
  if (matchKeywords(lower, ['صحراء', 'الصحراء'])) {
    return 'الصحراء بيئة جافة حارة، تعيش فيها حيوانات متأقلمة مثل الجمل والثعبان والضب والقنفذ الصحراوي.';
  }
  if (matchKeywords(lower, ['محيط', 'بحر', 'المحيط', 'البحر'])) {
    return 'المحيط والبحر بيئة مائية تعيش فيها الأسماك والحوت والدولفين وقناديل البحر.';
  }
  if (matchKeywords(lower, ['تأقلم', 'التأقلم'])) {
    return 'التأقلم هو قدرة الحيوان على العيش في بيئته الخاصة، مثل الجمل الذي يختزن الماء ويتحمل حرارة الصحراء.';
  }

  // الطقس
  if (matchKeywords(lower, ['طقس', 'الطقس', 'أحوال الجو', 'حالة الجو'])) {
    return 'الطقس يصف حالة الجو في مكان معين ووقت معين. قد يكون الطقس مشمساً أو ممطراً أو غائماً أو عاصفاً.';
  }
  if (matchKeywords(lower, ['مشمس', 'شمس'])) {
    return 'الطقس المشمس تظهر فيه الشمس بوضوح ويكون الجو دافئاً أو حاراً. نلبس ملابس خفيفة ونضع الواقي الشمسي.';
  }
  if (matchKeywords(lower, ['ممطر', 'مطر', 'أمطار'])) {
    return 'الطقس الممطر تسقط فيه قطرات الماء من السحب. المطر مهم لسقاية النباتات وملء الأنهار والبحيرات.';
  }
  if (matchKeywords(lower, ['غائم', 'سحاب', 'غيوم'])) {
    return 'الطقس الغائم تغطي فيه السحب السماء وتحجب الشمس. قد يعقبه مطر.';
  }
  if (matchKeywords(lower, ['ميزان حراري', 'ترمومتر', 'قياس الحرارة', 'درجة الحرارة'])) {
    return 'الميزان الحراري (الترمومتر) هو أداة تقيس درجة حرارة الجو والأشياء. نقرأ الرقم على السلم المدرّج.';
  }

  // الفصول الأربعة
  if (matchKeywords(lower, ['فصول', 'الفصول الأربعة', 'فصل'])) {
    return 'السنة تتكون من أربعة فصول: الربيع (دافئ وتتفتح الأزهار)، الصيف (حار وطويل)، الخريف (تتساقط الأوراق)، الشتاء (بارد وقد يمطر).';
  }
  if (matchKeywords(lower, ['ربيع', 'الربيع'])) {
    return 'الربيع فصل دافئ جميل تتفتح فيه الأزهار وتعود الطيور المهاجرة وتخرج الحيوانات من سباتها الشتوي.';
  }
  if (matchKeywords(lower, ['صيف', 'الصيف'])) {
    return 'الصيف هو الفصل الأكثر حرارة، تكون فيه الشمس قوية وأيامه طويلة. نذهب للبحر ونرتدي ملابس خفيفة.';
  }
  if (matchKeywords(lower, ['خريف', 'الخريف'])) {
    return 'الخريف فصل تبرد فيه الأجواء وتتساقط أوراق بعض الأشجار ويستعد الجو للبرد القادم.';
  }
  if (matchKeywords(lower, ['شتاء', 'الشتاء'])) {
    return 'الشتاء هو الفصل البارد، قد يسقط فيه المطر وأحياناً الثلج في بعض المناطق. نرتدي ملابس دافئة سميكة.';
  }

  // خصائص المواد
  if (matchKeywords(lower, ['خصائص', 'خاصية', 'وصف المواد', 'خصائص الأشياء'])) {
    return 'خصائص المواد أربع رئيسية: اللون (ما تراه العين)، الشكل (هيئة الشيء)، الحجم (صغير أو كبير)، الملمس (ناعم أو خشن أو صلب).';
  }
  if (matchKeywords(lower, ['لون', 'الألوان'])) {
    return 'اللون خاصية نراها بأعيننا. نصف الأشياء بألوانها مثل: أحمر، أزرق، أخضر، أصفر، أبيض، أسود.';
  }
  if (matchKeywords(lower, ['ملمس', 'الملمس'])) {
    return 'الملمس ما تحسه يدك عند لمس الشيء: ناعم مثل الحرير، خشن مثل الخشب، صلب مثل الحجر، طري مثل القطن.';
  }

  // المادة الصلبة
  if (matchKeywords(lower, ['صلب', 'مادة صلبة', 'الصلب', 'المواد الصلبة'])) {
    return 'المادة الصلبة لها شكل ثابت وحجم ثابت لا يتغيران حتى لو وضعتها في إناء مختلف. أمثلة: الحجر، الخشب، الكتاب، القلم.';
  }
  if (matchKeywords(lower, ['شكل ثابت', 'حجم ثابت'])) {
    return 'الشكل الثابت يعني أن الصلب يحتفظ بشكله مهما غيّرنا الإناء. والحجم الثابت يعني أن كمية المادة لا تتغير.';
  }

  // السوائل
  if (matchKeywords(lower, ['سائل', 'سوائل', 'المادة السائلة'])) {
    return 'السائل مادة تتدفق وتأخذ شكل الإناء الذي توضع فيه، لكن حجمه يبقى ثابتاً. أمثلة: الماء، العصير، الحليب، الزيت.';
  }
  if (matchKeywords(lower, ['يتدفق', 'تدفق'])) {
    return 'يتدفق يعني يسيل وينتقل من مكان لآخر. السوائل تتدفق وتملأ شكل أي إناء توضع فيه.';
  }

  // الغازات
  if (matchKeywords(lower, ['غاز', 'غازات', 'المادة الغازية'])) {
    return 'الغاز مادة ليس لها شكل أو حجم ثابت، تملأ أي مكان توضع فيه. أهم الغازات: الهواء والأكسجين.';
  }
  if (matchKeywords(lower, ['هواء', 'الهواء'])) {
    return 'الهواء خليط من الغازات يحيط بالأرض وهو غير مرئي. يحتوي على الأكسجين الذي نتنفسه. نحسه عند هب الريح.';
  }
  if (matchKeywords(lower, ['أكسجين', 'الأكسجين'])) {
    return 'الأكسجين جزء مهم من الهواء يحتاجه الإنسان والحيوان والنبات للتنفس والحياة.';
  }

  // الطاقة
  if (matchKeywords(lower, ['طاقة', 'الطاقة', 'أنواع الطاقة'])) {
    return 'الطاقة هي القدرة على القيام بالعمل وتحريك الأشياء. أنواعها: حرارية (الشمس والنار)، ضوئية (الشمس والمصباح)، وصوتية (الموسيقى والجرس).';
  }
  if (matchKeywords(lower, ['طاقة حرارية', 'الحرارية'])) {
    return 'الطاقة الحرارية هي طاقة الحرارة التي نحسها من الشمس والنار والأجسام الدافئة.';
  }
  if (matchKeywords(lower, ['طاقة ضوئية', 'الضوئية', 'ضوء'])) {
    return 'الطاقة الضوئية هي طاقة الضوء التي تجعلنا نرى، مصادرها: الشمس والمصابيح والشمعة.';
  }
  if (matchKeywords(lower, ['طاقة صوتية', 'الصوتية', 'صوت'])) {
    return 'الطاقة الصوتية هي طاقة الصوت التي نسمعها. تنتج عن اهتزاز الأشياء. أمثلة: الموسيقى، الطبل، الجرس.';
  }
  if (matchKeywords(lower, ['مصدر طاقة', 'مصادر الطاقة', 'الشمس طاقة'])) {
    return 'الشمس هي المصدر الرئيسي للطاقة على الأرض. تعطينا الضوء والحرارة. وهناك أيضاً طاقة الرياح والماء.';
  }

  // القوة والحركة
  if (matchKeywords(lower, ['قوة', 'القوة', 'دفع وسحب'])) {
    return 'القوة هي الدفع أو السحب الذي يؤثر على الأشياء ويحرّكها أو يوقفها أو يغيّر اتجاهها.';
  }
  if (matchKeywords(lower, ['دفع', 'الدفع'])) {
    return 'الدفع هو إبعاد الشيء عنك. مثال: ركل الكرة، دفع الباب، دفع العربة. الدفع الأقوى ينقل الشيء مسافة أبعد.';
  }
  if (matchKeywords(lower, ['سحب', 'السحب'])) {
    return 'السحب هو جذب الشيء نحوك. مثال: فتح الدرج، جرّ الحقيبة، سحب الباب. السحب يقرّب الأشياء إليك.';
  }
  if (matchKeywords(lower, ['حركة', 'الحركة'])) {
    return 'الحركة هي انتقال الشيء من مكان لآخر. تحدث بسبب القوة (الدفع أو السحب). القوة الأكبر تنتج حركة أسرع.';
  }

  // ===== ردود الفصل الثاني =====

  // الموقع والاتجاهات
  if (matchKeywords(lower, ['موقع', 'اتجاه', 'اتجاهات', 'فوق وتحت', 'يمين ويسار', 'أمام وخلف'])) {
    return 'لوصف موقع الأشياء نستخدم كلمات مثل: فوق / تحت / يمين / يسار / أمام / خلف / بجانب / بين. مثال: الكتاب فوق الطاولة.';
  }
  if (matchKeywords(lower, ['فوق', 'تحت'])) {
    return 'فوق تعني أعلى من شيء آخر. تحت تعني أسفل من شيء آخر. مثال: الطائر فوق الشجرة. الحذاء تحت الكرسي.';
  }
  if (matchKeywords(lower, ['يمين', 'يسار'])) {
    return 'يمين ويسار اتجاهان متعاكسان. يمين هو الجهة التي تكتب بها (للمعظم)، ويسار هو الجانب الآخر.';
  }
  if (matchKeywords(lower, ['بجانب', 'بين'])) {
    return 'بجانب تعني على جانب الشيء. بين تعني في المنتصف بين شيئين. مثال: القلم بجانب الكتاب. الولد بين أمه وأبيه.';
  }

  // الحرارة
  if (matchKeywords(lower, ['حرارة', 'الحرارة', 'ساخن وبارد', 'مصادر الحرارة'])) {
    return 'الحرارة نوع من الطاقة نحسها بأجسامنا. مصادرها: الشمس (الأهم)، النار، المدفأة. الأشياء الساخنة خطرة لا نلمسها.';
  }
  if (matchKeywords(lower, ['ساخن', 'بارد', 'دافئ'])) {
    return 'ساخن يعني درجة حرارة عالية (كالشاي والنار). بارد يعني درجة حرارة منخفضة (كالثلج والمثلجات). دافئ في المنتصف.';
  }

  // الضوء والصوت
  if (matchKeywords(lower, ['ضوء', 'مصادر الضوء', 'مصباح'])) {
    return 'الضوء طاقة تجعلنا نرى. مصادره: الشمس (طبيعي)، المصباح والشمعة (صناعي). بدون ضوء لا نرى شيئاً.';
  }
  if (matchKeywords(lower, ['صوت', 'مصادر الصوت', 'اهتزاز'])) {
    return 'الصوت ينتج عن اهتزاز الأشياء. مصادره: الطبل، الجرس، التلفاز، الكلام. الصوت ينتقل عبر الهواء والأشياء.';
  }

  // الليل والنهار
  if (matchKeywords(lower, ['ليل', 'نهار', 'الليل والنهار', 'شروق', 'غروب'])) {
    return 'الليل والنهار يتعاقبان بسبب دوران الأرض حول نفسها. الجزء المواجه للشمس = نهار. الجزء البعيد عنها = ليل.';
  }
  if (matchKeywords(lower, ['دوران الأرض', 'الأرض تدور'])) {
    return 'الأرض كرة كبيرة تدور حول نفسها مرة واحدة كل 24 ساعة (يوم كامل). هذا الدوران هو سبب الليل والنهار.';
  }
  if (matchKeywords(lower, ['شروق الشمس', 'شروق'])) {
    return 'شروق الشمس هو بداية النهار عندما يظهر ضوء الشمس في الأفق في الصباح الباكر.';
  }
  if (matchKeywords(lower, ['غروب الشمس', 'غروب'])) {
    return 'غروب الشمس هو نهاية النهار عندما تختفي الشمس في الأفق مساءً ويبدأ الليل.';
  }

  // القمر والنجوم
  if (matchKeywords(lower, ['قمر', 'القمر', 'أطوار القمر', 'هلال', 'بدر'])) {
    return 'القمر يتغير شكله خلال الشهر. يبدأ هلالاً صغيراً ثم يكبر حتى يصبح بدراً (دائرة كاملة) ثم يصغر مرة أخرى.';
  }
  if (matchKeywords(lower, ['هلال'])) {
    return 'الهلال هو عندما نرى جزءاً صغيراً مضيئاً من القمر في شكل قوس رفيع. يظهر في بداية الشهر أو نهايته.';
  }
  if (matchKeywords(lower, ['بدر'])) {
    return 'البدر هو عندما يكون القمر دائرة كاملة مضيئة في منتصف الشهر القمري.';
  }
  if (matchKeywords(lower, ['نجوم', 'النجوم', 'نجمة'])) {
    return 'النجوم في الحقيقة هي شموس بعيدة جداً عن الأرض. نراها فقط في الليل لأن ضوء الشمس يخفيها نهاراً.';
  }

  // المادة تتغير
  if (matchKeywords(lower, ['المادة تتغير', 'تغيير المادة', 'طي وقص', 'ذوبان', 'تجمد'])) {
    return 'يمكن تغيير المادة بطرق: الطي والقص (للورق والقماش)، التسخين يذيب بعض المواد (الثلج يصبح ماء)، والتبريد يجمد بعضها (الماء يصبح ثلجاً).';
  }
  if (matchKeywords(lower, ['ذوبان', 'يذوب', 'ذاب'])) {
    return 'الذوبان هو تحول الصلب إلى سائل بالتسخين. مثال: الثلج يذوب ويصبح ماء عند التسخين أو في الجو الدافئ.';
  }
  if (matchKeywords(lower, ['تجمد', 'تجميد'])) {
    return 'التجمد هو تحول السائل إلى صلب بالتبريد. مثال: الماء يتجمد ويصبح ثلجاً عند تبريده في الثلاجة أو الجو البارد جداً.';
  }

  // المخاليط
  if (matchKeywords(lower, ['مخلوط', 'مخاليط', 'خلط', 'فصل المخاليط'])) {
    return 'المخلوط ناتج خلط مادتين أو أكثر معاً. مثال: رمل وحصى. يمكن فصل بعض المخاليط بالمصفاة أو المغناطيس أو اليد.';
  }
  if (matchKeywords(lower, ['مصفاة', 'منخل', 'تصفية'])) {
    return 'المصفاة (المنخل) تُستخدم لفصل المواد ذات الأحجام المختلفة. مثال: تمرر الرمل الصغير وتحتفظ بالحصى الكبير.';
  }
  if (matchKeywords(lower, ['مغناطيس'])) {
    return 'المغناطيس يجذب المعادن الحديدية. يُستخدم لفصل المشابك المعدنية من مخلوط يحتوي على رمل أو خرز.';
  }

  // أسئلة عامة عن الموقع
  if (matchKeywords(lower, ['ما هو', 'ما هي', 'ما معنى', 'ما المقصود', 'اشرح', 'عرّف'])) {
    return 'سؤال رائع! أخبرني بالمفهوم الذي تريد معرفته وسأشرحه لك. يمكنك أن تسألني عن: المخلوقات الحية، النباتات، الحيوانات، الطقس، الفصول، المواد، الطاقة، الليل والنهار، القمر، المخاليط وغيرها!';
  }

  // تحيات
  if (matchKeywords(lower, ['مرحبا', 'مرحباً', 'هلا', 'السلام', 'صباح', 'مساء', 'أهلاً', 'أهلا', 'سلام'])) {
    return 'أهلاً وسهلاً! أنا نوات، مساعدك في العلوم والـ STEM. اسألني عن أي درس في الفصلين الأول والثاني!';
  }

  // شكر
  if (matchKeywords(lower, ['شكراً', 'شكرا', 'ممتاز', 'رائع', 'أحسنت'])) {
    return 'العفو! يسعدني مساعدتك. هل لديك أي سؤال آخر عن دروسنا؟';
  }

  // STEM
  if (matchKeywords(lower, ['stem', 'ستيم', 'علوم وتقنية', 'هندسة ورياضيات'])) {
    return 'STEM اختصار لـ: العلوم (Science) والتقنية (Technology) والهندسة (Engineering) والرياضيات (Mathematics). نتعلمها معاً بطريقة ممتعة وتطبيقية!';
  }

  // لا توجد استجابة محددة
  return 'سؤال ممتاز! لم أجد معلومة محددة عن هذا الموضوع. حاول أن تسألني بكلمات أخرى، أو اسألني عن: النباتات، الحيوانات، الطقس، الفصول، المواد (صلب/سائل/غاز)، الطاقة، الليل والنهار، القمر والنجوم، أو المخاليط.';
}

function matchKeywords(text, keywords) {
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

function addMessage(text, from) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${from}`;
  msgDiv.innerHTML = `
    <div class="message-bubble">${escapeHtml(text)}</div>
    <div class="message-time">${time}</div>
  `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

// ============================================================
// ===== أدوات مساعدة =====
// ============================================================

function findLessonById(lessonId) {
  if (window.nawatData && nawatData.grades) {
    for (const grade of nawatData.grades) {
      for (const unit of (grade.units || [])) {
        for (const lesson of (unit.lessons || [])) {
          if (lesson.id === lessonId) return { lesson, unit, grade };
        }
      }
    }
  }

  if (window.grade2Data && grade2Data.grades) {
    for (const grade of grade2Data.grades) {
      for (const unit of (grade.units || [])) {
        for (const lesson of (unit.lessons || [])) {
          if (lesson.id === lessonId) return { lesson, unit, grade };
        }
      }
    }
  }

  if (window.grade3Data && grade3Data.grades) {
    for (const grade of grade3Data.grades) {
      for (const unit of (grade.units || [])) {
        for (const lesson of (unit.lessons || [])) {
          if (lesson.id === lessonId) return { lesson, unit, grade };
        }
      }
    }
  }

  if (window.grade4Data && grade4Data.grades) {
    for (const grade of grade4Data.grades) {
      for (const unit of (grade.units || [])) {
        for (const lesson of (unit.lessons || [])) {
          if (lesson.id === lessonId) return { lesson, unit, grade };
        }
      }
    }
  }

  if (window.grade5Data && grade5Data.grades) {
    for (const grade of grade5Data.grades) {
      for (const unit of (grade.units || [])) {
        for (const lesson of (unit.lessons || [])) {
          if (lesson.id === lessonId) return { lesson, unit, grade };
        }
      }
    }
  }

  if (window.grade6Data && grade6Data.grades) {
    for (const grade of grade6Data.grades) {
      for (const unit of (grade.units || [])) {
        for (const lesson of (unit.lessons || [])) {
          if (lesson.id === lessonId) return { lesson, unit, grade };
        }
      }
    }
  }

  if (window.semester2Data && semester2Data.grades && semester2Data.lessons) {
    const sem2Grade = semester2Data.grades.find(g => g.id === 'grade1-s2' || g.id === 'grade1') || semester2Data.grades[0];
    for (const unit of (sem2Grade.units || [])) {
      for (const lid of (unit.lessons || [])) {
        const lesson = semester2Data.lessons.find(l => l.id === lid);
        if (lesson && lesson.id === lessonId) {
          const normalizedUnit = {
            id: unit.id,
            number: unit.number || null,
            name: unit.title || unit.name,
            icon: unit.icon || '📗',
            color: unit.color || '#4CAF50',
            lessons: (unit.lessons || []).map(id => semester2Data.lessons.find(l => l.id === id)).filter(Boolean)
          };
          return { lesson, unit: normalizedUnit, grade: sem2Grade };
        }
      }
    }
  }
  return { lesson: null, unit: null, grade: null };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
