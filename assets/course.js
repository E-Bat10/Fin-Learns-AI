/* Fin Course Engine v1.3 — quizzes, progress, notes, parent PIN gate, biweekly interest check, robust Copy button */
(() => {
  // ---------- Helpers ----------
  const QS = (s, r=document) => r.querySelector(s);
  const QSA = (s, r=document) => Array.from(r.querySelectorAll(s));

  const PROG_KEY = "fin_course_progress_v1";
  const NOTES_PREFIX = "fin_notes_";
  const INTERESTS_KEY = "fin_interest_queue_v1";
  const INTERESTS_LAST = "fin_last_interest_check";
  const DAYS = 24*60*60*1000;

  function loadProg(){ try{return JSON.parse(localStorage.getItem(PROG_KEY)||"{}");}catch{ return {}; } }
  function saveProg(p){ localStorage.setItem(PROG_KEY, JSON.stringify(p)); }

  // ---------- Progress ----------
  window.markComplete = (lessonId) => {
    const p = loadProg();
    p[lessonId] = { completed: true, ts: new Date().toISOString() };
    saveProg(p);

    const btn = QS("#completeBtn");
    if(btn){ btn.textContent = "Completed ✔"; btn.disabled = true; btn.classList.add("success"); }
    const badge = QS("#statusBadge");
    if(badge){ badge.textContent = "Completed"; badge.classList.add("ok"); }
  };

  // ---------- Quizzes ----------
  function scoreQuiz(box){
    const questions = QSA(".q", box);
    let total = questions.length, correct = 0;

    questions.forEach((q) => {
      const answers = (q.getAttribute("data-answer") || "")
        .split("|")
        .map(s => s.trim().toLowerCase());

      const el = QS("input[type=radio]:checked, select, input[type=text]", q);
      let ok = false;

      if(el){
        if(el.tagName === "SELECT"){
          ok = answers.includes(el.value.toLowerCase());
        } else if(el.type === "text"){
          ok = answers.includes(el.value.trim().toLowerCase());
        } else {
          ok = answers.includes(el.value.toLowerCase());
        }
      }

      q.style.borderLeft = ok ? "4px solid #2d7" : "4px solid #c55";
      if(ok) correct++;
    });

    const res = QS(".result", box);
    if(res){
      res.textContent = `Score: ${correct}/${total}` + (correct===total ? " — Nice! ✅" : " — Keep at it 💪");
    }

    const lid = box.getAttribute("data-lesson");
    if(lid && correct===total){ markComplete(lid); }
  }

  QSA(".quiz").forEach((box)=>{
    const btn = document.createElement("button");
    btn.className = "btn primary";
    btn.textContent = "Check my work";
    btn.addEventListener("click", ()=> scoreQuiz(box));
    box.appendChild(btn);

    const res = document.createElement("div");
    res.className = "result";
    box.appendChild(res);
  });

  // ---------- Notes (autosave per lesson) ----------
  const lid = document.body.getAttribute("data-lesson-id");
  const notesBox = QS("#notes");
  if(lid && notesBox){
    const key = NOTES_PREFIX + lid;
    notesBox.value = localStorage.getItem(key) || "";
    let t = null;
    notesBox.addEventListener("input", ()=>{
      clearTimeout(t);
      t = setTimeout(()=> localStorage.setItem(key, notesBox.value), 300);
    });
  }

  // ---------- Parent PIN gate ----------
  // Parent PIN provided by you: bnldmB69!
  window.parentUnlock = (expectedPin, revealId) => {
    const input = prompt("Parent PIN required:");
    if(input === expectedPin){
      const gate = QS("#gate"); if(gate) gate.classList.add("hidden");
      if(revealId){ const nxt = QS("#"+revealId); if(nxt) nxt.classList.remove("hidden"); }
      alert("Unlocked. Great work!");
      return true;
    } else {
      alert("Incorrect PIN.");
      return false;
    }
  };

  // ---------- Biweekly interest check ----------
  function maybeInterestCheck(){
    const now = Date.now();
    const last = parseInt(localStorage.getItem(INTERESTS_LAST)||"0", 10);
    if(!last || (now - last) > 14*DAYS){
      const banner = QS("#interestBanner");
      if(banner) banner.classList.remove("hidden");
    }
  }

  const addBtn = QS("#interestAddBtn");
  if(addBtn){
    addBtn.addEventListener("click", ()=>{
      const newInt = prompt("New topics you want to add?");
      const review = prompt("Anything you want to revisit or didn’t fully get?");
      const payload = { ts: new Date().toISOString(), add: newInt||"", review: review||"" };
      const list = JSON.parse(localStorage.getItem(INTERESTS_KEY)||"[]");
      list.push(payload);
      localStorage.setItem(INTERESTS_KEY, JSON.stringify(list));
      localStorage.setItem(INTERESTS_LAST, Date.now().toString());
      alert("Got it. We’ll weave those into upcoming lessons.");
      const banner = QS("#interestBanner"); if(banner) banner.classList.add("hidden");
    });
  }
  if(QS("#interestBanner")) maybeInterestCheck();

  // ---------- Robust Copy buttons (with fallbacks) ----------
  function selectElementContents(el){
    // For textarea/input, use .select(); for others, range selection
    if(el.select){
      el.focus({ preventScroll: false });
      el.select();
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  async function tryModernClipboard(text){
    if(!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard API not available");
    await navigator.clipboard.writeText(text);
  }

  function tryLegacyExecCommand(){
    try { return document.execCommand("copy"); } catch { return false; }
  }

  QSA(".copybtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-target");
      const el = QS("#" + id);
      if (!el) {
        alert("Could not find the text to copy.");
        return;
      }

      const text = (el.value !== undefined) ? el.value : el.textContent;
      const trimmed = (text || "").trim();

      // 1) Modern clipboard attempt
      try {
        await tryModernClipboard(trimmed);
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 1500);
        return;
      } catch (_) {
        // fall through to legacy
      }

      // 2) Legacy: select the element + execCommand
      try {
        selectElementContents(el);
        const ok = tryLegacyExecCommand();
        if(ok){
          btn.textContent = "Copied!";
          setTimeout(() => btn.textContent = "Copy", 1500);
          return;
        }
      } catch (_) {
        // fall through to manual
      }

      // 3) Manual fallback: keep selected, instruct user
      selectElementContents(el);
      alert("Couldn’t access the clipboard automatically. Press Ctrl+C (Windows) or Cmd+C (Mac) to copy, then Enter.");
      btn.textContent = "Copy";
    });
  });

  // ---------- Paint completion if already done ----------
  if(lid){
    const p = loadProg();
    if(p[lid]?.completed){
      const badge = QS("#statusBadge"); if(badge){ badge.textContent = "Completed"; badge.classList.add("ok"); }
      const btn = QS("#completeBtn"); if(btn){ btn.textContent = "Completed ✔"; btn.disabled = true; btn.classList.add("success"); }
    }
  }

  // Expose for TOC pages
  window.finCourse = { loadProg, saveProg };
})();
