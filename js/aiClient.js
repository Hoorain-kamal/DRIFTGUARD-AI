// DriftGuard AI inference adapter. Local fallback keeps the prototype usable when no Python server is running.
window.DriftGuardAI={enabled:true,remoteEnabled:false,provider:'local-fallback',lastPrediction:{east:0,north:0},server:'http://127.0.0.1:5000/predict'};
let aiBusy=false;
function fallbackPrediction(d){
  const a=Math.hypot(Number(d.accelerationX)||0,Number(d.accelerationY)||0,Number(d.accelerationZ)||0);
  const speed=Math.min(12,a*2.5);
  const h=(Number(d.alpha)||0)*Math.PI/180;
  return {east:speed*Math.sin(h),north:speed*Math.cos(h),source:'local-fallback'};
}
async function requestAIPrediction(d){
  const local=fallbackPrediction(d);
  DriftGuardAI.lastPrediction=local;
  if(!DriftGuardAI.remoteEnabled||aiBusy) return local;
  aiBusy=true;
  try{
    const r=await fetch(DriftGuardAI.server,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accelerationX:d.accelerationX,accelerationY:d.accelerationY,accelerationZ:d.accelerationZ,alpha:d.alpha,beta:d.beta,gamma:d.gamma,timestamp:d.timestamp})});
    if(r.ok){const j=await r.json();if(Number.isFinite(j.east)&&Number.isFinite(j.north)){DriftGuardAI.lastPrediction={east:j.east,north:j.north,source:'sklearn'};DriftGuardAI.provider='sklearn';}}
    else console.warn('AI server unavailable:',r.status);
  }catch(e){console.warn('AI server unavailable; using local fallback');}
  finally{aiBusy=false;}
  return DriftGuardAI.lastPrediction;
}
window.enableRemoteAI=()=>{DriftGuardAI.remoteEnabled=true;DriftGuardAI.provider='remote-pending';};
window.disableRemoteAI=()=>{DriftGuardAI.remoteEnabled=false;DriftGuardAI.provider='local-fallback';};
window.addEventListener('sensorUpdate',e=>{if(window.getGPSState&&window.getGPSState().driftGuardMode) requestAIPrediction(e.detail);});
