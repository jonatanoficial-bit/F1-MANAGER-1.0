const KEY="F1M25_SAVE_V1";
const defs=[
{id:"first_points",t:"Primeiros Pontos",d:"Pontue pela primeira vez",c:s=>s.careerScore>0},
{id:"top_team",t:"Topo da F1",d:"Assuma uma equipe top",c:s=>["redbull","ferrari","mercedes","mclaren"].includes(s.team?.id)},
{id:"survivor",t:"Sobrevivente",d:"Complete uma temporada sem ser demitido",c:s=>s.season?.completed},
{id:"mastermind",t:"Estrategista",d:"Ganhe 50+ pontos na carreira",c:s=>s.careerScore>=50},
];
function load(){try{return JSON.parse(localStorage.getItem(KEY));}catch(e){return null}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function render(){
 const s=ensureSaveOrRedirect(); if(!s) return;
 s.achievements=s.achievements||{};
 const el=document.getElementById("list"); el.innerHTML="";
 defs.forEach(a=>{
  const ok=!!(s.achievements[a.id]||a.c(s));
  if(ok) s.achievements[a.id]=true;
  const div=document.createElement("div");
  div.className="item"+(ok?"":" locked");
  div.innerHTML=`<b>${a.t}</b><div style="opacity:.8">${a.d}</div>`;
  el.appendChild(div);
 });
 save(s);
}
document.addEventListener("DOMContentLoaded",render);