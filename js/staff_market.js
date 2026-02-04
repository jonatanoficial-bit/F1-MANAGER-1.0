const SAVE_KEY="F1M25_SAVE_V1";
function load(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){return null;} }
function save(s){ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }

function genStaff(){
  const roles=["Engenheiro de Corrida","Estrategista","Chefe de Mecânicos","Analista de Dados"];
  return Array.from({length:8}).map((_,i)=>({
    id:"staff_"+Date.now()+"_"+i,
    name:"Profissional "+(i+1),
    role:roles[i%roles.length],
    skill:60+Math.floor(Math.random()*30),
    salary:80000+Math.floor(Math.random()*120000)
  }));
}

function render(){
  const state = load();
  if(!state) return;
  state.staffMarket = state.staffMarket || genStaff();
  state.staff = state.staff || [];
  const el = document.getElementById("staffList");
  if(!el) return;
  el.innerHTML = state.staffMarket.map(s=>`
    <div class="card">
      <b>${s.name}</b> — ${s.role}<br/>
      Skill: ${s.skill} • Salário: $${s.salary.toLocaleString()}
      <div style="margin-top:8px">
        <button class="btn btn--primary" onclick="hire('${s.id}')">Contratar</button>
      </div>
    </div>
  `).join("");
  save(state);
}

window.hire = function(id){
  const state = load();
  const idx = state.staffMarket.findIndex(s=>s.id===id);
  if(idx<0) return;
  const s = state.staffMarket.splice(idx,1)[0];
  state.staff.push(s);
  alert("Contratado: "+s.name);
  save(state);
  render();
}

document.addEventListener("DOMContentLoaded", render);
