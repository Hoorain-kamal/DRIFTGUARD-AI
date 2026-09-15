// DriftGuard AI - IMU Dead Reckoning
// Uses incremental EN displacement. It never re-adds cumulative displacement.
let isDeadReckoningActive=false;
let previousTimestamp=null;
let velocityX=0, velocityY=0, velocityZ=0;
let displacementX=0, displacementY=0, displacementZ=0;
let currentHeading=0;
let currentAccelerationX=0,currentAccelerationY=0,currentAccelerationZ=0;
let lastHeadingSource='orientation';
let originLatitude=null,originLongitude=null;
let latestEstimate={latitude:null,longitude:null};
let stationaryTime=0;
const ACC_THRESHOLD=0.12, MAX_DT=0.25, VELOCITY_DAMPING=0.985;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function startDeadReckoning(lat=null,lon=null,heading=null){
  if(Number.isFinite(lat)) originLatitude=lat;
  if(Number.isFinite(lon)) originLongitude=lon;
  if(Number.isFinite(heading)) currentHeading=(heading+360)%360;
  displacementX=displacementY=displacementZ=0; velocityX=velocityY=velocityZ=0; previousTimestamp=null; stationaryTime=0; isDeadReckoningActive=true;
  if(window.dispatchEvent) window.dispatchEvent(new CustomEvent('drStatus',{detail:{active:true}}));
}
function stopDeadReckoning(){isDeadReckoningActive=false;previousTimestamp=null;velocityX=velocityY=velocityZ=0;displacementX=displacementY=displacementZ=0;stationaryTime=0;if(window.dispatchEvent)window.dispatchEvent(new CustomEvent('drStatus',{detail:{active:false}}));}
function setDROrigin(lat,lon){if(Number.isFinite(lat)&&Number.isFinite(lon)){originLatitude=lat;originLongitude=lon;}}
function headingFromOrientation(alpha){ if(Number.isFinite(alpha)){currentHeading=(alpha+360)%360;lastHeadingSource='orientation';} return currentHeading; }
function rotateBodyToEarth(ax,ay,az,alpha,beta,gamma){
  // DeviceOrientation rotation, Z-X-Y convention, then use horizontal earth axes.
  const A=(alpha||0)*Math.PI/180, B=(beta||0)*Math.PI/180, G=(gamma||0)*Math.PI/180;
  const ca=Math.cos(A),sa=Math.sin(A),cb=Math.cos(B),sb=Math.sin(B),cg=Math.cos(G),sg=Math.sin(G);
  const r11=ca*cg-sa*sb*sg, r12=-ca*sg-sa*sb*cg, r13=-sa*cb;
  const r21=cb*sg, r22=cb*cg, r23=-sb;
  const r31=sa*cg+ca*sb*sg, r32=-sa*sg+ca*sb*cg, r33=ca*cb;
  return {east:r11*ax+r12*ay+r13*az,north:r21*ax+r22*ay+r23*az,up:r31*ax+r32*ay+r33*az};
}
window.addEventListener('sensorUpdate',e=>{
  const d=e.detail||{}; currentAccelerationX=Number(d.accelerationX)||0; currentAccelerationY=Number(d.accelerationY)||0; currentAccelerationZ=Number(d.accelerationZ)||0;
  headingFromOrientation(Number(d.alpha));
  if(!isDeadReckoningActive) return;
  const ts=Number(d.timestamp)||Date.now();
  if(previousTimestamp===null){previousTimestamp=ts;return;}
  const dt=clamp((ts-previousTimestamp)/1000,0.01,MAX_DT); previousTimestamp=ts;
  const w=rotateBodyToEarth(currentAccelerationX,currentAccelerationY,currentAccelerationZ,d.alpha,d.beta,d.gamma);
  let ax=w.east, ay=w.north, az=w.up;
  const mag=Math.hypot(ax,ay,az);
  if(mag<ACC_THRESHOLD){ax=ay=az=0;stationaryTime+=dt;}else stationaryTime=0;
  velocityX+=ax*dt; velocityY+=ay*dt; velocityZ+=az*dt;
  // Blend the latest AI East/North velocity when available. This keeps AI as a swappable predictor.
  const ai=window.DriftGuardAI&&window.DriftGuardAI.lastPrediction;
  if(ai&&Number.isFinite(ai.east)&&Number.isFinite(ai.north)){ velocityX=0.65*velocityX+0.35*ai.east; velocityY=0.65*velocityY+0.35*ai.north; }
  if(stationaryTime>0.35){velocityX*=0.80;velocityY*=0.80;velocityZ*=0.80;if(Math.hypot(velocityX,velocityY)<0.03){velocityX=0;velocityY=0;}}
  velocityX*=VELOCITY_DAMPING;velocityY*=VELOCITY_DAMPING;velocityZ*=VELOCITY_DAMPING;
  const dx=velocityX*dt,dy=velocityY*dt,dz=velocityZ*dt;
  displacementX+=dx;displacementY+=dy;displacementZ+=dz;
  if(originLatitude!==null&&originLongitude!==null){
    const R=6371000,lat0=originLatitude*Math.PI/180;
    latestEstimate.latitude=originLatitude+(displacementY/R)*180/Math.PI;
    latestEstimate.longitude=originLongitude+(displacementX/(R*Math.max(0.1,Math.cos(lat0))))*180/Math.PI;
  }
  window.dispatchEvent(new CustomEvent('deadReckoningUpdate',{detail:{deltaEast:dx,deltaNorth:dy,deltaUp:dz,distanceDelta:Math.hypot(dx,dy),east:displacementX,north:displacementY,up:displacementZ,velocityX,velocityY,velocityZ,heading:currentHeading,headingSource:lastHeadingSource,latitude:latestEstimate.latitude,longitude:latestEstimate.longitude,timestamp:ts}}));
});
window.startDeadReckoning=startDeadReckoning;window.stopDeadReckoning=stopDeadReckoning;window.setDROrigin=setDROrigin;window.getDeadReckoningState=()=>({active:isDeadReckoningActive,velocityX,velocityY,velocityZ,displacementX,displacementY,displacementZ,heading:currentHeading,latitude:latestEstimate.latitude,longitude:latestEstimate.longitude});
console.log('DeadReckoning.js loaded - fixed incremental IMU DR');
