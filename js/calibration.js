// DriftGuard AI - robust stationary calibration
let calibrationSamples = [];
let calibrationOffset = { x: 0, y: 0, z: 0 };
let isCalibrated = false;
let isCalibrationRunning = false;
const CALIBRATION_SAMPLE_COUNT = 100;

function startCalibration() {
  calibrationSamples = [];
  isCalibrated = false;
  isCalibrationRunning = true;
  if (window.setCalibrationStatus) window.setCalibrationStatus('Calibrating — keep phone still');
  else alert('Calibration started. Keep the phone still.');
}
function collectCalibrationSample(x, y, z) {
  if (!isCalibrationRunning || calibrationSamples.length >= CALIBRATION_SAMPLE_COUNT) return;
  calibrationSamples.push({x:+x||0,y:+y||0,z:+z||0});
  if (calibrationSamples.length === CALIBRATION_SAMPLE_COUNT) calculateCalibrationOffset();
}
function calculateCalibrationOffset() {
  const n = calibrationSamples.length || 1;
  calibrationOffset = calibrationSamples.reduce((a,s)=>({x:a.x+s.x,y:a.y+s.y,z:a.z+s.z}),{x:0,y:0,z:0});
  calibrationOffset.x/=n; calibrationOffset.y/=n; calibrationOffset.z/=n;
  isCalibrated = true; isCalibrationRunning = false;
  if (window.setCalibrationStatus) window.setCalibrationStatus('Calibration complete');
  console.log('DriftGuard calibration:', calibrationOffset);
}
function removeSensorOffset(x,y,z){
  return {x:(+x||0)-calibrationOffset.x,y:(+y||0)-calibrationOffset.y,z:(+z||0)-calibrationOffset.z};
}
function getCalibratedAcceleration(x,y,z){
  return {raw:{x,y,z},corrected:removeSensorOffset(x,y,z),normalized:null};
}
window.startCalibration=startCalibration;
window.isCalibrationRunning=false;
Object.defineProperty(window,'isCalibrationRunning',{get:()=>isCalibrationRunning});
window.collectCalibrationSample=collectCalibrationSample;
window.getCalibratedAcceleration=getCalibratedAcceleration;
