const KEY="F1M25_SAVE_V1";
const qs=[
{q:"Seu time está acima das expectativas. Como responde?",a:[{t:"Manter foco",rep:2,risk:-2,morale:2},{t:"Cobrar mais",rep:-1,risk:3,morale:-1}]},
{q:"Resultados ruins recentes. O que diz à imprensa?",a:[{t:"Assumir culpa",rep:1,risk:-2,morale:1},{t:"Culpar pilotos",rep:-3,risk:4,morale:-3}]},
{q:"Rumores de demissão. Resposta?",a:[{t:"Confiante",rep:2,risk:-1,morale:1},{t:"Defensivo",rep:-2,risk:2,morale:-1}]}
];
function load(){try{return JSON.parse(localStorage.getItem(KEY));}catch(e){return null}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function render(){
 const st=ensureSaveOrRedirect(); if(!st) return;
 st.manager=st.manager||{risk:20,reputation:50};
 st.manager.reputation=st.manager.reputation??50;
 st.team=st.team||{}; st.team.drivers=st.team.drivers||[];
 const el=document.getElementById("qbox"); el.innerHTML="";
 const q=qs[Math.floor(Math.random()*qs.length)];
 const box=document.createElement("div"); box.className="item";
 box.innerHTML=`<b>${q.q}</b><div class="meta" style="margin-top:6px">Escolha uma resposta:</div>`;
 q.a.forEach(ans=>{
   const b=document.createElement("button");
   b.className="btn"; b.style.marginTop="10px"; b.textContent=ans.t;
   b.onclick=()=>{
     st.manager.reputation=clamp(st.manager.reputation+ans.rep,0,100);
     st.manager.risk=clamp((st.manager.risk||20)+ans.risk,0,100);
     st.team.drivers.forEach(d=>{ if(!d.vacant){ d.morale=clamp((d.morale??70)+ans.morale,0,100);} });
     save(st); alert("Resposta registrada"); location.href="lobby.html";
   };
   box.appendChild(b);
 });
 el.appendChild(box);
}
document.addEventListener("DOMContentLoaded",render);