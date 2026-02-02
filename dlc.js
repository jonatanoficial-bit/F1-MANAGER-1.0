const DLC_KEY="F1M25_DLC";
async function loadConfig(){
  const res=await fetch("dlc/config.json");
  return res.json();
}
function loadState(){try{return JSON.parse(localStorage.getItem(DLC_KEY))||{};}catch(e){return {}}}
function saveState(s){localStorage.setItem(DLC_KEY,JSON.stringify(s))}
async function render(){
  const el=document.getElementById("list");
  const cfg=await loadConfig();
  const st=ensureSaveOrRedirect();
  el.innerHTML="";
  cfg.dlc.forEach(d=>{
    const enabled=!!st[d.id];
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<div><b>${d.name}</b><div style="opacity:.7">ID: ${d.id}</div></div>
    <div><span class="badge">${enabled?"ATIVO":"INATIVO"}</span></div>`;
    div.onclick=()=>{
      st[d.id]=!enabled;
      saveState(st);
      render();
    };
    el.appendChild(div);
  });
}
document.addEventListener("DOMContentLoaded",render);