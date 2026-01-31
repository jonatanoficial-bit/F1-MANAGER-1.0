// contracts.js — Etapa 10 (cláusulas + renovação + buyout)
const STORAGE_KEY = "F1M25_SAVE_V1";
function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; } }
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function fmtMoney(n){ try{ return "$"+(n||0).toLocaleString("pt-BR"); }catch(e){ return "$"+(n||0); } }

function ensure(state){
  state.team = state.team || { money: 0, drivers: [] };
  state.team.money = state.team.money ?? 0;
  state.team.drivers = state.team.drivers || [];
  state.staff = state.staff || { hired: [] };
  state.finances = state.finances || { weeklyIncome: 0, weeklyCost: 0, lastWeekTs: Date.now() };
  state.manager = state.manager || { risk: 20 };
  return state;
}

function buyoutCost(entity){
  const weeksLeft = Number(entity.weeksLeft ?? entity.contractWeeks ?? 0);
  const salary = Number(entity.salary || 0);
  const pct = Number(entity.buyoutPct ?? 0.35);
  return Math.floor(Math.max(0, weeksLeft) * salary * pct);
}

function recalcWeeklyCost(state){
  const driverCost = (state.team.drivers||[]).reduce((a,d)=>a+(d.salary||0),0);
  const staffCost  = (state.staff.hired||[]).reduce((a,s)=>a+(s.salary||0),0);
  state.finances.weeklyCost = driverCost + staffCost;
}

let current = null; // { type, index }

function openModal(type, index){
  const state = ensure(loadState());
  current = { type, index };

  let ent = null;
  if(type==="driver") ent = state.team.drivers[index];
  else ent = state.staff.hired[index];

  const modal = document.getElementById("modal");
  const title = document.getElementById("mTitle");
  const sub = document.getElementById("mSub");
  const salary = document.getElementById("mSalary");
  const weeks = document.getElementById("mWeeks");
  const buyout = document.getElementById("mBuyout");
  const sign = document.getElementById("mSign");
  const hint = document.getElementById("mHint");

  title.textContent = "Renovar contrato";
  sub.textContent = `${ent.name} — ${type==="driver" ? "Piloto" : ent.roleName || "Staff"}`;

  salary.value = String(ent.salary || 0);
  weeks.value = String(ent.contractWeeks || 52);
  buyout.value = String(ent.buyoutPct ?? 0.35);
  sign.value = "0";

  const costNow = buyoutCost(ent);
  hint.textContent = `Buyout atual (para demitir antes do fim): ${fmtMoney(costNow)}.`;

  modal.style.display = "flex";
}

function closeModal(){ document.getElementById("modal").style.display="none"; current=null; }

function applyContract(){
  const state = ensure(loadState());
  if(!current) return;

  const weeks = Number(document.getElementById("mWeeks").value);
  const buyoutPct = Number(document.getElementById("mBuyout").value);
  const salary = Math.max(0, Number(document.getElementById("mSalary").value||0));
  const sign = Math.max(0, Number(document.getElementById("mSign").value||0));

  if(state.team.money < sign){
    alert("Dinheiro insuficiente para pagar a assinatura.");
    return;
  }

  let ent;
  if(current.type==="driver") ent = state.team.drivers[current.index];
  else ent = state.staff.hired[current.index];

  state.team.money -= sign;
  ent.salary = Math.floor(salary);
  ent.contractWeeks = weeks;
  ent.weeksLeft = weeks;
  ent.buyoutPct = buyoutPct;
  ent.signedAt = Date.now();

  // moral/estabilidade: renovar reduz risco e aumenta moral
  if(current.type==="driver" && !ent.vacant){
    ent.morale = clamp((ent.morale ?? 70) + 6, 0, 100);
  }
  state.manager.risk = clamp((state.manager.risk ?? 20) - 3, 0, 100);

  recalcWeeklyCost(state);
  saveState(state);
  render();
  closeModal();
  alert("Contrato aplicado!");
}

function fireEntity(type, index){
  const state = ensure(loadState());
  let ent;
  if(type==="driver") ent = state.team.drivers[index];
  else ent = state.staff.hired[index];

  const cost = buyoutCost(ent);
  if(cost > 0){
    if(state.team.money < cost){
      alert("Dinheiro insuficiente para pagar o buyout.");
      return;
    }
    if(!confirm(`Rescindir contrato pagando buyout de ${fmtMoney(cost)}?`)) return;
    state.team.money -= cost;
  }else{
    if(!confirm("Demitir agora?")) return;
  }

  if(type==="driver"){
    // substitui por vaga
    state.team.drivers[index] = { id:"vac_"+Math.random(), name:"Vaga em aberto", rating:60, pace:60, tyre:60, consistency:60, morale:60, salary:0, contractWeeks:0, weeksLeft:0, vacant:true, buyoutPct:0.0 };
  }else{
    state.staff.hired.splice(index,1);
  }

  state.manager.risk = clamp((state.manager.risk ?? 20) + 4, 0, 100); // instabilidade
  recalcWeeklyCost(state);
  saveState(state);
  render();
}

