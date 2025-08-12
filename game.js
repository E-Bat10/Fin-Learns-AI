
(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const app = {
    state: { playerName: "Fin Batten", pin: "", xp: 0, completed: {} },
    quests: {
      s0: [
        {id:"s0_q1", txt:"Prompt Jiu‑Jitsu 101", xp:25},
        {id:"s0_q2", txt:"Hallucination Hunter", xp:25},
        {id:"s0_q3", txt:"Family Agreement (AI Code)", xp:25},
        {id:"s0_q4", txt:"Off‑Screen Rep Streak (7 days)", xp:25},
        {id:"s0_q5", txt:"Spanish Spark (5 mini dialogs)", xp:25},
      ],
      s1main: [
        {id:"s1_m1", txt:"Goalie Brain plan", xp:25},
        {id:"s1_m2", txt:"FPS Lab decision tree", xp:25},
        {id:"s1_m3", txt:"Spanish Sprint (daily)", xp:25},
        {id:"s1_m4", txt:"Recycling Biz 2.0 pilot", xp:25},
      ],
      s1side: [
        {id:"s1_s1", txt:"Sea Turtle Advocate", xp:20},
        {id:"s1_s2", txt:"Modern Beach House sketch", xp:20},
        {id:"s1_s3", txt:"Guitar Groove + weekly clip", xp:20},
      ],
      s1anchors: [
        {id:"s1_a1", txt:"Two soccer sessions + family walk/ride (weekly)", xp:15},
        {id:"s1_a2", txt:"Kitchen helper night (weekly)", xp:15},
        {id:"s1_a3", txt:"Lost + ethics chat (weekly)", xp:15},
      ]
    },
    save(){ localStorage.setItem("fin_ai_quest_v4", JSON.stringify(this.state)); },
    load(){
      const raw = localStorage.getItem("fin_ai_quest_v4");
      if(raw){ try{ this.state = JSON.parse(raw); }catch(e){} }
    },
    addXP(n){ this.state.xp += n; this.updateStats(); this.save(); },
    clampXP(){ if(this.state.xp < 0) this.state.xp = 0; },
    updateStats(){
      $("#xp").textContent = this.state.xp;
      $("#level").textContent = 1 + Math.floor(this.state.xp / 150);
    },
    renderList(el, arr){
      el.innerHTML = "";
      arr.forEach(q => {
        const li = document.createElement("li");
        const cb = document.createElement("input"); cb.type = "checkbox";
        cb.checked = !!this.state.completed[q.id];
        cb.addEventListener("change", () => {
          if(cb.checked){ this.state.completed[q.id] = true; this.addXP(q.xp); }
          else { delete this.state.completed[q.id]; this.state.xp -= q.xp; this.clampXP(); this.updateStats(); this.save(); }
        });
        const label = document.createElement("span"); label.textContent = q.txt + ` (+${q.xp} XP)`;
        li.appendChild(cb); li.appendChild(label); el.appendChild(li);
      });
    },
    gateByPIN(callback){
      const input = prompt("Parent PIN required:");
      if(input === this.state.pin && input){ callback(); } else { alert("Incorrect PIN."); }
    },
    init(){
      this.load();
      $("#playerName").value = this.state.playerName || "Fin Batten";
      $("#saveSetup").addEventListener("click", () => {
        this.state.playerName = $("#playerName").value || "Fin Batten";
        const newPin = $("#parentPin").value.trim(); if(newPin){ this.state.pin = newPin; }
        this.save(); alert("Saved. Go to Dashboard.");
        $("#setup").classList.add("hidden"); $("#dashboard").classList.remove("hidden");
        this.updateStats();
      });
      $("#btnSeason0").addEventListener("click", ()=>{
        $("#dashboard").classList.add("hidden"); $("#season0").classList.remove("hidden");
        this.renderList($("#s0quests"), this.quests.s0);
      });
      $("#btnSeason1").addEventListener("click", ()=>{
        $("#dashboard").classList.add("hidden"); $("#season1").classList.remove("hidden");
        this.renderList($("#s1main"), this.quests.s1main);
        this.renderList($("#s1side"), this.quests.s1side);
        this.renderList($("#s1anchors"), this.quests.s1anchors);
      });
      $("#btnMinigames").addEventListener("click", ()=>{
        $("#dashboard").classList.add("hidden"); $("#minigames").classList.remove("hidden");
        renderPLB(); renderHHQ(); renderSS();
      });
      $$("#season0 .back, #season1 .back, #minigames .back").forEach(b=>{
        b.addEventListener("click", ()=>{
          $$("#season0, #season1, #minigames").forEach(s=>s.classList.add("hidden"));
          $("#dashboard").classList.remove("hidden");
        });
      });
      $$(".bossComplete").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          this.gateByPIN(()=>{
            const id = btn.dataset.boss === "s0" ? "s0_boss" : "s1_boss";
            if(!this.state.completed[id]){ this.state.completed[id] = true; this.addXP(60); this.save(); alert("Boss cleared!"); }
            else { alert("Already completed."); }
          });
        });
      });
      $("#btnReset").addEventListener("click", ()=>{
        if(confirm("Reset all progress?")){ localStorage.removeItem("fin_ai_quest_v4"); location.reload(); }
      });
      if(this.state.playerName || this.state.pin){ $("#setup").classList.add("hidden"); $("#dashboard").classList.remove("hidden"); this.updateStats(); }
    }
  };

  // Mini-games
  function renderPLB(){
    const container = document.getElementById("plb"); container.innerHTML = "";
    const steps = ["Goal","Context","Constraints","Draft","Critique","Revise"];
    const shuffled = steps.slice().sort(()=>Math.random()-0.5);
    const drop = document.createElement("div"); drop.className = "drag-container"; container.appendChild(drop);
    const bank = document.createElement("div"); bank.className = "drag-container"; container.appendChild(bank);
    shuffled.forEach(s => {
      const el = document.createElement("div"); el.className = "drag-item"; el.draggable = true; el.textContent = s; bank.appendChild(el);
      el.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", s));
    });
    [drop, bank].forEach(d => {
      d.addEventListener("dragover", e => e.preventDefault());
      d.addEventListener("drop", e => {
        e.preventDefault();
        const s = e.dataTransfer.getData("text/plain");
        const el = Array.from(bank.children).find(x => x.textContent === s) || Array.from(drop.children).find(x => x.textContent === s);
        if(el) d.appendChild(el);
      });
    });
    document.getElementById("plbCheck").onclick = () => {
      const seq = Array.from(drop.children).map(x => x.textContent);
      const correct = ["Goal","Context","Constraints","Draft","Critique","Revise"];
      const ok = seq.length===6 && seq.every((v,i)=>v===correct[i]);
      const out = document.getElementById("plbResult");
      if(ok){ out.textContent = "Perfect order! +10 XP"; addMiniXP(10); }
      else { out.textContent = "Not quite. Try again."; }
    };
  }

  function renderHHQ(){
    const q = [
      {t:"The Sun is a star.", a:true},
      {t:"North Carolina's capital is Charlotte.", a:false},
      {t:"Lightning never strikes the same place twice.", a:false},
      {t:"Sea turtles are reptiles.", a:true},
      {t:"Ray tracing usually increases FPS.", a:false},
      {t:"Avicii was a Swedish DJ.", a:true},
    ];
    const div = document.getElementById("hhq"); div.innerHTML = "";
    q.forEach((item, idx)=>{
      const row = document.createElement("div");
      const label = document.createElement("span"); label.textContent = (idx+1)+". "+item.t;
      const sel = document.createElement("select"); sel.innerHTML = "<option value=''>Choose</option><option value='true'>True</option><option value='false'>False</option>";
      row.appendChild(label); row.appendChild(sel); div.appendChild(row);
    });
    document.getElementById("hhqCheck").onclick = ()=>{
      const selects = Array.from(document.querySelectorAll("#hhq select")); let score = 0;
      selects.forEach((s, i)=>{ if(s.value!==""){ const bool = s.value==="true"; if(bool===q[i].a) score++; } });
      const out = document.getElementById("hhqResult"); out.textContent = `Score: ${score}/${q.length}`;
      if(score===q.length){ out.textContent += " — Flawless! +15 XP"; addMiniXP(15); }
    };
  }

  function renderSS(){
    const q = [
      {t:"How do you say 'I want water'?", options:["Quiero agua.","Yo soy agua.","Tengo agua sed."], a:0},
      {t:"Pick the verb that means 'to ask for/order (food)'", options:["beber","pedir","correr"], a:1},
      {t:"Translate: 'the check, please'", options:["la cuenta, por favor","el pollo, por favor","la mesa, por favor"], a:0},
      {t:"Which is a past tense of 'ir' (to go)?", options:["fui","voy","iré"], a:0},
      {t:"Best response to '¿Cómo estás?'", options:["Estoy bien.","Me llamo bien.","Tengo bien."], a:0}
    ];
    const div = document.getElementById("ss"); div.innerHTML = "";
    q.forEach((item, idx)=>{
      const row = document.createElement("div");
      const p = document.createElement("p"); p.textContent = (idx+1)+". "+item.t; row.appendChild(p);
      item.options.forEach((opt, j)=>{
        const id = `ss_${idx}_{j}`;
        const r = document.createElement("input"); r.type = "radio"; r.name = `ss_${idx}`; r.value = j; r.id = id;
        const l = document.createElement("label"); l.htmlFor = id; l.textContent = opt;
        row.appendChild(r); row.appendChild(l); row.appendChild(document.createElement("br"));
      });
      div.appendChild(row);
    });
    document.getElementById("ssCheck").onclick = ()=>{
      let score = 0;
      q.forEach((item, idx)=>{
        const chosen = document.querySelector(`input[name='ss_${idx}']:checked`);
        if(chosen && parseInt(chosen.value,10)===item.a) score++;
      });
      const out = document.getElementById("ssResult"); out.textContent = `Score: ${score}/${q.length}`;
      if(score===q.length){ out.textContent += " — Excelente! +15 XP"; addMiniXP(15); }
    };
  }

  function addMiniXP(n){
    const raw = localStorage.getItem("fin_ai_quest_v4");
    if(!raw) return;
    try{ const state = JSON.parse(raw); state.xp = (state.xp||0) + n; localStorage.setItem("fin_ai_quest_v4", JSON.stringify(state)); app.state = state; app.updateStats(); }catch(e){}
  }

  app.init();
})(); 
