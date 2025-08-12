<script>
/* Tiny course engine: quizzes + progress + copy buttons + PIN gate */
(() => {
  const QS = (s, r=document) => r.querySelector(s);
  const QSA = (s, r=document) => Array.from(r.querySelectorAll(s));
  const PROG_KEY = "fin_course_progress_v1";
  const PIN_KEY = "fin_parent_pin_note"; // optional storage for a hint note (not the real PIN)

  function loadProg(){ try{return JSON.parse(localStorage.getItem(PROG_KEY)||"{}");}catch{ return {}; } }
  function saveProg(p){ localStorage.setItem(PROG_KEY, JSON.stringify(p)); }

  // Mark lesson complete
  window.markComplete = (lessonId) => {
    const p = loadProg();
    const now = new Date().toISOString();
    p[lessonId] = { completed: true, ts: now };
    saveProg(p);
    const btn = QS("#completeBtn");
    if(btn){ btn.textContent = "Completed ✔"; btn.disabled = true; btn.classList.add("success"); }
    const badge = QS("#statusBadge"); if(badge){ badge.textContent = "Completed"; badge.classList.add("ok"); }
  };

  // Quizzes
  function scoreQuiz(box){
    const questions = QSA(".q", box);
    let total = questions.length, correct = 0;
    questions.forEach((q) => {
      const answer = q.getAttribute("data-answer");
      const chosen = QS("input[type=radio]:checked, select, input[type=text]", q);
      let ok = false;
      if(chosen){
        if(chosen.tagName === "SELECT"){
          ok = (chosen.value === answer);
        }else if(chosen.type === "text"){
          ok = (chosen.value.trim().toLowerCase() === answer.trim().toLowerCase());
        }else{
          ok = (chosen.value === answer);
        }
      }
      q.style.borderLeft = ok ? "4px solid #2d7" : "4px solid #c55";
      if(ok) correct++;
    });
    const r = QS(".result", box);
    if(r){
      r.textContent = `Score: ${correct}/${total}` + (correct===total ? " — Nice! ✅" : " — Keep at it 💪");
    }
    // optional auto-complete on perfect score
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

  // Copy buttons
  QSA(".copybtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-target");
      const el = QS("#"+id);
      const text = el?.value || el?.textContent || "";
      navigator.clipboard.writeText(text).then(()=>{
        btn.textContent = "Copied!";
        setTimeout(()=> btn.textContent = "Copy", 1200);
      });
    });
  });

  // Fill status badge if present
  const lid = document.body.getAttribute("data-lesson-id");
  if(lid){
    const p = loadProg();
    if(p[lid]?.completed){
      const badge = QS("#statusBadge"); if(badge){ badge.textContent = "Completed"; badge.classList.add("ok"); }
      const btn = QS("#completeBtn"); if(btn){ btn.textContent = "Completed ✔"; btn.disabled = true; btn.classList.add("success"); }
    }
  }

  // Expose helpers
  window.finCourse = { loadProg, saveProg };
})();
</script>
