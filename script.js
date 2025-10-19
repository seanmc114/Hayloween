// HAYLOWEEN — menu-first, all modes unlocked, Friday = mixed from Mon+Tue+Wed
(()=>{
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));

  // ----- CONFIG -----
  const CONFIG = {
    title: "HAYLOWEEN",
    codes: {}, // not used; everything is unlocked
    days: {
      D1: { label: "Monday — Halloween vocab (1st years)" },
      D2: { label: "Tuesday — Numbers 1–20" },
      D3: { label: "Wednesday — HAY + numbers + Halloween (pos/neg/questions)" }
    },
    QUESTIONS_PER_RUN: 10,
    PENALTY_SECONDS: 30
  };

  // ----- VOICE -----
  const VOICE = {
    enabled: 'speechSynthesis' in window,
    english: null, spanish: null,
    init(){
      if(!this.enabled) return;
      const pick = () => {
        const voices = speechSynthesis.getVoices();
        this.english = voices.find(v=>/^en[-_]/i.test(v.lang)) || voices.find(v=>/en/i.test(v.lang)) || voices[0] || null;
        this.spanish = voices.find(v=>/^es[-_]/i.test(v.lang)) || voices.find(v=>/es/i.test(v.lang)) || this.english;
      };
      pick();
      window.speechSynthesis.onvoiceschanged = pick;
    },
    speak(text, lang='en'){
      if(!this.enabled || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      const voice = lang.startsWith('es') ? (this.spanish || this.english) : (this.english || this.spanish);
      if(voice) u.voice = voice;
      u.rate = 1; u.pitch = 1; u.volume = 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  };

  // ----- WEEK CONTENT -----
  const PHRASES = {
    // Monday — Halloween vocab
    D1: [
      {en:"Pumpkin", es:["calabaza"]},
      {en:"Ghost", es:["fantasma"]},
      {en:"Witch", es:["bruja"]},
      {en:"Vampire", es:["vampiro"]},
      {en:"Skeleton", es:["esqueleto"]},
      {en:"Spider", es:["araña","arana"]},
      {en:"Bat", es:["murciélago","murcielago"]},
      {en:"Black cat", es:["gato negro"]},
      {en:"Costume", es:["disfraz"]},
      {en:"Haunted house", es:["casa embrujada"]},
      {en:"Candy", es:["caramelo","dulce","chuche","golosina"]},
      {en:"Monster", es:["monstruo"]},
      {en:"Mummy", es:["momia"]},
      {en:"Broom", es:["escoba"]},
      {en:"Mask", es:["máscara","mascara"]},
      {en:"Zombie", es:["zombi","zombie"]},
      {en:"Skull", es:["calavera"]},
      {en:"Lantern", es:["farol"]},
      {en:"Scarecrow", es:["espantapájaros","espantapajaros"]},
      {en:"Trick or treat", es:["truco o trato"]}
    ],
    // Tuesday — Numbers 1–20
    D2: [
      {en:"one", es:["uno"]},{en:"two", es:["dos"]},{en:"three", es:["tres"]},{en:"four", es:["cuatro"]},{en:"five", es:["cinco"]},
      {en:"six", es:["seis"]},{en:"seven", es:["siete"]},{en:"eight", es:["ocho"]},{en:"nine", es:["nueve"]},{en:"ten", es:["diez"]},
      {en:"eleven", es:["once"]},{en:"twelve", es:["doce"]},{en:"thirteen", es:["trece"]},{en:"fourteen", es:["catorce"]},{en:"fifteen", es:["quince"]},
      {en:"sixteen", es:["dieciséis","dieciseis"]},{en:"seventeen", es:["diecisiete"]},{en:"eighteen", es:["dieciocho"]},
      {en:"nineteen", es:["diecinueve"]},{en:"twenty", es:["veinte"]}
    ],
    // Wednesday — HAY + numbers + Halloween (pos/neg/questions)
    D3: [
      // positive
      {en:"There is a pumpkin", es:["hay una calabaza"]},
      {en:"There are two pumpkins", es:["hay dos calabazas"]},
      {en:"There are three ghosts", es:["hay tres fantasmas"]},
      {en:"There is a witch", es:["hay una bruja"]},
      {en:"There is a black cat", es:["hay un gato negro"]},
      {en:"There are five spiders", es:["hay cinco arañas","hay cinco aranas"]},
      {en:"There are four bats", es:["hay cuatro murciélagos","hay cuatro murcielagos"]},
      {en:"There are ten candies", es:["hay diez caramelos","hay diez dulces"]},
      // negative
      {en:"There isn't a vampire", es:["no hay un vampiro"]},
      {en:"There aren't two mummies", es:["no hay dos momias"]},
      {en:"There isn't a skull", es:["no hay una calavera"]},
      {en:"There aren't three monsters", es:["no hay tres monstruos"]},
      // questions (answers as 'hay ...')
      {en:"Is there a pumpkin?", es:["hay una calabaza"]},
      {en:"Are there two ghosts?", es:["hay dos fantasmas"]},
      {en:"Is there a witch?", es:["hay una bruja"]},
      {en:"Are there seven spiders?", es:["hay siete arañas","hay siete aranas"]}
    ],
    // Friday — filled dynamically as D1 + D2 + D3
    FRIDAY: []
  };

  // ----- AUX DATA (unchanged base) -----
  const DB = {
    ser:{present:["soy","eres","es","es","somos","sois","son"],
         past:["fui","fuiste","fue","fue","fuimos","fuisteis","fueron"],
         future:["seré","seras","sera","será","seremos","seréis","seran","serán"]},
    tener:{present:["tengo","tienes","tiene","tiene","tenemos","tenéis","tienen"],
           past:["tuve","tuviste","tuvo","tuvo","tuvimos","tuvisteis","tuvieron"],
           future:["tendré","tendras","tendra","tendrá","tendremos","tendréis","tendran","tendrán"]},
    estar:{present:["estoy","estás","estas","está","esta","estamos","estáis","estais","están","estan"],
           past:["estuve","estuviste","estuvo","estuvo","estuvimos","estuvisteis","estuvieron"],
           future:["estaré","estaras","estara","estará","estaremos","estaréis","estareis","estarán","estaran"]}
  };

  // ----- STATE -----
  let currentTense = "Present"; // inert now (tense buttons hidden)
  let currentMode = null;
  let startTime = 0, timerId = null;

  // ----- TITLE -----
  document.title = CONFIG.title;
  const h1 = document.querySelector("h1");
  if (h1) h1.innerHTML = `<span class="turbo">${CONFIG.title}</span>`;

  // Keep in case buttons exist in markup
  function setTenseButtons(){
    const btns = $$(".tense-button");
    btns.forEach(b=>{
      b.onclick = ()=>{
        btns.forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        currentTense = b.dataset.tense || "Present";
        renderModes();
      };
    });
  }
  setTenseButtons();

  // ----- UNLOCK: everything open -----
  function keyUnlocked(day){ return `turbo_mtw_unlocked_${CONFIG.title}_${day}`; }
  function isUnlocked(day){ return true; }
  function unlock(day){ localStorage.setItem(keyUnlocked(day), "1"); }

  // If the old code button exists, make it harmless
  function handleCode(){
    const m = $("#codeMsg");
    if (m) m.textContent = "All modes unlocked.";
    renderModes();
  }

  // ----- MENU -----
  function makeModeBtn(modeKey, label){
    const btn = document.createElement("button");
    const locked = !isUnlocked(modeKey);
    btn.className = "mode";
    const best = getBest(currentTense, modeKey);
    btn.textContent = `${locked ? "🔒" : "🔓"} ${label}${best!=null ? " — Best: "+best.toFixed(1)+"s" : ""}`;
    btn.onclick = () => { if (!locked) startMode(modeKey); };
    return btn;
  }

  function renderModes(){
    const host = $("#mode-list"); if (!host) return;
    host.innerHTML = "";
    host.appendChild(makeModeBtn("HOMEWORK", "Homework Tonight (All unlocked days)"));
    host.appendChild(makeModeBtn("D1", CONFIG.days.D1.label));
    host.appendChild(makeModeBtn("D2", CONFIG.days.D2.label));
    host.appendChild(makeModeBtn("D3", CONFIG.days.D3.label));
    host.appendChild(makeModeBtn("FRIDAY", "Friday Test (All week) — unlocks from Wednesday"));
  }
  renderModes();

  // ----- POOL BUILDER -----
  function buildPoolForMode(modeKey){
    const d1 = PHRASES.D1.slice();
    const d2 = PHRASES.D2.slice();
    const d3 = PHRASES.D3.slice();
    if (!PHRASES.FRIDAY || !PHRASES.FRIDAY.length) PHRASES.FRIDAY = d1.concat(d2, d3);

    if (modeKey === "HOMEWORK") return d1.concat(d2, d3);
    if (modeKey === "FRIDAY")  return PHRASES.FRIDAY.slice();
    return (PHRASES[modeKey] || []).slice();
  }

  // ----- QUIZ RUNNER -----
  function startMode(modeKey){
    currentMode = modeKey;
    $("#mode-list").style.display = "none";
    $("#game").style.display = "block";
    $("#results").innerHTML = "";
    $("#back-button").style.display = "none";

    const pool = buildPoolForMode(modeKey);
    shuffle(pool);

    const LIMIT = CONFIG.QUESTIONS_PER_RUN;
    const quiz = pool.slice(0, LIMIT).map(item => ({ prompt: item.en, answers: item.es }));

    // Render Qs
    const qHost = $("#questions"); qHost.innerHTML = "";
    quiz.forEach((q,i) => {
      const row = document.createElement("div"); row.className = "q";

      const promptRow = document.createElement("div"); promptRow.className = "prompt-row";
      const p = document.createElement("div"); p.className = "prompt"; p.textContent = `${i+1}. ${q.prompt}`;
      const spk = document.createElement("button"); spk.className = "speak-btn"; spk.textContent = "🔊"; spk.title = "Read this question";
      spk.onclick = ()=> VOICE.speak(q.prompt.replace(/\s*\(.*\)\s*$/,''), 'en');
      promptRow.appendChild(p); promptRow.appendChild(spk);

      const inputRow = document.createElement("div"); inputRow.className = "input-row";
      const input = document.createElement("input"); input.type = "text"; input.autocomplete = "off"; input.spellcheck = false;
      input.placeholder = "Answer in Spanish…";
      inputRow.appendChild(input);

      row.appendChild(promptRow); row.appendChild(inputRow);
      qHost.appendChild(row);
    });

    // Timer
    const timerEl = $("#timer");
    startTime = Date.now();
    clearInterval(timerId);
    timerId = setInterval(()=> {
      const s = (Date.now() - startTime)/1000;
      timerEl.textContent = `Time: ${s.toFixed(1)}s`;
    }, 100);

    // Voice helpers
    const auto = $("#auto-read"); const readAll = $("#read-all");
    if (auto) auto.onchange = ()=>{};
    if (readAll) readAll.onclick = ()=> quiz.forEach(q=> VOICE.speak(q.prompt.replace(/\s*\(.*\)\s*$/,''), 'en'));

    // Submit grading
    $("#submit").onclick = ()=>{
      clearInterval(timerId);
      const inputs = $$(".q input");
      let correct = 0;
      const resultsUl = document.createElement("ul");
      const normExpected = a => a.map(norm);

      quiz.forEach((q, i) => {
        const given = norm(inputs[i].value);
        const ok = given && normExpected(q.answers).includes(given);
        if (ok) correct++;

        const li = document.createElement("li");
        li.innerHTML = ok
          ? `<strong class="ok">✓ ${q.prompt}</strong> — ${q.answers[0]}`
          : `<strong class="no">✗ ${q.prompt}</strong> — Your answer: <em>${inputs[i].value||"(blank)"}</em> · Correct: <strong>${q.answers[0]}</strong>`;
        resultsUl.appendChild(li);
      });

      const raw = (Date.now() - startTime)/1000;
      const penalty = (CONFIG.QUESTIONS_PER_RUN - correct) * CONFIG.PENALTY_SECONDS;
      const finalTime = raw + penalty;

      const summary = document.createElement("p");
      summary.innerHTML = `<strong>${correct}/${CONFIG.QUESTIONS_PER_RUN} correct</strong> · Raw: ${raw.toFixed(1)}s · Penalty: +${penalty}s · <strong>Total: ${finalTime.toFixed(1)}s</strong>`;

      const results = $("#results"); results.innerHTML = ""; results.appendChild(summary); results.appendChild(resultsUl);

      // Save best time per (tense, mode)
      const best = getBest(currentTense, currentMode);
      if (best == null || finalTime < best) saveBest(currentTense, currentMode, finalTime);

      $("#back-button").style.display = "inline-block";
      $("#back-button").onclick = ()=>{ $("#game").style.display = "none"; $("#mode-list").style.display = "flex"; renderModes(); };
    };
  }

  function norm(s){
    return (s||"").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[¿?¡!]/g,"")
      .replace(/\s+/g," ").trim();
  }

  // ----- LOCAL BESTS -----
  function keyBest(tense, mode){ return `turbo_mtw_best_${CONFIG.title}_${tense}_${mode}`; }
  function getBest(tense, mode){
    const v = localStorage.getItem(keyBest(tense, mode));
    return v ? parseFloat(v) : null;
  }
  function saveBest(tense, mode, seconds){ localStorage.setItem(keyBest(tense, mode), String(seconds)); }

  // Init
  VOICE.init();
  renderModes();

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
})();