function contractLine(ent){
  const w = Number(ent.weeksLeft ?? ent.contractWeeks ?? 0);
  const pct = Math.round((Number(ent.buyoutPct ?? 0.35))*100);
  return `Salário: ${fmtMoney(ent.salary||0)}/semana • Restante: ${w} semanas • Buyout: ${pct}%`;
}

function renderDrivers(state){
  const el = document.getElementById("drivers");
  el.innerHTML = "";
  const drivers = state.team.drivers || [];
  if(!drivers.length){
    el.innerHTML = '<div class="hint">Sem pilotos no momento.</div>';
    return;
  }
  drivers.forEach((d, i)=>{
    const div = document.createElement("div");
    div.className = "item";
    const warn = (d.weeksLeft ?? 999) <= 8 && !d.vacant ? "<span class='pill' style='border-color:rgba(255,179,179,.35);color:#ffb3b3'>Expirando</span>" : "";
    div.innerHTML = `
      <div>
        <div><b>${d.name}</b> ${warn} <span class="pill">Rating ${d.rating||60}</span></div>
        <div class="meta">${contractLine(d)}</div>
        <div class="meta">Moral: ${d.morale ?? 60} • Ritmo: ${d.pace ?? d.rating ?? 60} • Consistência: ${d.consistency ?? 60}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <button class="btn" data-renew-driver="${i}" ${d.vacant?'disabled':''}>Renovar</button>
        <button class="btn" data-fire-driver="${i}">Rescindir</button>
      </div>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-renew-driver]").forEach(btn=>{
    btn.addEventListener("click", ()=> openModal("driver", Number(btn.getAttribute("data-renew-driver"))));
  });
  el.querySelectorAll("button[data-fire-driver]").forEach(btn=>{
    btn.addEventListener("click", ()=> fireEntity("driver", Number(btn.getAttribute("data-fire-driver"))));
  });
}

function renderStaff(state){
  const el = document.getElementById("staff");
  el.innerHTML = "";
  const hired = state.staff.hired || [];
  if(!hired.length){
    el.innerHTML = '<div class="hint">Nenhum staff contratado.</div>';
    return;
  }
  hired.forEach((s, i)=>{
    const div = document.createElement("div");
    div.className = "item";
    const warn = (s.weeksLeft ?? 999) <= 8 ? "<span class='pill' style='border-color:rgba(255,179,179,.35);color:#ffb3b3'>Expirando</span>" : "";
    div.innerHTML = `
      <div>
        <div><b>${s.name}</b> ${warn} <span class="pill">${s.roleName || "Staff"}</span></div>
        <div class="meta">${contractLine(s)}</div>
        <div class="meta">Skill: ${s.skill ?? 70} • Pit: ${s.pit ?? 70} • Estratégia: ${s.strategy ?? 70}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <button class="btn" data-renew-staff="${i}">Renovar</button>
        <button class="btn" data-fire-staff="${i}">Rescindir</button>
      </div>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-renew-staff]").forEach(btn=>{
    btn.addEventListener("click", ()=> openModal("staff", Number(btn.getAttribute("data-renew-staff"))));
  });
  el.querySelectorAll("button[data-fire-staff]").forEach(btn=>{
    btn.addEventListener("click", ()=> fireEntity("staff", Number(btn.getAttribute("data-fire-staff"))));
  });
}

function render(){
  const state = ensure(loadState());
  recalcWeeklyCost(state);
  saveState(state);
  renderDrivers(state);
  renderStaff(state);
}

document.addEventListener("DOMContentLoaded", ()=>{
  const state = loadState();
  if(!state){ window.location.href="index.html"; return; }
  ensure(state);
  // garante buyoutPct default
  (state.team.drivers||[]).forEach(d=>{ if(d.buyoutPct==null) d.buyoutPct = d.vacant ? 0.0 : 0.35; });
  (state.staff.hired||[]).forEach(s=>{ if(s.buyoutPct==null) s.buyoutPct = 0.35; });
  recalcWeeklyCost(state);
  saveState(state);
  render();

  document.getElementById("mClose")?.addEventListener("click", closeModal);
  document.getElementById("modal")?.addEventListener("click", (e)=>{ if(e.target && e.target.id==="modal") closeModal(); });
  document.getElementById("mApply")?.addEventListener("click", applyContract);
  document.getElementById("btnRecalc")?.addEventListener("click", ()=>{ render(); alert("Custos recalculados."); });
});
