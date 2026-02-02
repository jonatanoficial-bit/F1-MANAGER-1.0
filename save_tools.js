const KEY="F1M25_SAVE_V1";
const box=document.getElementById("box");
document.getElementById("btnExport").onclick=()=>{
 const raw=localStorage.getItem(KEY);
 if(!raw){alert("Nenhum save encontrado");return;}
 box.value=raw;
};
document.getElementById("btnImport").onclick=()=>{
 try{
  const v=box.value.trim();
  if(!v){alert("Cole um save válido");return;}
  JSON.parse(v);
  localStorage.setItem(KEY,v);
  alert("Save importado");
  location.href="lobby.html";
 }catch(e){alert("Save inválido");}
};