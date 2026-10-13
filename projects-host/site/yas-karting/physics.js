/* Simplified bicycle model in map units. Shared by both camera views. */
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 class KartPhysics{
  static limits(options,temperature){const grip=(options.wet?.5:1)*options.grip*(.62+.38*clamp(temperature,.1,1));return{grip,lateral:8.8*grip,braking:12*options.brakes*grip,acceleration:6.2*options.power};}
  constructor(road,route,metresPerLap=774){this.road=road;this.route=route;this.ppm=route.lengthPixels/metresPerLap;this.options={power:1,maxSpeed:60,brakes:1,grip:1,wet:false,tyres:'cold'};this.edges=new Map();for(const edge of road.boundaries||[]){const [a,b]=edge;for(let x=Math.floor(Math.min(a.x,b.x)/32);x<=Math.floor(Math.max(a.x,b.x)/32);x++)for(let y=Math.floor(Math.min(a.y,b.y)/32);y<=Math.floor(Math.max(a.y,b.y)/32);y++){const key=x+','+y;if(!this.edges.has(key))this.edges.set(key,[]);this.edges.get(key).push(edge);}}this.reset();}
  reset(){const p=this.route.points[0],q=this.route.points[1];this.state={x:p.x,y:p.y,angle:Math.atan2(q.y-p.y,q.x-p.x),speed:0,steer:0,temperature:this.options.tyres==='warm'?1:.15,time:0,lapTime:0,laps:0,lastLap:null,best:null,gate:1,hits:0,clean:true,reverseWait:0,hitCooldown:0,wrongWay:false};}
  onRoad(x,y){const scale=this.road.collisionScale||1,ix=Math.floor(x*scale),iy=Math.floor(y*scale),w=this.road.width*scale,h=this.road.height*scale;return ix>=0&&iy>=0&&ix<w&&iy<h&&(this.road.collisionMask||this.road.mask)[iy*w+ix]===1;}
  fits(x,y,angle){const c=Math.cos(angle),s=Math.sin(angle);for(const f of [-.4,.4])for(let i=0;i<8;i++){const r=i*Math.PI/4,dx=(f+Math.cos(r)*.42)*this.ppm,dy=Math.sin(r)*.42*this.ppm;if(!this.onRoad(x+dx*c-dy*s,y+dx*s+dy*c))return false;}return true;}
  wallTangent(x,y){let best=Infinity,tangent=null;const cx=Math.floor(x/32),cy=Math.floor(y/32);for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++)for(const [a,b] of this.edges.get(gx+','+gy)||[]){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy;if(!n)continue;const t=clamp(((x-a.x)*dx+(y-a.y)*dy)/n,0,1),d=(x-a.x-t*dx)**2+(y-a.y-t*dy)**2;if(d<best){best=d;const l=Math.sqrt(n);tangent={x:dx/l,y:dy/l};}}return tangent;}
  recover(){const s=this.state,n=Math.max(0,s.gate-1),p=this.route.gates[n],q=this.route.points[(p.index+2)%this.route.points.length];s.x=p.x;s.y=p.y;s.angle=Math.atan2(q.y-p.y,q.x-p.x);s.speed=0;s.clean=false;s.hits++;}
  step(dt,input){const s=this.state,o=this.options,ppm=this.ppm;dt=clamp(dt,0,1/60);s.time+=dt;s.lapTime+=dt;s.hitCooldown=Math.max(0,s.hitCooldown-dt);const v=s.speed/ppm;
   s.temperature=clamp(s.temperature+dt*(Math.abs(v)>3?.0045+.002*Math.abs(s.steer):-.001),.1,1);
   const limits=KartPhysics.limits(o,s.temperature),grip=limits.grip,maxLat=limits.lateral;
   s.steer+=clamp(input.steer-s.steer,-dt*3.2,dt*3.2);
   let acceleration=0;
   if(input.brake){if(v>.12){acceleration=-limits.braking;s.reverseWait=0;}else{s.reverseWait+=dt;acceleration=s.reverseWait>.5?-3.3*o.power:0;}}
   else if(input.throttle){acceleration=limits.acceleration;if(v<0)acceleration=10; s.reverseWait=0;}
   else{s.reverseWait=0;acceleration=-Math.sign(v)*(.65+Math.abs(v)*.07);}
   let nv=v+acceleration*dt;if(!input.throttle&&!input.brake&&Math.sign(nv)!==Math.sign(v))nv=0;if(input.brake&&v>0&&nv<0)nv=0;
   nv=clamp(nv,-2.5,o.maxSpeed/3.6);s.speed=nv*ppm;
   const previousAngle=s.angle,steerAngle=s.steer*.48,desired=nv/1.1*Math.tan(steerAngle),yawLimit=maxLat/Math.max(Math.abs(nv),1);const yaw=clamp(desired,-yawLimit,yawLimit);s.angle+=yaw*dt;if(!this.fits(s.x,s.y,s.angle)&&this.fits(s.x,s.y,previousAngle))s.angle=previousAngle;
   const x=s.x+Math.cos(s.angle)*s.speed*dt,y=s.y+Math.sin(s.angle)*s.speed*dt;
   if(this.fits(x,y,s.angle)){s.x=x;s.y=y;}else{if(Math.abs(s.speed)>ppm*.6&&s.hitCooldown===0){s.hits++;s.clean=false;s.hitCooldown=.5;}const tangent=this.wallTangent(x,y);let slid=false;if(tangent){const along=(x-s.x)*tangent.x+(y-s.y)*tangent.y,tx=s.x+tangent.x*along,ty=s.y+tangent.y*along;if(Math.abs(along)>.0001&&this.fits(tx,ty,s.angle)){const distance=Math.hypot(x-s.x,y-s.y);s.x=tx;s.y=ty;s.speed*=Math.min(1,Math.abs(along)/(distance||1))*.995;slid=true;}}if(!slid)s.speed=0;}
   const target=this.route.gates[s.gate];if(Math.hypot(s.x-target.x,s.y-target.y)<18){s.gate++;if(s.gate===this.route.gates.length){s.laps++;s.lastLap=s.lapTime;if(s.clean)s.best=s.best===null?s.lapTime:Math.min(s.best,s.lapTime);s.lapTime=0;s.gate=1;s.clean=true;}}
   // Nearby ordered route samples establish direction, independent of the camera.
   let nearest=0,distance=Infinity;for(let i=0;i<this.route.points.length;i+=4){const p=this.route.points[i],d=(s.x-p.x)**2+(s.y-p.y)**2;if(d<distance){distance=d;nearest=i;}}
   const p=this.route.points[nearest],q=this.route.points[(nearest+4)%this.route.points.length];s.wrongWay=nv>1&&Math.cos(s.angle)*(q.x-p.x)+Math.sin(s.angle)*(q.y-p.y)<0;
   s.grip=grip;s.sliding=Math.abs(desired)>yawLimit*1.15&&nv>3;return s;
  }
 }
 root.KartPhysics=KartPhysics;if(typeof module!=='undefined')module.exports=KartPhysics;
})(typeof window==='undefined'?globalThis:window);
