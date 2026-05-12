// منطق العرض: يولد قائمة الوحدات والدروس، ثم يعرض الدرس الحالي داخل القالب المعتمد.

(function () {
  const appData = window.NAWAT_GRADE1_DATA;
  const lessonNav = document.getElementById("lessonNav");
  const lessonView = document.getElementById("lessonView");
  const overviewPanel = document.getElementById("overviewPanel");
  const searchInput = document.getElementById("lessonSearch");
  const printButton = document.getElementById("printButton");
  const overviewButton = document.getElementById("overviewButton");
  const unitCount = document.getElementById("unitCount");
  const lessonCount = document.getElementById("lessonCount");
  const storageKey = "nawat-grade1-active-lesson";

  const flattenedLessons = [];
  appData.books.forEach((book) => {
    book.units.forEach((unit) => {
      unit.lessons.forEach((lesson, lessonIndex) => {
        flattenedLessons.push({
          ...lesson,
          bookTitle: book.title,
          bookSubtitle: book.subtitle,
          unitTitle: unit.title,
          unitId: unit.id,
          lessonNumber: lessonIndex + 1
        });
      });
    });
  });

  let activeLessonId = localStorage.getItem(storageKey) || flattenedLessons[0].id;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function listItems(items) {
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function conceptCards(items) {
    return items
      .map(
        (item) => `
          <article class="concept-card">
            <strong>${escapeHtml(item.term)}</strong>
            <p>${escapeHtml(item.description)}</p>
          </article>
        `
      )
      .join("");
  }

  function stemCards(stem) {
    return [
      ["العلوم Science", stem.science],
      ["التقنية Technology", stem.technology],
      ["الهندسة Engineering", stem.engineering],
      ["الرياضيات Mathematics", stem.mathematics]
    ]
      .map(
        ([title, description]) => `
          <article class="stem-panel">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
          </article>
        `
      )
      .join("");
  }

  function toolCards(items) {
    const icons = ["🧪", "📝", "🌱", "🔎", "💧", "📷", "🧩", "📦"];
    return items
      .map(
        (item, index) => `
          <article class="tool-card">
            <div class="tool-thumb">${icons[index % icons.length]}</div>
            <span>${escapeHtml(item)}</span>
          </article>
        `
      )
      .join("");
  }

  function rubricTable(rows) {
    return `
      <table class="rubric">
        <thead>
          <tr>
            <th>المعيار</th>
            <th>متميز</th>
            <th>جيد</th>
            <th>بحاجة إلى دعم</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row[0])}</td>
                  <td>${escapeHtml(row[1])}</td>
                  <td>${escapeHtml(row[2])}</td>
                  <td>${escapeHtml(row[3])}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  function section(label, content) {
    return `
      <section class="lesson-section">
        <div class="section-label">${label}</div>
        <div class="section-card">${content}</div>
      </section>
    `;
  }

  function renderOverview() {
    const units = appData.books.flatMap((book) => book.units);
    unitCount.textContent = String(units.length);
    lessonCount.textContent = String(flattenedLessons.length);

    overviewPanel.innerHTML = `
      <article class="overview-card">
        <h3>ماذا يوجد في الموقع؟</h3>
        <p>كل درس يعرض بالقالب المعتمد نفسه، مع أقسام موحدة تساعد المعلم على المراجعة والطباعة والتنفيذ السريع.</p>
      </article>
      <article class="overview-card">
        <h3>أجزاء الموقع</h3>
        ${listItems([
          "الجزء الأول: النباتات والحيوانات وأماكن العيش",
          "الجزء الثاني: الطقس والمواد والحركة والطاقة",
          "طباعة الدرس الحالي فقط بصورة منظمة"
        ])}
      </article>
      <article class="overview-card">
        <h3>تنبيه تربوي</h3>
        <p>عناوين الوحدات والدروس مستندة إلى الكتب المرفوعة، أما الأهداف والأنشطة وأسئلة التقويم فهي صياغة تعليمية مقترحة لتجهيز الموقع كاملًا بصورة عملية.</p>
      </article>
    `;
  }

  function renderNav(filterValue = "") {
    const query = filterValue.trim().toLowerCase();

    lessonNav.innerHTML = appData.books
      .map((book) => {
        const unitMarkup = book.units
          .map((unit) => {
            const lessons = unit.lessons.filter((lesson) => {
              const haystack = `${lesson.title} ${unit.title} ${book.title}`.toLowerCase();
              return haystack.includes(query);
            });

            if (!lessons.length) {
              return "";
            }

            return `
              <section class="unit-card">
                <div class="unit-header">
                  <div class="unit-kicker">${escapeHtml(book.title)}</div>
                  <h2 class="unit-title">${escapeHtml(unit.title)}</h2>
                  <div class="unit-meta">${lessons.length} درس</div>
                </div>
                <div class="lesson-links">
                  ${lessons
                    .map(
                      (lesson) => `
                        <button
                          class="lesson-link ${lesson.id === activeLessonId ? "active" : ""}"
                          type="button"
                          data-lesson-id="${lesson.id}"
                        >
                          <small>${escapeHtml(unit.title)}</small>
                          ${escapeHtml(lesson.title)}
                        </button>
                      `
                    )
                    .join("")}
                </div>
              </section>
            `;
          })
          .join("");

        return unitMarkup;
      })
      .join("");

    if (!lessonNav.innerHTML.trim()) {
      lessonNav.innerHTML = `<div class="empty-state">لا توجد نتائج مطابقة للبحث الحالي.</div>`;
    }

    lessonNav.querySelectorAll("[data-lesson-id]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLessonId = button.dataset.lessonId;
        localStorage.setItem(storageKey, activeLessonId);
        renderNav(searchInput.value);
        renderLesson();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function renderLesson() {
    const lessonIndex = flattenedLessons.findIndex((lesson) => lesson.id === activeLessonId);
    const lesson = flattenedLessons[lessonIndex] || flattenedLessons[0];
    const previousLesson = flattenedLessons[lessonIndex - 1];
    const nextLesson = flattenedLessons[lessonIndex + 1];

    lessonView.innerHTML = `
      <div class="sheet-inner">
        <div class="top-strip">
          <div class="cap"></div>
          <div class="title-bar">
            <span>${escapeHtml(lesson.unitTitle)}</span>
            <span class="title-badge">${escapeHtml(lesson.bookTitle)}</span>
          </div>
          <div class="cap"></div>
        </div>

        <header class="hero-block">
          <h2>${escapeHtml(lesson.title)}</h2>
          <p>${escapeHtml(lesson.summary)}</p>
        </header>

        <div class="inline-meta">
          <article class="info-box">
            <strong>بيانات الدرس</strong>
            <p>الوحدة: ${escapeHtml(lesson.unitTitle)}</p>
            <p>المدة: ${escapeHtml(lesson.duration)}</p>
            <p>عدد الجلسات: ${escapeHtml(lesson.sessions)}</p>
          </article>
          <article class="info-box">
            <strong>مصادر التعلم</strong>
            <p>${escapeHtml(lesson.resources)}</p>
          </article>
          <article class="info-box">
            <strong>ملاحظة المصدر</strong>
            <p class="source-note">عنوان الدرس مؤكد من الكتاب، والمحتوى داخل الأقسام صياغة مناسبة للصف الأول.</p>
          </article>
        </div>

        ${section("الوسائل التعليمية", `<p>${escapeHtml(lesson.resources)}</p>`)}
        ${section("أهداف التعلّم", listItems(lesson.objectives))}
        ${section("المفردات", `<div class="concept-grid">${conceptCards(lesson.vocabulary)}</div>`)}
        ${section("الأفكار الرئيسة", listItems(lesson.keyIdeas))}
        ${section("تكامل STEM", `<div class="stem-grid">${stemCards(lesson.stem)}</div>`)}
        ${section("التمهيد", `<p>${escapeHtml(lesson.introduction)}</p>`)}
        ${section("خطوات شرح الدرس", `<ol>${lesson.lessonSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`)}
        ${section(
          "النشاط العملي",
          `<p><strong>اسم النشاط:</strong> ${escapeHtml(lesson.practicalActivity.name)}</p><p><strong>وصف النشاط:</strong> ${escapeHtml(lesson.practicalActivity.description)}</p>`
        )}
        ${section("الأدوات", `<div class="tools-grid">${toolCards(lesson.tools)}</div>`)}
        ${section("خطوات النشاط", `<ol>${lesson.activitySteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`)}
        ${section("أسئلة التقويم", listItems(lesson.assessmentQuestions))}
        ${section(
          "ورقة عمل قابلة للطباعة",
          `<div class="worksheet-box"><h3>${escapeHtml(lesson.worksheet.title)}</h3><p>${escapeHtml(lesson.worksheet.instructions)}</p><p>${escapeHtml(lesson.worksheet.task)}</p></div>`
        )}
        ${section("سلم التقدير", rubricTable(lesson.rubric))}
        ${section("ملاحظات للمعلم", listItems(lesson.teacherNotes))}

        <div class="lesson-footer">
          <p class="source-note">الدرس ${lessonIndex + 1} من ${flattenedLessons.length} في الموقع الكامل للصف الأول.</p>
          <div class="lesson-nav-actions no-print">
            <button class="button button-secondary" type="button" ${!previousLesson ? "disabled" : ""} id="prevLessonButton">الدرس السابق</button>
            <button class="button button-secondary" type="button" ${!nextLesson ? "disabled" : ""} id="nextLessonButton">الدرس التالي</button>
          </div>
        </div>

        <div class="page-number">${lessonIndex + 1}</div>
      </div>
    `;

    const prevButton = document.getElementById("prevLessonButton");
    const nextButton = document.getElementById("nextLessonButton");

    if (prevButton && previousLesson) {
      prevButton.addEventListener("click", () => {
        activeLessonId = previousLesson.id;
        localStorage.setItem(storageKey, activeLessonId);
        renderNav(searchInput.value);
        renderLesson();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (nextButton && nextLesson) {
      nextButton.addEventListener("click", () => {
        activeLessonId = nextLesson.id;
        localStorage.setItem(storageKey, activeLessonId);
        renderNav(searchInput.value);
        renderLesson();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  searchInput.addEventListener("input", () => renderNav(searchInput.value));
  printButton.addEventListener("click", () => window.print());
  overviewButton.addEventListener("click", () => {
    overviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  renderOverview();
  renderNav();
  renderLesson();
})();
