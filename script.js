(function () {
  const appData = window.NAWAT_GRADE1_DATA;

  const unitsGrid = document.getElementById("unitsGrid");
  const lessonNav = document.getElementById("lessonNav");
  const lessonView = document.getElementById("lessonView");
  const lessonSearch = document.getElementById("lessonSearch");
  const activeUnitTitle = document.getElementById("activeUnitTitle");
  const activeUnitMeta = document.getElementById("activeUnitMeta");
  const lessonBreadcrumb = document.getElementById("lessonBreadcrumb");
  const lessonToolbarTitle = document.getElementById("lessonToolbarTitle");
  const bookCount = document.getElementById("bookCount");
  const unitCount = document.getElementById("unitCount");
  const lessonCount = document.getElementById("lessonCount");
  const prevLessonButton = document.getElementById("prevLessonButton");
  const nextLessonButton = document.getElementById("nextLessonButton");
  const printButtons = [
    document.getElementById("toolbarPrintButton"),
    document.getElementById("heroPrintButton"),
    document.getElementById("printHeaderButton")
  ];
  const jumpToLessonButton = document.getElementById("jumpToLessonButton");

  const storageKeys = {
    unit: "nawat-grade1-unit",
    lesson: "nawat-grade1-lesson"
  };

  const unitDecor = [
    { icon: "🌿", accent: "#67c26f" },
    { icon: "🦁", accent: "#f3a033" },
    { icon: "🌥️", accent: "#4c9aff" },
    { icon: "🏞️", accent: "#35b6a8" },
    { icon: "🌦️", accent: "#6ba6ff" },
    { icon: "🧱", accent: "#f08f53" },
    { icon: "🧪", accent: "#14b8a6" },
    { icon: "📍", accent: "#8b74ff" },
    { icon: "💡", accent: "#f59e0b" }
  ];

  const toolIcons = ["🧪", "📝", "🌱", "🔎", "💧", "📷", "🧩", "📦"];

  const units = [];
  const lessons = [];

  appData.books.forEach((book, bookIndex) => {
    book.units.forEach((unit, unitIndex) => {
      const decor = unitDecor[units.length % unitDecor.length];

      const normalizedUnit = {
        ...unit,
        bookId: book.id,
        bookTitle: book.title,
        bookSubtitle: book.subtitle,
        decor,
        order: units.length + 1
      };

      normalizedUnit.lessons = unit.lessons.map((lesson, lessonIndex) => {
        const normalizedLesson = {
          ...lesson,
          bookId: book.id,
          bookTitle: book.title,
          bookSubtitle: book.subtitle,
          bookIndex,
          unitId: unit.id,
          unitTitle: unit.title,
          unitIndex,
          lessonIndex,
          order: lessons.length + 1,
          decor
        };

        lessons.push(normalizedLesson);
        return normalizedLesson;
      });

      units.push(normalizedUnit);
    });
  });

  let activeUnitId =
    localStorage.getItem(storageKeys.unit) ||
    units[0].id;

  let activeLessonId =
    localStorage.getItem(storageKeys.lesson) ||
    units[0].lessons[0].id;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getActiveUnit() {
    return units.find((unit) => unit.id === activeUnitId) || units[0];
  }

  function getActiveLesson() {
    return lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0];
  }

  function syncActiveUnitFromLesson() {
    const lesson = getActiveLesson();
    activeUnitId = lesson.unitId;
  }

  function saveState() {
    localStorage.setItem(storageKeys.unit, activeUnitId);
    localStorage.setItem(storageKeys.lesson, activeLessonId);
  }

  function listMarkup(items, tagName = "ul") {
    return `<${tagName}>${items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</${tagName}>`;
  }

  function conceptMarkup(items) {
    return `<div class="concept-grid">${items
      .map(
        (item) => `
          <article class="concept-card">
            <strong>${escapeHtml(item.term)}</strong>
            <p>${escapeHtml(item.description)}</p>
          </article>
        `
      )
      .join("")}</div>`;
  }

  function stemMarkup(stem) {
    const entries = [
      ["العلوم Science", stem.science],
      ["التقنية Technology", stem.technology],
      ["الهندسة Engineering", stem.engineering],
      ["الرياضيات Mathematics", stem.mathematics]
    ];

    return `<div class="stem-grid">${entries
      .map(
        ([title, body]) => `
          <article class="stem-panel">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(body)}</p>
          </article>
        `
      )
      .join("")}</div>`;
  }

  function toolsMarkup(items) {
    return `<div class="tools-grid">${items
      .map(
        (item, index) => `
          <article class="tool-item">
            <div class="tool-thumb">${toolIcons[index % toolIcons.length]}</div>
            <span>${escapeHtml(item)}</span>
          </article>
        `
      )
      .join("")}</div>`;
  }

  function rubricMarkup(rows) {
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

  function sectionMarkup(label, content) {
    return `
      <section class="two-col">
        <div class="label-box">${label}</div>
        <div class="content-box">${content}</div>
      </section>
    `;
  }

  function topStripMarkup(lesson) {
    return `
      <div class="top-strip">
        <div class="cap"></div>
        <div class="title-bar">
          <span>${escapeHtml(lesson.unitTitle)}</span>
          <span class="title-badge">${escapeHtml(lesson.bookTitle)}</span>
        </div>
        <div class="cap"></div>
      </div>
    `;
  }

  function renderStats() {
    bookCount.textContent = String(appData.books.length);
    unitCount.textContent = String(units.length);
    lessonCount.textContent = String(lessons.length);
  }

  function renderUnits() {
    unitsGrid.innerHTML = units
      .map((unit) => {
        const isActive = unit.id === activeUnitId;
        return `
          <article
            class="unit-card ${isActive ? "active" : ""}"
            data-unit-id="${unit.id}"
            style="--unit-accent: ${unit.decor.accent}"
          >
            <div class="unit-badge">
              <span>الوحدة ${unit.order}</span>
            </div>
            <div class="unit-icon">${unit.decor.icon}</div>
            <h3>${escapeHtml(unit.title)}</h3>
            <p>${escapeHtml(unit.bookTitle)} • ${unit.lessons.length} درس</p>
          </article>
        `;
      })
      .join("");

    unitsGrid.querySelectorAll("[data-unit-id]").forEach((card) => {
      card.addEventListener("click", () => {
        activeUnitId = card.dataset.unitId;
        const unit = getActiveUnit();
        activeLessonId = unit.lessons[0].id;
        saveState();
        renderUnits();
        renderLessonNav();
        renderLesson();
      });
    });
  }

  function renderLessonNav() {
    const searchValue = lessonSearch.value.trim().toLowerCase();
    const unit = getActiveUnit();
    const filteredLessons = unit.lessons.filter((lesson) => {
      if (!searchValue) {
        return true;
      }

      const haystack = `${lesson.title} ${lesson.unitTitle} ${lesson.bookTitle} ${lesson.summary}`.toLowerCase();
      return haystack.includes(searchValue);
    });

    activeUnitTitle.textContent = unit.title;
    activeUnitMeta.textContent = `${unit.bookTitle} • ${unit.lessons.length} درس • ${unit.bookSubtitle}`;

    if (!filteredLessons.length) {
      lessonNav.innerHTML = `<div class="empty-state">لا توجد دروس مطابقة داخل هذه الوحدة. جرّب كلمة بحث أخرى.</div>`;
      return;
    }

    lessonNav.innerHTML = filteredLessons
      .map((lesson) => {
        const isActive = lesson.id === activeLessonId;
        return `
          <button
            class="lesson-button ${isActive ? "active" : ""}"
            type="button"
            data-lesson-id="${lesson.id}"
          >
            <small>الدرس ${lesson.lessonIndex + 1} من ${unit.lessons.length}</small>
            <strong>${escapeHtml(lesson.title)}</strong>
            <div class="lesson-chip-row">
              <span class="lesson-chip">${escapeHtml(lesson.duration)}</span>
              <span class="lesson-chip">${escapeHtml(lesson.sessions)}</span>
            </div>
          </button>
        `;
      })
      .join("");

    lessonNav.querySelectorAll("[data-lesson-id]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLessonId = button.dataset.lessonId;
        syncActiveUnitFromLesson();
        saveState();
        renderUnits();
        renderLessonNav();
        renderLesson();
      });
    });
  }

  function renderLesson() {
    const lesson = getActiveLesson();
    const lessonPosition = lessons.findIndex((item) => item.id === lesson.id);
    const previousLesson = lessons[lessonPosition - 1] || null;
    const nextLesson = lessons[lessonPosition + 1] || null;

    lessonBreadcrumb.textContent = `${lesson.bookTitle} / ${lesson.unitTitle}`;
    lessonToolbarTitle.textContent = lesson.title;

    prevLessonButton.disabled = !previousLesson;
    nextLessonButton.disabled = !nextLesson;

    lessonView.innerHTML = `
      <article class="sheet">
        <div class="sheet-inner">
          ${topStripMarkup(lesson)}

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
              <strong>تنبيه مهم</strong>
              <p>عناوين الوحدات والدروس مستندة إلى المصدر المرفوع.</p>
              <p>أما الأهداف والأنشطة والتقويم فهي صياغة تعليمية مناسبة للصف الأول.</p>
            </article>
          </div>

          ${sectionMarkup("الوسائل<br>التعليمية", `<p>${escapeHtml(lesson.resources)}</p>`)}
          ${sectionMarkup("الأهداف<br>التعليمية", listMarkup(lesson.objectives))}
          ${sectionMarkup("المفردات", conceptMarkup(lesson.vocabulary))}
          ${sectionMarkup("الأفكار<br>الرئيسة", listMarkup(lesson.keyIdeas))}
          ${sectionMarkup("تكامل STEM", stemMarkup(lesson.stem))}
          ${sectionMarkup("التمهيد", `<p>${escapeHtml(lesson.introduction)}</p>`)}

          <div class="page-number">1</div>
        </div>
      </article>

      <article class="sheet">
        <div class="sheet-inner">
          ${topStripMarkup(lesson)}
          ${sectionMarkup("خطوات<br>شرح الدرس", listMarkup(lesson.lessonSteps, "ol"))}
          ${sectionMarkup(
            "النشاط<br>العملي",
            `<p><strong>اسم النشاط:</strong> ${escapeHtml(lesson.practicalActivity.name)}</p>
             <p><strong>وصف النشاط:</strong> ${escapeHtml(lesson.practicalActivity.description)}</p>`
          )}
          ${sectionMarkup("الأدوات", toolsMarkup(lesson.tools))}
          ${sectionMarkup("خطوات<br>النشاط", listMarkup(lesson.activitySteps, "ol"))}
          ${sectionMarkup("أسئلة<br>التقويم", listMarkup(lesson.assessmentQuestions))}

          <div class="page-number">2</div>
        </div>
      </article>

      <article class="sheet">
        <div class="sheet-inner">
          ${topStripMarkup(lesson)}
          ${sectionMarkup(
            "ورقة عمل<br>قابلة للطباعة",
            `<div class="worksheet-box">
              <h3>${escapeHtml(lesson.worksheet.title)}</h3>
              <p>${escapeHtml(lesson.worksheet.instructions)}</p>
              <p>${escapeHtml(lesson.worksheet.task)}</p>
            </div>`
          )}
          ${sectionMarkup("سلم<br>التقدير", rubricMarkup(lesson.rubric))}
          ${sectionMarkup("ملاحظات<br>للمعلم", listMarkup(lesson.teacherNotes))}

          <div class="lesson-footer">
            <p class="breadcrumb">الدرس ${lessonPosition + 1} من ${lessons.length} في موقع نوات STEM للصف الأول.</p>
            <p class="breadcrumb">${escapeHtml(lesson.bookSubtitle)}</p>
          </div>

          <div class="page-number">3</div>
        </div>
      </article>
    `;
  }

  prevLessonButton.addEventListener("click", () => {
    const currentIndex = lessons.findIndex((lesson) => lesson.id === activeLessonId);
    const previousLesson = lessons[currentIndex - 1];

    if (!previousLesson) {
      return;
    }

    activeLessonId = previousLesson.id;
    syncActiveUnitFromLesson();
    saveState();
    renderUnits();
    renderLessonNav();
    renderLesson();
  });

  nextLessonButton.addEventListener("click", () => {
    const currentIndex = lessons.findIndex((lesson) => lesson.id === activeLessonId);
    const nextLesson = lessons[currentIndex + 1];

    if (!nextLesson) {
      return;
    }

    activeLessonId = nextLesson.id;
    syncActiveUnitFromLesson();
    saveState();
    renderUnits();
    renderLessonNav();
    renderLesson();
  });

  lessonSearch.addEventListener("input", renderLessonNav);

  printButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.print();
    });
  });

  jumpToLessonButton.addEventListener("click", () => {
    document.getElementById("lessonsSection").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  syncActiveUnitFromLesson();
  saveState();
  renderStats();
  renderUnits();
  renderLessonNav();
  renderLesson();
})();
