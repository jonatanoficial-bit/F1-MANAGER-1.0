// sponsors.js — Etapa 7 (Patrocínio + metas + impacto no risco)
const STORAGE_KEY = "F1M25_SAVE_V1";
const SPONSOR_OFFERS_KEY = "f1m25_sponsor_offers_v1";
const CAREER_MODE_KEY = "f1m25_career_mode";

function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; } }
function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function fmtMoney(n){ try{ return "$" + (n||0).toLocaleString("pt-BR"); }catch(e){ return "$"+(n||0); } }

function ensure(state){
  state.finances = state.finances || { weeklyIncome: 0, weeklyCost: 0, sponsors: [], lastWeekTs: Date.now() };
  state.manager = state.manager || { points:0, risk:20, objective:"", offers:[] };
  state.team = state.team || { money:0, reputation:50 };
  state.sponsor = state.sponsor || null;
  return state;
}

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function makeOffer(mode){
  const brands = ["VALORIS","AURUM","NOVA TEL","SKYLINE","RAPID","ORBITAL","ZENITH","KORP","VOLTIX","HYPERION"];
  const tiers = [
    { tier:"Bronze", income:[450000, 850000], goal:[6, 12], penaltyRisk: 6 },
    { tier:"Prata",  income:[900000, 1500000], goal:[12, 22], penaltyRisk: 10 },
    { tier:"Ouro",   income:[1600000, 2400000], goal:[22, 35], penaltyRisk: 14 },
    { tier:"Platina",income:[2500000, 3800000], goal:[35, 55], penaltyRisk: 18 },
  ];
  const t = pick(tiers);
  const baseInc = rand(t.income[0], t.income[1]);
  const baseGoal = rand(t.goal[0], t.goal[1]);
  const mult = (mode === "realistic") ? 1.15 : 1.0;
  const goalMult = (mode === "realistic") ? 1.25 : 0.95;

  return {
    id: "s_"+Math.random().toString(16).slice(2),
    name: pick(brands) + " " + (Math.random()<0.3?"Group":"Industries"),
    tier: t.tier,
    weeklyIncome: Math.floor(baseInc*mult),
    goalPointsSeason: Math.max(1, Math.floor(baseGoal*goalMult)),
    penaltyRisk: t.penaltyRisk + (mode==="realistic"?4:0),
    contractSeasons: 1,
  };
}

function loadOffers(){
  try{ return JSON.parse(localStorage.getItem(SPONSOR_OFFERS_KEY)); }catch(e){ return null; }
}
function saveOffers(o){ localStorage.setItem(SPONSOR_OFFERS_KEY, JSON.stringify(o)); }
function regenOffers(){
  const mode = localStorage.getItem(CAREER_MODE_KEY) || "free";
  const list = Array.from({length:6}, ()=> makeOffer(mode));
  saveOffers(list);
  return list;
}

function applyOffer(state, offer){
  state.sponsor = {
    ...offer,
    startedAt: Date.now(),
    seasonStartYear: state.season?.year || 2025,
    met: false
  };
  state.finances.weeklyIncome = offer.weeklyIncome;
  // define objetivo do manager (visível no season end)
  state.manager.objective = `Meta: ${offer.goalPointsSeason} pts na temporada (${offer.tier})`;
}

function endContract(state){
  state.sponsor = null;
  state.finances.weeklyIncome = 0;
}

function renderContract(state){
  const s = state.sponsor;
  document.getElementById("kName").textContent = s ? `${s.name}` : "—";
  document.getElementById("kIncome").textContent = s ? fmtMoney(s.weeklyIncome) : "—";
  document.getElementById("kGoal").textContent = s ? String(s.goalPointsSeason) : "—";
  if(!s){
    document.getElementById("kStatus").textContent = "Sem contrato";
    return;
  }
  const pts = state.manager?.points || 0;
  const goal = s.goalPointsSeason || 0;
  const ok = pts >= goal;
  document.getElementById("kStatus").innerHTML = ok ? "Meta <b>em dia</b>" : "<span style='color:#ffb3b3'>Abaixo da meta</span>";
}

function renderOffers(state, offers){
  const el=document.getElementById("offers");
  el.innerHTML="";
  offers.forEach(o=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML = `
      <div>
        <div><b>${o.name}</b> <span class="pill">${o.tier}</span></div>
        <div class="meta">Receita: ${fmtMoney(o.weeklyIncome)}/semana • Meta: ${o.goalPointsSeason} pts/temporada • Penalidade risco: +${o.penaltyRisk}</div>
      </div>
      <button class="btn btn--primary" data-id="${o.id}">Assinar</button>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id=btn.getAttribute("data-id");
      const offer = offers.find(x=>x.id===id);
      if(!offer) return;
      applyOffer(state, offer);
      saveState(state);
      renderContract(state);
      alert("Contrato assinado! Receita semanal será aplicada no Lobby.");
    });
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  const state = loadState();
  if(!state){ window.location.href="index.html"; return; }
  ensure(state);
  saveState(state);

  let offers = loadOffers();
  if(!offers || !Array.isArray(offers) || offers.length<4) offers = regenOffers();

  renderOffers(state, offers);
  renderContract(state);

  document.getElementById("btnEnd")?.addEventListener("click", ()=>{
    if(!state.sponsor){ alert("Você não tem contrato."); return; }
    if(!confirm("Encerrar contrato? Você perderá receita semanal.")) return;
    endContract(state);
    saveState(state);
    renderContract(state);
  });
});
