// staff.js — Etapa 7 (Staff + salários + impacto base)
const STORAGE_KEY = "F1M25_SAVE_V1";
const MARKET_KEY = "f1m25_staff_market_v1";

function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; } }
function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function fmtMoney(n){ try{ return "$" + (n||0).toLocaleString("pt-BR"); }catch(e){ return "$"+(n||0); } }

const ROLES = [
  { id:"race_eng",  name:"Engenheiro de Corrida",  affects:["strategy","pace"], baseSalary:[180000, 360000] },
  { id:"aero_eng",  name:"Engenheiro Aerodinâmico", affects:["pace"], baseSalary:[150000, 320000] },
  { id:"pit_crew",  name:"Chefe de Pit",            affects:["pit"], baseSalary:[140000, 300000] },
  { id:"data",      name:"Analista de Dados",       affects:["strategy","tyre"], baseSalary:[120000, 260000] },
  { id:"mech",      name:"Chefe de Mecânicos",      affects:["reliability","pit"], baseSalary:[140000, 300000] },
];

function ensureSystems(state){
  state.staff = state.staff || { hired: [] };
  state.finances = state.finances || { weeklyIncome: 0, weeklyCost: 0, sponsors: [], lastWeekTs: Date.now() };
  state.manager = state.manager || { points:0, risk:20, objective:"", offers:[] };
  state.team = state.team || { money: 0, car: {aero:70,engine:70,chassis:70,reliability:70} };
  return state;
}

function makeCandidate(){
  const r = ROLES[Math.floor(Math.random()*ROLES.length)];
  const skill = rand(62, 92); // qualidade geral
  const pit = clamp(skill + rand(-8, 8), 40, 99);
  const strategy = clamp(skill + rand(-10, 10), 40, 99);
  const tyre = clamp(skill + rand(-10, 10), 40, 99);
  const pace = clamp(skill + rand(-10, 10), 40, 99);
  const reliability = clamp(skill + rand(-10, 10), 40, 99);
  const salary = rand(r.baseSalary[0], r.baseSalary[1]) + (skill*1200);
  return {
    id: "c_"+Math.random().toString(16).slice(2),
    roleId: r.id,
    roleName: r.name,
    name: randomName(),
    skill, pit, strategy, tyre, pace, reliability,
    salary: Math.floor(salary),
    contractWeeks: rand(26, 52),
  };
}

function randomName(){
  const first=["Alex","Bruno","Carlos","Diego","Eduardo","Felipe","Gabriel","Hugo","Ivan","João","Kai","Lucas","Marcos","Nicolas","Otávio","Paulo","Rafael","Sérgio","Thiago","Victor"];
  const last=["Silva","Santos","Oliveira","Souza","Pereira","Costa","Rodrigues","Almeida","Ferreira","Gomes","Miller","Smith","Brown","Rossi","Bianchi","Dubois","Martin","Klein","Schmidt","Lopez"];
  return first[rand(0,first.length-1)]+" "+last[rand(0,last.length-1)];
}

