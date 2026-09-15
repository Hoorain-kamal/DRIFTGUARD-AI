// DriftGuard AI - optional OSRM map-matching overlay. It never controls navigation.
window.DriftGuardOSRM={points:[],lastMatch:null,busy:false};
window.addEventListener('gpsUpdate',async e=>{
  const d=e.detail;
  if(!d||d.mode==='DriftGuard'||!Number.isFinite(+d.latitude)||!Number.isFinite(+d.longitude)) return;
  const p=[+d.longitude,+d.latitude];
  const a=window.DriftGuardOSRM.points;
  if(!a.length || Math.hypot((p[0]-a[a.length-1][0])*85000,(p[1]-a[a.length-1][1])*111000)>3) a.push(p);
  while(a.length>8) a.shift();
  if(a.length<2 || window.DriftGuardOSRM.busy) return;
  window.DriftGuardOSRM.busy=true;
  try{
    const coords=a.map(x=>x.join(',')).join(';');
    const url=`https://router.project-osrm.org/match/v1/driving/${coords}?overview=full&geometries=geojson&tidy=true`;
    const r=await fetch(url);
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const j=await r.json();
    if(j.code==='Ok'){
      window.DriftGuardOSRM.lastMatch=j;
      window.dispatchEvent(new CustomEvent('osrmMatchUpdate',{detail:j}));
    }
  }catch(err){ console.warn('OSRM map matching unavailable:',err.message); }
  finally{ window.DriftGuardOSRM.busy=false; }
});
