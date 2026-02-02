
// season_end.js — Etapa 4 (ofertas + demissão simples)
const STORAGE_KEY = "F1M25_SAVE_V1";
const CAREER_MODE_KEY = "f1m25_career_mode";

const TEAM_PRESETS = {
  redbull:   { id:"redbull",   name:"Red Bull Racing",    reputation:78, money:35000000, car:{aero:82,engine:86,chassis:80,reliability:78} },
  ferrari:   { id:"ferrari",   name:"Scuderia Ferrari",   reputation:76, money:33000000, car:{aero:80,engine:84,chassis:80,reliability:76} },
  mercedes:  { id:"mercedes",  name:"Mercedes",           reputation:74, money:32000000, car:{aero:79,engine:83,chassis:79,reliability:77} },
  mclaren:   { id:"mclaren",   name:"McLaren",            reputation:68, money:28000000, car:{aero:76,engine:79,chassis:77,reliability:74} },
  aston:     { id:"aston",     name:"Aston Martin",       reputation:62, money:26000000, car:{aero:74,engine:78,chassis:73,reliability:73} },
  alpine:    { id:"alpine",    name:"Alpine",             reputation:58, money:23000000, car:{aero:72,engine:75,chassis:71,reliability:71} },
  racingbulls:{id:"racingbulls",name:"Racing Bulls",      reputation:52, money:20000000, car:{aero:69,engine:72,chassis:68,reliability:70} },
  sauber:    { id:"sauber",    name:"Sauber",             reputation:46, money:18000000, car:{aero:66,engine:70,chassis:65,reliability:68} },
  haas:      { id:"haas",      name:"Haas",               reputation:44, money:17000000, car:{aero:65,engine:69,chassis:64,reliability:66} },
  williams:  { id:"williams",  name:"Williams",           reputation:42, money:16000000, car:{aero:64,engine:68,chassis:63,reliability:66} },
};

function getMode(){
  try{ return localStorage.getItem(CAREER_MODE_KEY) || "free"; }catch(e){ return "free"; }
}

function loadState(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; }
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fmt(n){
  try{ return (n||0).toLocaleString("pt-BR"); }catch(e){ return String(n||0); }
}

function computeDemission(state){
  const mode = state.careerMode || getMode();
  if(mode !== "realistic") return { fired:false };
  const pts = state?.manager?.points || 0;
  const risk = state?.manager?.risk || 0;
  // regra simples inicial: se marcou menos de 5 pontos OU risco acima de 85 => demissão
  if(pts < 5 || risk >= 85){
    return { fired:true, reason: pts < 5 ? "Meta mínima não atingida (pontos insuficientes)." : "Risco interno alto: a diretoria perdeu confiança." };
  }
  return { fired:false };
}

function generateOffers(state){
  const mode = state.careerMode || getMode();
  const curId = state?.team?.id;
  const curRep = TEAM_PRESETS[curId]?.reputation ?? state?.team?.reputation ?? 50;
  const score = state?.careerScore ?? 0;
  const pts = state?.manager?.points ?? 0;

  // "força" baseada em desempenho
  const power = curRep + Math.min(15, Math.floor(score/25)) + Math.min(10, Math.floor(pts/8));
  const all = Object.values(TEAM_PRESETS).filter(t => t.id !== curId);

  // No realista, ofertas tendem a ser melhores conforme power sobe.
  // No livre, ofertas existem mas menos importantes.
  const eligible = all.filter(t => (mode === "realistic" ? t.reputation <= power + 6 : t.reputation <= power + 10));

  // ordenar por reputação desc (melhores primeiro)
  eligible.sort((a,b)=> b.reputation - a.reputation);

  // quantidade de ofertas
  let n = 0;
  if(mode === "realistic"){
    if(power < 55) n = 0;
    else if(power < 65) n = 1;
    else if(power < 75) n = 2;
    else n = 3;
  }else{
    n = 1 + (Math.random() < 0.35 ? 1 : 0);
  }

  const offers = eligible.slice(0, n).map(t => ({
    teamId: t.id,
    teamName: t.name,
    contractYears: 2,
    salaryBonus: Math.floor((t.reputation/100) * 2000000) // bônus simbólico
  }));

  return offers;
}

