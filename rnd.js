// rnd.js — Etapa 6 (P&D base)
const STORAGE_KEY = "F1M25_SAVE_V1";

// === Etapa 6.1 Hotfix: P&D abre mesmo se usuário entrou direto no Lobby via URL ===
const USER_TEAM_KEY = "f1m2025_user_team";
const USER_MANAGER_KEY = "f1m2025_user_manager";
const CAREER_MODE_KEY = "f1m25_career_mode";

function bootstrapStateIfMissing(){
  let state = loadState();
  if(state) return state;

  // tenta montar um save mínimo a partir das seleções já feitas
  let teamId = null;
  let managerName = "Novo Manager";
  try{ teamId = localStorage.getItem(USER_TEAM_KEY); }catch(e){}
  try{ managerName = localStorage.getItem(USER_MANAGER_KEY) || managerName; }catch(e){}
  // fallback: querystring ?userTeam=...
  try{
    const u = new URL(window.location.href);
    if(!teamId) teamId = u.searchParams.get("userTeam");
  }catch(e){}

  if(!teamId){
    // sem equipe selecionada, volta para o fluxo correto
    window.location.href = "career_mode.html";
    return null;
  }

  const mode = (localStorage.getItem(CAREER_MODE_KEY) || "free");
  state = {
    careerMode: mode,
    careerScore: 0,
    season: { year: 2025, gpIndex: 0, calendar: ["Bahrain","Saudi","Australia","Japan","China","Miami","Imola","Monaco","Spain","Canada","Austria","UK","Hungary","Belgium","Netherlands","Italy","Singapore","USA","Mexico","Brazil","Las Vegas","Qatar","Abu Dhabi"] },
    manager: { name: managerName, points: 0, risk: mode === "realistic" ? 22 : 10, objective: "", offers: [] },
    team: { id: String(teamId).toLowerCase(), name: String(teamId).toUpperCase(), money: mode === "realistic" ? 16000000 : 20000000, car: { aero:70, engine:70, chassis:70, reliability:70 } },
    rd: { active: [], completed: [] }
  };
  saveState(state);
  return state;
}


const PROJECTS = [
  { id:"aero_small",   name:"Pacote Aerodinâmico (pequeno)", stat:"aero",         gain: 2, cost: 1800000, weeks: 2 },
  { id:"aero_big",     name:"Pacote Aerodinâmico (grande)",  stat:"aero",         gain: 4, cost: 3200000, weeks: 4 },
  { id:"engine_map",   name:"Mapeamento de Motor",           stat:"engine",       gain: 2, cost: 2000000, weeks: 3 },
  { id:"chassis_fit",  name:"Rigidez do Chassi",             stat:"chassis",      gain: 2, cost: 1900000, weeks: 3 },
  { id:"reliability",  name:"Confiabilidade (upgrade)",      stat:"reliability",  gain: 3, cost: 2200000, weeks: 3 },
];

function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; } }
function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function ensureRD(state){
  state.rd = state.rd || { active: [], completed: [] };
  state.team = state.team || {};
  state.team.car = state.team.car || { aero:70, engine:70, chassis:70, reliability:70 };
  state.team.money = state.team.money ?? 0;
  return state;
}
function fmtMoney(n){ try{ return "$" + (n||0).toLocaleString("pt-BR"); }catch(e){ return "$" + (n||0); } }

function renderBars(car){
  const el = document.getElementById("carBars");
  el.innerHTML = "";
  [["Aerodinâmica","aero"],["Motor","engine"],["Chassi","chassis"],["Confiabilidade","reliability"]].forEach(([label,key])=>{
    const v = car[key] ?? 0;
    const row = document.createElement("div");
    row.className = "bar";
    row.innerHTML = `
      <label>${label}</label>
      <div class="track"><div class="fill" style="width:${clamp(v,0,100)}%"></div></div>
      <div style="text-align:right;font-weight:900;">${v}</div>
    `;
    el.appendChild(row);
  });
}

function renderProjects(state){
  const el = document.getElementById("projects");
  el.innerHTML = "";
  const activeIds = new Set((state.rd.active||[]).map(p=>p.id));

  PROJECTS.forEach(p=>{
    const active = activeIds.has(p.id);
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <div><b>${p.name}</b></div>
        <div class="meta">Efeito: +${p.gain} ${p.stat.toUpperCase()} • Custo: ${fmtMoney(p.cost)} • Tempo: ${p.weeks} semanas</div>
      </div>
      <button class="btn ${active?'':'btn--primary'}" data-id="${p.id}" ${active?'disabled':''}>
        ${active ? "Em andamento" : "Iniciar"}
      </button>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-id");
      const p = PROJECTS.find(x=>x.id===id);
      if(!p) return;

      if(state.team.money < p.cost){
        alert("Dinheiro insuficiente para iniciar este projeto.");
        return;
      }
      state.team.money -= p.cost;
      state.rd.active.push({ ...p, startedAt: Date.now() });
      saveState(state);
      render(state);
    });
  });
}

function finishOneDev(state){
  const p = (state.rd.active||[])[0];
  if(!p){ alert("Nenhum projeto ativo."); return; }
  state.rd.active = state.rd.active.slice(1);
  state.rd.completed.push({ ...p, finishedAt: Date.now() });
  const car = state.team.car;
  car[p.stat] = clamp((car[p.stat]||0) + p.gain, 0, 100);
  saveState(state);
  render(state);
}

function render(state){
  ensureRD(state);
  renderBars(state.team.car);
  renderProjects(state);
}

document.addEventListener("DOMContentLoaded", ()=>{
  const state = bootstrapStateIfMissing();
  if(!state){ window.location.href = "index.html"; return; }
  ensureRD(state);
  saveState(state);
  render(state);
  document.getElementById("btnFinishDev")?.addEventListener("click", ()=> finishOneDev(state));
});
