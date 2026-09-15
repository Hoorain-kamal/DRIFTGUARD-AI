// DriftGuard AI - 2D position/velocity Kalman filter with IMU control
class DriftGuardKalman{
 constructor(){this.R0=6371000;this.state=[0,0,0,0];this.P=[[25,0,0,0],[0,25,0,0],[0,0,4,0],[0,0,0,4]];this.refLat=null;this.refLon=null;this.initialized=false;}
 gpsToMeters(lat,lon){const c=Math.cos(this.refLat*Math.PI/180);return {east:(lon-this.refLon)*Math.PI/180*this.R0*c,north:(lat-this.refLat)*Math.PI/180*this.R0};}
 metersToGPS(e,n){const c=Math.max(.1,Math.cos(this.refLat*Math.PI/180));return {latitude:this.refLat+n/this.R0*180/Math.PI,longitude:this.refLon+e/(this.R0*c)*180/Math.PI};}
 predict(dt,ax=0,ay=0){dt=Math.max(.01,Math.min(1,dt));const x=this.state; x[0]+=x[2]*dt+.5*ax*dt*dt;x[1]+=x[3]*dt+.5*ay*dt*dt;x[2]+=ax*dt;x[3]+=ay*dt;const q=2.0*2.0,dt2=dt*dt,dt3=dt2*dt,dt4=dt3*dt;const P=this.P;const F=[[1,0,dt,0],[0,1,0,dt],[0,0,1,0],[0,0,0,1]];const old=P.map(r=>r.slice()),Q=[[q*dt4/4,0,q*dt3/2,0],[0,q*dt4/4,0,q*dt3/2],[q*dt3/2,0,q*dt2,0],[0,q*dt3/2,0,q*dt2]];for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=Q[i][j];for(let k=0;k<4;k++)for(let l=0;l<4;l++)s+=(F[i][k]*old[k][l]*F[j][l]);P[i][j]=s;}}
 updateGPS(lat,lon,accuracy=5){if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;if(!this.initialized){this.refLat=lat;this.refLon=lon;this.state=[0,0,0,0];this.initialized=true;return this.result();}const z=this.gpsToMeters(lat,lon),R=Math.max(1,Math.min(100,Number(accuracy)||5))**2;const y0=z.east-this.state[0],y1=z.north-this.state[1],s0=this.P[0][0]+R,s1=this.P[1][1]+R;const k0=this.P[0][0]/s0,k1=this.P[1][1]/s1;this.state[0]+=k0*y0;this.state[1]+=k1*y1;this.state[2]+=this.P[2][0]/s0*y0;this.state[3]+=this.P[3][1]/s1*y1;this.P[0][0]*=(1-k0);this.P[1][1]*=(1-k1);return this.result();}
 result(){const g=this.metersToGPS(this.state[0],this.state[1]);return {latitude:g.latitude,longitude:g.longitude,eastVelocity:this.state[2],northVelocity:this.state[3],speed:Math.hypot(this.state[2],this.state[3])};}
 reset(lat=null,lon=null){this.state=[0,0,0,0];this.P=[[25,0,0,0],[0,25,0,0],[0,0,4,0],[0,0,0,4]];this.refLat=lat;this.refLon=lon;this.initialized=Number.isFinite(lat)&&Number.isFinite(lon);}
}
window.DriftGuardKalman=DriftGuardKalman;