function loadMarket(){
  try{
    const raw = localStorage.getItem(MARKET_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function saveMarket(list){ localStorage.setItem(MARKET_KEY, JSON.stringify(list)); }

function regenMarket(){
  const list = Array.from({length:8}, ()=> makeCandidate());
  saveMarket(list);
  return list;
}

function calcTeamImpact(state){
  const hired = state.staff.hired || [];
  const avg = (key)=>{
    if(!hired.length) return 0;
    return Math.round(hired.reduce((a,s)=>a+(s[key]||0),0)/hired.length);
  };
  // impactos (0-100) derivados dos melhores e média
  const best = (key)=> hired.length ? Math.max(...hired.map(s=>s[key]||0)) : 0;
  return {
    pit: Math.round((avg("pit")*0.6 + best("pit")*0.4)),
    strategy: Math.round((avg("strategy")*0.6 + best("strategy")*0.4)),
    tyre: Math.round((avg("tyre")*0.7 + best("tyre")*0.3)),
    pace: Math.round((avg("pace")*0.7 + best("pace")*0.3)),
    reliability: Math.round((avg("reliability")*0.7 + best("reliability")*0.3)),
  };
}

function updateWeeklyCosts(state){
  const hired = state.staff.hired || [];
  const staffCost = hired.reduce((a,s)=>a+(s.salary||0),0);
  state.finances.weeklyCost = staffCost + sponsorWeeklyCost(state);
}
function sponsorWeeklyCost(state){
  // por enquanto não há custo de patrocínio (é receita)
  return 0;
}

function renderBars(impact){
  const el=document.getElementById("impactBars");
  el.innerHTML="";
  const items=[
    ["Pit Stop","pit"],["Estratégia","strategy"],["Gestão de pneus","tyre"],["Ritmo","pace"],["Confiabilidade","reliability"],
  ];
  items.forEach(([label,key])=>{
    const v=clamp(impact[key]||0,0,100);
    const row=document.createElement("div");
    row.className="bar";
    row.innerHTML=`
      <label>${label}</label>
      <div class="track"><div class="fill" style="width:${v}%"></div></div>
      <div style="text-align:right;font-weight:900;">${v}</div>
    `;
    el.appendChild(row);
  });
}

function renderMarket(state, market){
  const el=document.getElementById("market");
  el.innerHTML="";
  market.forEach(c=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`
      <div>
        <div><b>${c.name}</b> <span class="pill">${c.roleName}</span></div>
        <div class="meta">Skill: ${c.skill} • Salário/semana: ${fmtMoney(c.salary)} • Contrato: ${c.contractWeeks} semanas</div>
      </div>
      <button class="btn btn--primary" data-id="${c.id}">Contratar</button>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id=btn.getAttribute("data-id");
      const c=market.find(x=>x.id===id);
      if(!c) return;

      // dinheiro
      const money = state.team.money ?? 0;
      // custo de contratação (1 semana adiantada)
      if(money < c.salary){
        alert("Dinheiro insuficiente para contratar este profissional (precisa pagar 1 semana adiantada).");
        return;
      }
      // limita por role (1 por função)
      const roleExists = (state.staff.hired||[]).some(h=>h.roleId===c.roleId);
      if(roleExists){
        alert("Você já tem alguém nessa função. Demita antes para contratar outro.");
        return;
      }

      state.team.money = money - c.salary;
      state.staff.hired.push({ ...c, hiredAt: Date.now(), weeksLeft: c.contractWeeks, buyoutPct: 0.35 });
      // remove do mercado
      const newMarket = market.filter(x=>x.id!==id);
      saveMarket(newMarket);
      updateWeeklyCosts(state);
      saveState(state);
      render(state, newMarket);
    });
  });
}

function renderTeam(state){
  const el=document.getElementById("teamList");
  const hired = state.staff.hired || [];
  el.innerHTML="";
  if(!hired.length){
    el.innerHTML = '<div class="hint">Nenhum staff contratado ainda.</div>';
    return;
  }
  hired.forEach((s, idx)=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`
      <div>
        <div><b>${s.name}</b> <span class="pill">${s.roleName}</span></div>
        <div class="meta">Salário/semana: ${fmtMoney(s.salary)} • Semanas restantes: ${s.weeksLeft ?? s.contractWeeks}</div>
      </div>
      <button class="btn" data-fire="${idx}">Demitir</button>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-fire]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i=Number(btn.getAttribute("data-fire"));
      if(!confirm("Tem certeza que deseja demitir?")) return;
      state.staff.hired.splice(i,1);
      updateWeeklyCosts(state);
      saveState(state);
      render(state, loadMarket()||regenMarket());
    });
  });
}

function render(state, market){
  renderTeam(state);
  renderMarket(state, market);
  const impact = calcTeamImpact(state);
  state.staff.impact = impact;
  saveState(state);
  renderBars(impact);
}

document.addEventListener("DOMContentLoaded", ()=>{
  const state = loadState();
  if(!state){ window.location.href="index.html"; return; }
  ensureSystems(state);
  saveState(state);

  let market = loadMarket();
  if(!market || !Array.isArray(market) || market.length<4) market = regenMarket();

  render(state, market);

  document.getElementById("btnRefresh")?.addEventListener("click", ()=>{
    const m = regenMarket();
    render(state, m);
  });
});
