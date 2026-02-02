// market.js — Etapa 8 (Mercado de pilotos + moral + salários)
const STORAGE_KEY = "F1M25_SAVE_V1";
const MARKET_KEY = "f1m25_driver_market_v1";

function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; } }
function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function fmtMoney(n){ try{ return "$" + (n||0).toLocaleString("pt-BR"); }catch(e){ return "$"+(n||0); } }

const NAME_POOL = [
  "Max Verstappen","Sergio Pérez","Lewis Hamilton","George Russell","Charles Leclerc","Carlos Sainz",
  "Lando Norris","Oscar Piastri","Fernando Alonso","Lance Stroll","Esteban Ocon","Pierre Gasly",
  "Yuki Tsunoda","Daniel Ricciardo","Alexander Albon","Logan Sargeant","Valtteri Bottas","Zhou Guanyu",
  "Nico Hülkenberg","Kevin Magnussen"
];

function ensureSystems(state){
  state.team = state.team || {};
  state.team.money = state.team.money ?? 0;
  state.finances = state.finances || { weeklyIncome: 0, weeklyCost: 0, lastWeekTs: Date.now() };
  state.staff = state.staff || { hired: [], impact: {} };

  state.team.drivers = state.team.drivers || [
    { id:"d1", name:"Piloto 1", rating:78, pace:78, tyre:74, consistency:75, morale:70, salary: 650000, contractWeeks: 52, weeksLeft: 52 },
    { id:"d2", name:"Piloto 2", rating:76, pace:76, tyre:73, consistency:74, morale:70, salary: 600000, contractWeeks: 52, weeksLeft: 52 },
  ];
  return state;
}

function makeDriver(){
  const rating = rand(68, 94);
  const pace = clamp(rating + rand(-6, 6), 45, 99);
  const tyre = clamp(rating + rand(-8, 6), 45, 99);
  const consistency = clamp(rating + rand(-10, 8), 40, 99);
  const morale = rand(55, 85);
  const salary = Math.floor(rand(500000, 1500000) + rating*18000);
  return {
    id: "p_"+Math.random().toString(16).slice(2),
    name: pick(NAME_POOL),
    rating, pace, tyre, consistency, morale,
    salary,
    contractWeeks: rand(26, 104),
  };
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
  const list = Array.from({length:10}, ()=> makeDriver());
  saveMarket(list);
  return list;
}

function recalcDriverCosts(state){
  const driverCost = (state.team.drivers||[]).reduce((a,d)=>a+(d.salary||0),0);
  const staffCost = (state.staff?.hired||[]).reduce((a,s)=>a+(s.salary||0),0);
  state.finances.weeklyCost = staffCost + driverCost;
}

function rosterMorale(state){
  const ds = state.team.drivers || [];
  if(!ds.length) return 0;
  return Math.round(ds.reduce((a,d)=>a+(d.morale||0),0)/ds.length);
}

function renderRoster(state){
  const el=document.getElementById("roster");
  el.innerHTML="";
  (state.team.drivers||[]).forEach((d, idx)=>{
    const moraleTxt = (d.morale||0) < 50 ? "<span class='danger'>Baixa</span>" : "Ok";
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML = `
      <div>
        <div><b>${d.name}</b> <span class="pill">Rating ${d.rating}</span></div>
        <div class="meta">Ritmo: ${d.pace} • Pneus: ${d.tyre} • Consistência: ${d.consistency} • Moral: ${d.morale} (${moraleTxt})</div>
        <div class="meta">Salário/semana: ${fmtMoney(d.salary)} • Semanas restantes: ${d.weeksLeft ?? d.contractWeeks}</div>
      </div>
      <button class="btn" data-fire="${idx}">Demitir</button>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-fire]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i=Number(btn.getAttribute("data-fire"));
      if(!confirm("Demitir piloto? Isso pode afetar a moral.")) return;
      const other = (state.team.drivers||[])[1-i];
      if(other) other.morale = clamp((other.morale||70) - 8, 0, 100);

      state.team.drivers.splice(i,1);
      while((state.team.drivers||[]).length < 2){
        state.team.drivers.push({ id:"vac_"+Math.random(), name:"Vaga em aberto", rating:60, pace:60, tyre:60, consistency:60, morale:60, salary:0, contractWeeks:0, weeksLeft:0, vacant:true });
      }
      recalcDriverCosts(state);
      saveState(state);
      render(state, loadMarket()||regenMarket());
    });
  });

  document.getElementById("kDriverCost").textContent = fmtMoney((state.team.drivers||[]).reduce((a,d)=>a+(d.salary||0),0));
  document.getElementById("kMorale").textContent = String(rosterMorale(state));
}

function renderMarket(state, market){
  const el=document.getElementById("market");
  el.innerHTML="";
  market.forEach(p=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML = `
      <div>
        <div><b>${p.name}</b> <span class="pill">Rating ${p.rating}</span></div>
        <div class="meta">Ritmo: ${p.pace} • Pneus: ${p.tyre} • Consistência: ${p.consistency} • Moral: ${p.morale}</div>
        <div class="meta">Salário/semana: ${fmtMoney(p.salary)} • Contrato: ${p.contractWeeks} semanas</div>
      </div>
      <button class="btn btn--primary" data-hire="${p.id}">Contratar</button>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-hire]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id=btn.getAttribute("data-hire");
      const p=market.find(x=>x.id===id);
      if(!p) return;

      const idxVac = (state.team.drivers||[]).findIndex(d=>d.vacant);
      if(idxVac === -1){
        alert("Sua dupla está completa. Demita um piloto antes.");
        return;
      }

      if((state.team.money||0) < p.salary){
        alert("Dinheiro insuficiente (paga 1 semana adiantada).");
        return;
      }
      state.team.money -= p.salary;

      state.team.drivers[idxVac] = {
        id: p.id, name: p.name, rating:p.rating, pace:p.pace, tyre:p.tyre, consistency:p.consistency,
        morale: p.morale, salary:p.salary, contractWeeks:p.contractWeeks, weeksLeft:p.contractWeeks, buyoutPct: 0.35
      };

      const other = (state.team.drivers||[]).find((d,i)=>i!==idxVac);
      if(other && !other.vacant){
        other.morale = clamp((other.morale||70) + (p.rating>85?4:2), 0, 100);
      }

      const newMarket = market.filter(x=>x.id!==id);
      saveMarket(newMarket);
      recalcDriverCosts(state);
      saveState(state);
      render(state, newMarket);
    });
  });
}

function render(state, market){
  renderRoster(state);
  renderMarket(state, market);
}

document.addEventListener("DOMContentLoaded", ()=>{
  const state = ensureSaveOrRedirect();
  if(!state){ return; }
  ensureSystems(state);
  recalcDriverCosts(state);
  saveState(state);

  let market = loadMarket();
  if(!market || !Array.isArray(market) || market.length<6) market = regenMarket();
  render(state, market);

  document.getElementById("btnRefresh")?.addEventListener("click", ()=>{
    const m = regenMarket();
    render(state, m);
  });
});
