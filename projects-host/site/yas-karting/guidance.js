/* Speed planning for this simulator, not real-world braking instructions. */
(function(root){
 'use strict';
 const Physics=typeof module!=='undefined'?require('./physics.js'):root.KartPhysics;
 const colors={brake:'#ff526a',coast:'#ffd166',accelerate:'#71ef79'};
 function geometry(points,ppm){const n=points.length,ds=[],curvature=[];for(let i=0;i<n;i++){const a=points[(i-3+n)%n],b=points[i],c=points[(i+3)%n],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),ac=Math.hypot(c.x-a.x,c.y-a.y);curvature.push(2*Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/Math.max(.0001,ab*bc*ac)*ppm);const next=points[(i+1)%n];ds.push(Math.max(.05,Math.hypot(next.x-b.x,next.y-b.y)/ppm));}return{points,ds,curvature};}
 function plan(shape,options,temperature,speed,x,y){const {points,ds,curvature}=shape,n=points.length,limits=Physics.limits(options,temperature),brake=limits.braking*.72;const target=curvature.map(k=>Math.min(options.maxSpeed/3.6,Math.sqrt(limits.lateral*.82/Math.max(k,.00001))));
  // Two closed-loop backward passes carry each corner's braking constraint onto its approach.
  for(let pass=0;pass<2;pass++)for(let i=n-1;i>=0;i--)target[i]=Math.min(target[i],Math.sqrt(target[(i+1)%n]**2+2*brake*ds[i]));
  let nearest=0,distance=Infinity;for(let i=0;i<n;i++){const d=(points[i].x-x)**2+(points[i].y-y)**2;if(d<distance){distance=d;nearest=i;}}
  // A full-lap feasible profile keeps distant zones stable, instead of alternating tiny pedal corrections.
  const profile=target.slice();for(let pass=0;pass<2;pass++)for(let i=0;i<n;i++){const next=(i+1)%n;profile[next]=Math.min(profile[next],Math.sqrt(profile[i]**2+2*limits.acceleration*ds[i]));}
  const actions=profile.map((v,i)=>{const a=(profile[(i+1)%n]**2-v*v)/(2*ds[i]);return a<-(.65+v*.07)*.7?'brake':a>.25?'accelerate':'coast';}),predicted=profile.slice();let v=Math.max(0,speed),ahead=0;
  // The near field follows the actual kart speed, not an assumed perfect lap.
  for(let step=0;step<n&&ahead<Math.max(12,speed*.9);step++){const i=(nearest+step)%n,next=(i+1)%n,coast=.65+v*.07,coastV=Math.sqrt(Math.max(0,v*v-2*coast*ds[i])),powerV=Math.sqrt(v*v+2*limits.acceleration*ds[i]);predicted[i]=v;ahead+=ds[i];
   if(coastV>target[next]+.15){actions[i]='brake';v=Math.sqrt(Math.max(0,v*v-2*brake*ds[i]));}
   else if(v<target[next]-.5){actions[i]='accelerate';v=Math.min(target[next],powerV);}
   else{actions[i]='coast';v=coastV;}
  }
  // The near-kart instruction changes immediately with real speed, including overspeed at an apex.
  if(speed>target[nearest]+.35)actions[nearest]='brake';
  return{target,actions,predicted,nearest,distance:Math.sqrt(distance),action:actions[nearest],limits};
 }
 const api={geometry,plan,colors};root.YasGuidance=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