function applyTeam(state, teamId){
  const preset = TEAM_PRESETS[teamId] || TEAM_PRESETS.redbull;
  const mode = state.careerMode || getMode();
  // dinheiro inicial da nova temporada: base do time + pequeno bônus por score
  const scoreBonus = Math.min(6000000, Math.floor((state.careerScore||0) * 6000));
  state.team = {
    id: preset.id,
    name: preset.name,
    reputation: preset.reputation,
    money: preset.money + scoreBonus + (mode === "free" ? 3000000 : 0),
    car: { ...preset.car }
  };
  state.manager = state.manager || {};
  state.manager.contractYearsLeft = 2;
  state.manager.objective = state.manager.objective || "";
  state.manager.risk = (mode === "realistic" ? 22 : 10);
  state.manager.points = 0;
}

function newSeason(state){
  // incrementa ano e reseta calendário/posição de GP de forma compatível com o seu save atual
  state.season = state.season || {};
  state.season.year = (state.season.year || 2025) + 1;
  // tenta manter o calendário existente, mas reseta índice
  if(typeof state.season.gpIndex === "number") state.season.gpIndex = 0;
  if(typeof state.season.currentGPIndex === "number") state.season.currentGPIndex = 0;
  if(typeof state.season.raceIndex === "number") state.season.raceIndex = 0;

  // limpeza de dados de fim de semana
  state.weekend = null;
  state.lastRace = null;
}

function render(state){
  const year = state?.season?.year || 2025;
  document.getElementById("kYear").textContent = String(year);
  document.getElementById("kTeam").textContent = state?.team?.name || "—";
  document.getElementById("kPts").textContent = fmt(state?.manager?.points || 0);
  document.getElementById("kScore").textContent = fmt(state?.careerScore || 0);

  const statusBox = document.getElementById("statusBox");
  const dem = computeDemission(state);
  // Sponsor line
  try{
    const s = state?.sponsor;
    if(s){
      const ok = (state?.manager?.points||0) >= (s.goalPointsSeason||0);
      const msg = ok ? "Meta do patrocinador cumprida" : "Meta do patrocinador NÃO cumprida";
      document.getElementById("statusBox").innerHTML = (document.getElementById("statusBox").innerHTML || "") + `<br/>Patrocinador: <b>${s.name}</b> — ${msg}`;
    }
  }catch(e){}

if(dem.fired){
    statusBox.innerHTML = `<b class="danger">Você foi demitido.</b> ${dem.reason}<br/>Você pode reiniciar a carreira ou aceitar uma proposta (se existir).`;
  }else{
    statusBox.innerHTML = `Objetivo atual: <b>${state?.manager?.objective || "—"}</b><br/>Você pode continuar ou aceitar uma proposta.`;
  }

  // offers
  const offersEl = document.getElementById("offers");
  offersEl.innerHTML = "";
  const offers = state?.manager?.offers || [];
  if(!offers.length){
    offersEl.innerHTML = `<div class="small">Nenhuma proposta disponível no momento.</div>`;
    return;
  }
  offers.forEach((o, idx)=>{
    const div = document.createElement("div");
    div.className = "offer";
    div.innerHTML = `
      <div>
        <div><b>${o.teamName}</b></div>
        <div class="small">Contrato: ${o.contractYears} anos • Bônus: $${(o.salaryBonus||0).toLocaleString("pt-BR")}</div>
      </div>
      <button class="btn btn--primary" data-offer="${idx}">Aceitar</button>
    `;
    offersEl.appendChild(div);
  });

  offersEl.querySelectorAll("button[data-offer]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.getAttribute("data-offer"));
      const offer = offers[idx];
      if(!offer) return;
      applyTeam(state, offer.teamId);
      newSeason(state);
      // limpa ofertas
      state.manager.offers = [];
      saveState(state);
      window.location.href = "lobby.html";
    });
  });
}

function main(){
  const state = loadState();
  if(!state){ window.location.href = "index.html"; return; }

  // garante que existam ofertas (gera aqui se não tiver)
  if(!state.manager) state.manager = { name:"Manager", points:0, offers:[] };
  if(!Array.isArray(state.manager.offers) || state.manager.offers.length === 0){
    state.manager.offers = generateOffers(state);
    saveState(state);
  }

  render(state);

  document.getElementById("btnStay")?.addEventListener("click", ()=>{
    // continuar na mesma equipe
    newSeason(state);
    // gera novas metas simples
    state.manager.objective = state.manager.objective || "Evoluir a equipe e marcar pontos regularmente";
    // limpa ofertas para próxima avaliação
    state.manager.offers = [];
    saveState(state);
    window.location.href = "lobby.html";
  });

  document.getElementById("btnReset")?.addEventListener("click", ()=>{
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("f1m2025_user_manager");
    localStorage.removeItem("f1m2025_user_team");
    window.location.href = "career_mode.html";
  });
}

document.addEventListener("DOMContentLoaded", main);

try{ applySeasonRegulations(state); }catch(e){}
