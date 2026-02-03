const SAVE_KEY="F1M25_SAVE_V1";
function save(s){ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

const SCENARIOS=[
  {id:"backmarker_to_points", title:"Do Fundo ao Top 10", tag:"Progressão", desc:"Comece com equipe fraca e marque pontos em 3 corridas.", team:"williams", money:14000000, goal:{points:6, races:3}, reward:{rep:4, money:2500000}},
  {id:"budget_crisis", title:"Crise Financeira", tag:"Finanças", desc:"Feche patrocínio e mantenha saldo positivo por 4 semanas.", team:"haas", money:6000000, goal:{weeksPositive:4}, reward:{rep:3, money:3000000}},
  {id:"driver_rebuild", title:"Reconstrução de Dupla", tag:"Pilotos", desc:"Faça 1 troca de piloto mantendo risco abaixo de 55.", team:"sauber", money:12000000, goal:{riskMax:55, actions:1}, reward:{rep:5, money:2000000}},
  {id:"pressure_cooker", title:"Pressão Máxima", tag:"Mídia", desc:"Responda 3 coletivas sem cair abaixo de 45 de reputação.", team:"alpine", money:16000000, goal:{press:3, repMin:45}, reward:{rep:6, money:1500000}}
];

function activateScenario(sc){
  const st = ensureSaveOrRedirect();
  if(!st) return;
  st.challenge = {
    active:true,
    id: sc.id,
    startedAt: Date.now(),
    team: sc.team,
    goal: sc.goal,
    reward: sc.reward,
    progress: { races:0, points:0, weeksPositive:0, press:0, actions:0 }
  };
  st.team = st.team || {};
  st.team.id = sc.team;
  st.team.name = String(sc.team).toUpperCase();
  st.team.money = sc.money;
  st.careerMode = "challenge";
  st.manager = st.manager || { risk:20, reputation:50 };
  st.manager.risk = clamp(st.manager.risk ?? 20, 0, 100);
  st.manager.reputation = clamp(st.manager.reputation ?? 50, 0, 100);
  try{ localStorage.setItem("f1m2025_user_team", sc.team); }catch(e){}
  save(st);
  alert("Desafio ativado! Indo para o Lobby.");
  location.href = "lobby.html?userTeam="+encodeURIComponent(sc.team);
}

function render(){
  const el=document.getElementById("list");
  el.innerHTML="";
  SCENARIOS.forEach(sc=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <b style="font-size:16px">${sc.title}</b>
          <div class="meta">${sc.desc}</div>
          <div class="meta" style="margin-top:6px">
            <span class="pill">${sc.tag}</span>
            <span class="pill">Equipe: ${sc.team.toUpperCase()}</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn btn--primary" data-start="${sc.id}">Iniciar</button>
        </div>
      </div>
    `;
    el.appendChild(div);
  });

  el.querySelectorAll("button[data-start]").forEach(b=>{
    b.onclick=()=>{
      const id=b.getAttribute("data-start");
      const sc=SCENARIOS.find(x=>x.id===id);
      if(!sc) return;
      if(!confirm("Iniciar este desafio? (Sobrescreve equipe/caixa atuais)")) return;
      activateScenario(sc);
    };
  });
}

document.addEventListener("DOMContentLoaded", render);
