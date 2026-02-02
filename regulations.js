// regulations.js — mudanças simples por temporada
function applySeasonRegulations(state){
  state.regulations = state.regulations || { aero:0, engine:0 };
  // random small changes
  const da = Math.floor(Math.random()*7)-3;
  const de = Math.floor(Math.random()*7)-3;
  state.regulations.aero = da;
  state.regulations.engine = de;
  // apply to car baseline
  if(state.team?.car){
    state.team.car.aero = Math.max(50, state.team.car.aero + da);
    state.team.car.engine = Math.max(50, state.team.car.engine + de);
  }
}
window.applySeasonRegulations = applySeasonRegulations;