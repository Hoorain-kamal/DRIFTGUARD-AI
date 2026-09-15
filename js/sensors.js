// DriftGuard AI - sensor fusion bridge
const sensorData = {
  accelerationX:0, accelerationY:0, accelerationZ:0,
  rawAccelerationX:0, rawAccelerationY:0, rawAccelerationZ:0,
  gravityX:0, gravityY:0, gravityZ:0,
  alpha:0, beta:0, gamma:0, absoluteHeading:false,
  timestamp:null, status:'Waiting'
};
let gravity = {x:0,y:0,z:0};
let gravityInitialized=false;
const GRAVITY_ALPHA=0.12;
function finite(v){ return Number.isFinite(Number(v)) ? Number(v) : 0; }
window.addEventListener('devicemotion',e=>{
  const a=e.accelerationIncludingGravity;
  if(!a) return;
  const raw={x:finite(a.x),y:finite(a.y),z:finite(a.z)};
  if(!gravityInitialized){ gravity={...raw}; gravityInitialized=true; }
  gravity.x=GRAVITY_ALPHA*raw.x+(1-GRAVITY_ALPHA)*gravity.x;
  gravity.y=GRAVITY_ALPHA*raw.y+(1-GRAVITY_ALPHA)*gravity.y;
  gravity.z=GRAVITY_ALPHA*raw.z+(1-GRAVITY_ALPHA)*gravity.z;
  const linear={x:raw.x-gravity.x,y:raw.y-gravity.y,z:raw.z-gravity.z};
  if(window.isCalibrationRunning) window.collectCalibrationSample(linear.x,linear.y,linear.z);
  const corrected=window.getCalibratedAcceleration(linear.x,linear.y,linear.z).corrected;
  sensorData.rawAccelerationX=raw.x; sensorData.rawAccelerationY=raw.y; sensorData.rawAccelerationZ=raw.z;
  sensorData.gravityX=gravity.x; sensorData.gravityY=gravity.y; sensorData.gravityZ=gravity.z;
  sensorData.accelerationX=corrected.x; sensorData.accelerationY=corrected.y; sensorData.accelerationZ=corrected.z;
  sensorData.timestamp=Date.now(); sensorData.status='Active'; sendSensorUpdate();
});
window.addEventListener('deviceorientation',e=>{
  sensorData.alpha=finite(e.alpha); sensorData.beta=finite(e.beta); sensorData.gamma=finite(e.gamma); sensorData.absoluteHeading=!!e.absolute;
  sensorData.timestamp=Date.now(); if(sensorData.status==='Waiting') sensorData.status='Active'; sendSensorUpdate();
});
function sendSensorUpdate(){ window.sensorData=sensorData; window.dispatchEvent(new CustomEvent('sensorUpdate',{detail:{...sensorData}})); }
window.sensorData=sensorData;
window.simulateAcceleration=(x,y,z)=>{sensorData.accelerationX=finite(x);sensorData.accelerationY=finite(y);sensorData.accelerationZ=finite(z);sensorData.timestamp=Date.now();sensorData.status='Simulated';sendSensorUpdate();};
