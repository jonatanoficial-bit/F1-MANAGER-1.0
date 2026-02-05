// Treino Livre com Telemetria (Etapa 21)
const SAVE_KEY="F1M25_SAVE_V1";
let speedMultiplier=1;

function load(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){return null;} }
function save(s){ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }

function setSpeed(v){ speedMultiplier=v; }

function render(){
  const state=load();
  if(!state) return;
  const d1=state.team?.drivers?.[0] || {name:"Piloto 1", pace:75};
  const d2=state.team?.drivers?.[1] || {name:"Piloto 2", pace:73};

  const base=80;
  const t1=(base-(d1.pace||70)*0.1+Math.random()).toFixed(3);
  const t2=(base-(d2.pace||70)*0.1+Math.random()).toFixed(3);

  document.getElementById("car1Data").innerHTML = `
    <b>${d1.name}</b><br/>
    Volta atual: ${t1}s<br/>
    Velocidade média: ${(290+Math.random()*10).toFixed(0)} km/h
  `;
  document.getElementById("car2Data").innerHTML = `
    <b>${d2.name}</b><br/>
    Volta atual: ${t2}s<br/>
    Velocidade média: ${(285+Math.random()*10).toFixed(0)} km/h
  `;
}

setInterval(render, 1500);
