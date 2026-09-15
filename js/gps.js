// DriftGuard AI - GPS + Kalman + DR controller
let lastGPSUpdate=null,previousLatitude=null,previousLongitude=null,previousTime=null;
const kalmanFilter=new DriftGuardKalman(); let driftGuardMode=false,simulatedGpsLoss=false,lastGpsPosition=null,estimatedLatitude=null,estimatedLongitude=null,lastKnownSpeed=0,lastHeading=0,driftGuardStartTime=null,deadReckoningData=null;
let lastDRTimestamp=null,latestWorldAx=0,latestWorldAy=0;
let gpsData={latitude:null,longitude:null,speed:0,accuracy:null,timestamp:null,status:'Waiting',mode:'GPS'};
function calculateDistance(a,b,c,d){const R=6371000,p1=a*Math.PI/180,p2=c*Math.PI/180,dp=(c-a)*Math.PI/180,dl=(d-b)*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function calculateBearing(a,b,c,d){const p1=a*Math.PI/180,p2=c*Math.PI/180,dl=(d-b)*Math.PI/180;return (Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*180/Math.PI+360)%360;}
function updateDisplay(){const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('latitude',gpsData.latitude!=null?Number(gpsData.latitude).toFixed(6):'--');set('longitude',gpsData.longitude!=null?Number(gpsData.longitude).toFixed(6):'--');set('speed',(Number(gpsData.speed)||0).toFixed(2)+' m/s');set('accuracy',gpsData.accuracy!=null?Number(gpsData.accuracy).toFixed(1)+' meters':'--');set('status',gpsData.status);set('mode',gpsData.mode);if(gpsData.timestamp)set('lastUpdate',new Date(gpsData.timestamp).toLocaleTimeString());}
function sendGpsUpdate(){window.gpsData=gpsData;window.dispatchEvent(new CustomEvent('gpsUpdate',{detail:{...gpsData}}));}
function enterDriftGuard(){if(!lastGpsPosition||driftGuardMode)return;driftGuardMode=true;driftGuardStartTime=Date.now();estimatedLatitude=lastGpsPosition.latitude;estimatedLongitude=lastGpsPosition.longitude;lastDRTimestamp=null;window.setDROrigin(estimatedLatitude,estimatedLongitude,lastHeading);window.startDeadReckoning(estimatedLatitude,estimatedLongitude,lastHeading);gpsData.status='GPS Lost';gpsData.mode='DriftGuard';updateDisplay();sendGpsUpdate();window.setDriftGuardNavigation&&window.setDriftGuardNavigation();}
window.addEventListener('deadReckoningUpdate',e=>{
  const d=e.detail||{};
  deadReckoningData=d;
  if(!driftGuardMode||!Number.isFinite(d.latitude)||!Number.isFinite(d.longitude)) return;
  estimatedLatitude=d.latitude;
  estimatedLongitude=d.longitude;
  const now=Number(d.timestamp)||Date.now();
  lastDRTimestamp=now;
  const speed=Math.hypot(Number(d.velocityX)||0,Number(d.velocityY)||0);
  gpsData={latitude:estimatedLatitude,longitude:estimatedLongitude,speed,accuracy:null,timestamp:now,status:'GPS Lost',mode:'DriftGuard',distanceDelta:Number(d.distanceDelta)||0,heading:d.heading};
  updateDisplay();
  sendGpsUpdate();
});

window.addEventListener('sensorUpdate',e=>{const d=e.detail||{}; const A=(Number(d.alpha)||0)*Math.PI/180,B=(Number(d.beta)||0)*Math.PI/180,G=(Number(d.gamma)||0)*Math.PI/180; const ca=Math.cos(A),sa=Math.sin(A),cb=Math.cos(B),sb=Math.sin(B),cg=Math.cos(G),sg=Math.sin(G); const r11=ca*cg-sa*sb*sg,r12=-ca*sg-sa*sb*cg,r21=cb*sg,r22=cb*cg; latestWorldAx=r11*(Number(d.accelerationX)||0)+r12*(Number(d.accelerationY)||0); latestWorldAy=r21*(Number(d.accelerationX)||0)+r22*(Number(d.accelerationY)||0); if(Number.isFinite(d.alpha)&&!driftGuardMode) lastHeading=(Number(d.alpha)+360)%360; });
let lastSensorInputAt=0;
window.addEventListener('sensorUpdate',()=>{lastSensorInputAt=Date.now();});
let demoMotionTimer=null;
function startDemoMotion(){
  if(demoMotionTimer) return;
  let phase=0;
  demoMotionTimer=setInterval(()=>{
    phase+=0.1;
    // Deterministic prototype motion: forward acceleration with small variation.
    const ax=0.75+0.15*Math.sin(phase);
    window.simulateAcceleration&&window.simulateAcceleration(ax,0,0);
  },100);
  console.log('DriftGuard DEMO MOTION started');
}
function stopDemoMotion(){if(demoMotionTimer){clearInterval(demoMotionTimer);demoMotionTimer=null;console.log('DriftGuard DEMO MOTION stopped');}}
window.startDemoMotion=startDemoMotion;
window.stopDemoMotion=stopDemoMotion;
const simBtn=document.getElementById('simulateGpsLoss');
if(simBtn){simBtn.addEventListener('click',()=>{setTimeout(()=>{if(driftGuardMode && Date.now()-lastSensorInputAt>1000) startDemoMotion();},350);});}
const recBtn=document.getElementById('recoverGps');
if(recBtn)recBtn.addEventListener('click',stopDemoMotion);

function onGPSPosition(lat,lon,speed,accuracy,time){const moving=previousLatitude!=null&&calculateDistance(previousLatitude,previousLongitude,lat,lon)>1; if(moving)lastHeading=calculateBearing(previousLatitude,previousLongitude,lat,lon);previousLatitude=lat;previousLongitude=lon;previousTime=time;lastGpsPosition={latitude:lat,longitude:lon};lastKnownSpeed=Number(speed)||0;lastGPSUpdate=time;if(driftGuardMode){driftGuardMode=false;window.stopDeadReckoning();kalmanFilter.reset(lat,lon);estimatedLatitude=lat;estimatedLongitude=lon;driftGuardStartTime=null;lastDRTimestamp=null;}const k=kalmanFilter.updateGPS(lat,lon,accuracy);gpsData={latitude:k.latitude,longitude:k.longitude,speed:Number(speed)||k.speed,accuracy:Number.isFinite(accuracy)?accuracy:null,timestamp:time,status:'Active',mode:'GPS'};estimatedLatitude=lat;estimatedLongitude=lon;updateDisplay();sendGpsUpdate();window.setGPSNavigation&&window.setGPSNavigation();}
function startGPS(){if(!navigator.geolocation){const s=document.getElementById('status');if(s)s.textContent='GPS not supported';return;}navigator.geolocation.watchPosition(pos=>{if(simulatedGpsLoss)return;onGPSPosition(pos.coords.latitude,pos.coords.longitude,pos.coords.speed||0,pos.coords.accuracy||5,pos.timestamp||Date.now());},err=>{console.warn('GPS error',err);},{enableHighAccuracy:true,maximumAge:1000,timeout:10000});}
const sim=document.getElementById('simulateGpsLoss');if(sim)sim.addEventListener('click',()=>{if(!lastGpsPosition){alert('Waiting for GPS position...');return;}simulatedGpsLoss=true;enterDriftGuard();});
const rec=document.getElementById('recoverGps');if(rec)rec.addEventListener('click',()=>{simulatedGpsLoss=false;if(lastGpsPosition){kalmanFilter.reset(lastGpsPosition.latitude,lastGpsPosition.longitude);estimatedLatitude=lastGpsPosition.latitude;estimatedLongitude=lastGpsPosition.longitude;}driftGuardMode=false;window.stopDeadReckoning();lastGPSUpdate=Date.now();gpsData={...gpsData,latitude:estimatedLatitude,longitude:estimatedLongitude,status:'GPS Active',mode:'GPS',timestamp:Date.now()};updateDisplay();sendGpsUpdate();window.setGPSNavigation&&window.setGPSNavigation();});
setInterval(()=>{if(!driftGuardMode&&lastGPSUpdate!=null&&(Date.now()-lastGPSUpdate)>10000)enterDriftGuard();},1000);startGPS();window.getGPSState=()=>({driftGuardMode,simulatedGpsLoss,lastGpsPosition,estimatedLatitude,estimatedLongitude,lastKnownSpeed,lastHeading});
