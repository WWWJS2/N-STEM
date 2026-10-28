// علوم الصف الخامس - فصل محتوى الفصلين الدراسيين دون تكرار الوحدات.
// بيانات الدروس العلمية وأنشطة STEM وأوراق العمل تأتي من data-grade5.js.
(function separateGrade5Semesters() {
  'use strict';
  const ROOT = window.grade5Data;
  const VERSION = 'grade5-separated-semesters-1448-v2';
  if (!ROOT || ROOT.__semesterSeparation === VERSION) return;
  const grade = (ROOT.grades || []).find(g => g.id === 'grade5');
  if (!grade) return;

  // حذف النسخ المكررة السابقة (g5-s2-*)، والاحتفاظ بالدروس الأصلية فقط.
  const originals = (grade.units || []).filter(u => /^g5-unit[1-6]$/.test(u.id));
  if (originals.length !== 6 ||
      originals.some(u => !Array.isArray(u.lessons) || u.lessons.length !== 4)) {
    console.warn('Grade 5: Unexpected textbook structure; semester separation was not changed.');
    return;
  }

  originals.forEach((unit, index) => {
    const semester = index < 3 ? 1 : 2;
    unit.semester = semester;
    (unit.lessons || []).forEach(lesson => {
      lesson.semester = semester;
      lesson.sourcePart = semester === 1 ? 'الجزء الأول' : 'الجزء الثاني';
    });
  });

  // الفصل الأول: الوحدات 1-3؛ الفصل الثاني: الوحدات 4-6.
  // لا ننسخ الوحدات 1-3 إلى الفصل الثاني.
  grade.units = originals;
  const first = originals.filter(u => u.semester === 1);
  const second = originals.filter(u => u.semester === 2);
  const countLessons = units => units.reduce((n,u)=>n+(u.lessons||[]).length,0);
  ROOT.availableSemesters = [1, 2];
  ROOT.semester1Curriculum = {
    source: 'العلوم - الصف الخامس - الجزء الأول من المقرر - طبعة 1448-2026',
    units: first.length, lessons: countLessons(first)
  };
  ROOT.semester2Curriculum = {
    source: 'العلوم - الصف الخامس - الجزء الثاني من المقرر - طبعة 1448-2026',
    units: second.length, lessons: countLessons(second)
  };
  ROOT.__semesterSeparation = VERSION;
})();
