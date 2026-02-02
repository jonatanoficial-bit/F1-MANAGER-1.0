// save_bootstrap.js — garante save mínimo para páginas internas
const SAVE_KEY = "F1M25_SAVE_V1";

function __getTeamFromEnv(){
  let teamId = null;
  try{ teamId = localStorage.getItem("f1m2025_user_team"); }catch(e){}
  if(!teamId){
    try{
      const u = new URL(window.location.href);
      teamId = u.searchParams.get("userTeam");
    }catch(e){}
  }
  return teamId;
}

function ensureSaveOrRedirect(){
  let state = null;
  try{ state = JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){ state = null; }
  if(state) return state;

  const teamId = __getTeamFromEnv();
  if(!teamId){
    window.location.href = "career_mode.html";
    return null;
  }

  state = {
    careerMode: localStorage.getItem("f1m25_career_mode") || "free",
    careerScore: 0,
    season: { year: 2025, gpIndex: 0, calendar: [] },
    manager: { name: "Manager", points: 0, risk: 20, reputation: 50, offers: [] },
    team: {
      id: String(teamId).toLowerCase(),
      name: String(teamId).toUpperCase(),
      money: 18000000,
      car: { aero: 70, engine: 70, chassis: 70, reliability: 70 },
      drivers: [
        { id:"d1", name:"Piloto 1", rating:78, pace:78, tyre:74, consistency:75, morale:70, salary:650000, contractWeeks:52, weeksLeft:52, buyoutPct:0.35 },
        { id:"d2", name:"Piloto 2", rating:76, pace:76, tyre:73, consistency:74, morale:70, salary:600000, contractWeeks:52, weeksLeft:52, buyoutPct:0.35 }
      ]
    },
    staff: { hired: [], impact: {} },
    sponsor: null,
    finances: { weeklyIncome: 0, weeklyCost: 0, lastWeekTs: Date.now() }
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  return state;
}
