// grade5-semester2.js
// علوم الصف الخامس الابتدائي - الفصل الدراسي الثاني
// طبعة 1448-2026: الجزء الأول (الوحدات 1-3) والجزء الثاني (الوحدات 4-6).
// يضيف محتوى الفصل الثاني مستقلاً دون تعديل دروس الفصل الأول.
(function attachGrade5Semester2() {
  'use strict';
  const ROOT = window.grade5Data;
  const VERSION = 'grade5-semester2-both-parts-1448-20261028';
  if (!ROOT || ROOT.__semester2BothBooks === VERSION) return;

  const grade = (ROOT.grades || []).find(g => g.id === 'grade5');
  if (!grade) return;

  // البيانات الأصلية: 6 وحدات، 4 دروس لكل وحدة، تشمل أنشطة STEM
  // والتقويم والألعاب وأربع أوراق عمل لكل درس.
  const originals = (grade.units || []).filter(u => /^g5-unit[1-6]$/.test(u.id));
  if (originals.length !== 6 ||
      originals.some(u => !Array.isArray(u.lessons) || u.lessons.length !== 4)) {
    console.warn('Grade 5 semester 2: curriculum structure was changed; keeping original data unchanged.');
    return;
  }

  // يحتفظ الفصل الأول بالوحدات 1-3 كما كانت؛ وتبقى الوحدات 4-6
  // مسجلة ضمن الفصل الثاني في بيانات الصف الخامس الأصلية.
  const firstPartClones = originals.slice(0, 3).map((unit, ui) => {
    const copy = JSON.parse(JSON.stringify(unit));
    copy.id = 'g5-s2-unit' + (ui + 1);
    copy.semester = 2;
    copy.semesterSource = 'الصف الخامس - الفصل الدراسي الثاني - الجزء الأول من المقرر - طبعة 1448-2026';
    copy.lessons = (copy.lessons || []).map((lesson, li) => {
      lesson.id = 'g5-s2-u' + (ui + 1) + '-l' + (li + 1);
      lesson.semester = 2;
      lesson.sourcePart = 'الجزء الأول';
      lesson.semesterSource = 'الفصل الدراسي الثاني - كتاب العلوم 1448-2026';
      return lesson;
    });
    return copy;
  });

  // يُحافظ هذا الترتيب على ترتيب الكتاب، وعلى فصل البيانات بين التبويبين.
  const arranged = [];
  originals.forEach((unit, index) => {
    arranged.push(unit);
    if (index < 3) arranged.push(firstPartClones[index]);
  });
  grade.units = arranged;

  const semester2Units = arranged.filter(u => Number(u.semester) === 2);
  const semester2LessonCount = semester2Units.reduce(
    (count, unit) => count + (unit.lessons || []).filter(l => Number(l.semester) === 2).length, 0
  );

  ROOT.availableSemesters = [1, 2];
  ROOT.semester2Curriculum = {
    source: 'العلوم - الصف الخامس الابتدائي، الجزء الأول والجزء الثاني من المقرر - طبعة 1448-2026',
    semester: 2,
    units: semester2Units.length,
    chapters: 12,
    lessons: semester2LessonCount,
    part1Lessons: 12,
    part2Lessons: 12,
    textbookPart1: 'تنوع الحياة، الأنظمة البيئية، الأرض ومواردها',
    textbookPart2: 'الطقس، المادة، القوى والطاقة'
  };
  ROOT.__semester2BothBooks = VERSION;
})();
