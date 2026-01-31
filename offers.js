// offers.js — Etapa 9 (Negociação de propostas + troca de equipe)
const STORAGE_KEY = "F1M25_SAVE_V1";
function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; } }
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function fmtMoney(n){ try{ return "$"+(n||0).toLocaleString("pt-BR"); }catch(e){ return "$"+(n||0); } }
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

const TEAM_MAP = {
  "Red Bull":"redbull",
  "Ferrari":"ferrari",
  "Mercedes":"mercedes",
  "McLaren":"mclaren",
  "Aston Martin":"aston",
  "Alpine":"alpine",
  "Williams":"williams",
  "Haas":"haas",
  "Sauber":"sauber",
};

function ensure(state){
  state.manager = state.manager || { offers: [], risk: 20 };
  state.manager.offers = state.manager.offers || [];
  state.team = state.team || { id:"williams", name:"WILLIAMS", money: 0 };
  state.team.money = state.team.money ?? 0;
  state.staff = state.staff || { hired: [], impact: {} };
  state.finances = state.finances || { weeklyIncome: 0, weeklyCost: 0, lastWeekTs: Date.now() };
  state.sponsor = state.sponsor || null;
  state.careerScore = state.careerScore ?? 0;
  return state;
}

function teamLabel(id){
  const up = (id||"").toString().toLowerCase();
  const entries = Object.entries(TEAM_MAP);
  const found = entries.find(([,v])=>v===up);
  return found ? found[0] : (up ? up.toUpperCase() : "—");
}

function generateObjectiveForTeam(teamName, mode){
  // metas simples por “tier” da equipe
  const top = ["Red Bull","Ferrari","Mercedes","McLaren"];
  const mid = ["Aston Martin","Alpine"];
  const low = ["Williams","Haas","Sauber"];
  let goal;
  if(top.includes(teamName)) goal = mode==="realistic" ? 55 : 40;
  else if(mid.includes(teamName)) goal = mode==="realistic" ? 28 : 20;
  else goal = mode==="realistic" ? 12 : 8;
  return `Meta interna: ${goal} pts na temporada (${teamName})`;
}

function applyTeamSwitch(state, offer){
  const mode = state.careerMode || (localStorage.getItem("f1m25_career_mode")||"free");
  const teamName = offer.team;
  const teamId = TEAM_MAP[teamName] || String(teamName||"").toLowerCase().replace(/\s+/g,"");
  state.team.id = teamId;
  state.team.name = teamName.toUpperCase();

  // bônus/pressão
  state.careerScore = (state.careerScore||0) + (offer.bonusScore||0);

  // orçamento inicial do “novo contrato”
  const top = ["redbull","ferrari","mercedes","mclaren"];
  const mid = ["aston","alpine"];
  const baseMoney = top.includes(teamId) ? 26000000 : (mid.includes(teamId) ? 20000000 : 16000000);
  state.team.money = Math.max(state.team.money||0, baseMoney);

  // risco: novo começo
  state.manager.risk = clamp((state.manager.risk||20) - 12, 0, 100);

  // staff: simplificação realista — contratos não transferem (limpa staff)
  state.staff.hired = [];
  state.staff.impact = {};

  // patrocinador: contrato costuma ser renegociado (limpa sponsor e renda)
  state.sponsor = null;
  state.finances.weeklyIncome = 0;
  // custo semanal recalculado pelos outros módulos (staff/drivers) — zera por enquanto
  state.finances.weeklyCost = (state.team.drivers||[]).reduce((a,d)=>a+(d.salary||0),0);

  // dupla de pilotos: mantém placeholders para recontratar (pode evoluir depois)
  state.team.drivers = [
    { id:"vac1", name:"Vaga em aberto", rating:60, pace:60, tyre:60, consistency:60, morale:62, salary:0, contractWeeks:0, weeksLeft:0, vacant:true },
    { id:"vac2", name:"Vaga em aberto", rating:60, pace:60, tyre:60, consistency:60, morale:62, salary:0, contractWeeks:0, weeksLeft:0, vacant:true },
  ];

  // novo objetivo
  state.manager.objective = generateObjectiveForTeam(teamName, mode);

  // limpa ofertas antigas
  state.manager.offers = [];
}

function renderStatus(state){
  document.getElementById("kTeam").textContent = teamLabel(state.team?.id);
  document.getElementById("kRisk").textContent = String(state.manager?.risk ?? 0);
  document.getElementById("kScore").textContent = String(state.careerScore ?? 0);
  document.getElementById("kMoney").textContent = fmtMoney(state.team?.money ?? 0);
}

function renderOffers(state){
  const el = document.getElementById("offers");
  el.innerHTML = "";
  const offers = state.manager.offers || [];
  if(!offers.length){
    el.innerHTML = '<div class="hint">Nenhuma proposta no momento. Faça boas corridas para chamar atenção.</div>';
    return;
  }
  offers.forEach(o=>{
    const div = document.createElement("div");
    div.className = "item";
    const teamId = TEAM_MAP[o.team] || (o.team||"").toLowerCase();
    div.innerHTML = `
      <div>
        <div><b>${o.team}</b> <span class="pill">Bônus +${o.bonusScore||0}</span></div>
        <div class="meta">Proposta para assumir como chefe de equipe. Orçamento base e metas serão ajustados.</div>
        <div class="meta">Equipe ID: ${teamId} • Gerada em: ${new Date(o.createdAt||Date.now()).toLocaleDateString()}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <button class="btn" data-refuse="${o.id}">Recusar</button>
        <button class="btn btn--primary" data-accept="${o.id}">Aceitar</button>
      </div>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-refuse]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-refuse");
      state.manager.offers = (state.manager.offers||[]).filter(x=>x.id!==id);
      saveState(state);
      renderOffers(state);
      renderStatus(state);
    });
  });

  el.querySelectorAll("button[data-accept]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-accept");
      const offer = (state.manager.offers||[]).find(x=>x.id===id);
      if(!offer) return;
      if(!confirm(`Aceitar proposta da ${offer.team}? Isso vai redefinir equipe, objetivos, staff e patrocínio.`)) return;
      applyTeamSwitch(state, offer);
      saveState(state);
      // vai pro lobby com time selecionado
      window.location.href = `lobby.html?userTeam=${encodeURIComponent(state.team.id)}`;
    });
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  const state = loadState();
  if(!state){ window.location.href = "index.html"; return; }
  ensure(state);
  saveState(state);
  renderStatus(state);
  renderOffers(state);

  document.getElementById("btnClear")?.addEventListener("click", ()=>{
    if(!confirm("Limpar todas as propostas?")) return;
    state.manager.offers = [];
    saveState(state);
    renderOffers(state);
  });
});
