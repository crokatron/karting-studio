/* Gravity projected into the screen plane: works in portrait or either landscape. */
(function(root){
 'use strict';
 class TiltSteering{
  constructor(){this.reset();}
  reset(){this.x=null;this.y=null;this.zero=null;this.angle=null;this.steer=0;this.time=0;}
  sample(x,y,time){if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<2)return false;
   this.x=this.x===null?x:this.x*.78+x*.22;this.y=this.y===null?y:this.y*.78+y*.22;
   this.angle=Math.atan2(-this.x,this.y);if(this.zero===null)this.zero=this.angle;
   const delta=Math.atan2(Math.sin(this.angle-this.zero),Math.cos(this.angle-this.zero)),dead=3*Math.PI/180,range=32*Math.PI/180;
   this.steer=Math.sign(delta)*Math.max(0,Math.min(1,(Math.abs(delta)-dead)/(range-dead)));this.time=time;return true;
  }
  calibrate(){if(this.angle===null)return false;this.zero=this.angle;this.steer=0;return true;}
  value(time){return time-this.time<1000?this.steer:0;}
 }
 root.TiltSteering=TiltSteering;if(typeof module!=='undefined')module.exports=TiltSteering;
 if(typeof document==='undefined')return;
 const el=id=>document.getElementById(id),sensor=new TiltSteering();let enabled=false,pending=false,started=0;
 const status=text=>{if(el('tiltStatus').textContent!==text)el('tiltStatus').textContent=text;};
 function draw(){el('tiltToggle').textContent=enabled?'Tilt steering on':'Tilt to steer';el('tiltToggle').setAttribute('aria-pressed',String(enabled));el('tiltToggle').disabled=pending;el('tiltCalibrate').disabled=!enabled;}
 function motion(e){if(!enabled)return;const g=e.accelerationIncludingGravity;if(g&&sensor.sample(g.x,g.y,performance.now()))status('Turn the phone like a wheel.');}
 function stop(text){enabled=false;sensor.reset();window.removeEventListener('devicemotion',motion);draw();status(text);}
 el('tiltToggle').onclick=async()=>{if(enabled){stop('Touch and keyboard steering.');return;}if(pending)return;pending=true;draw();try{
   if(!window.isSecureContext||!window.DeviceMotionEvent)throw Error('Motion steering is unavailable here. Use the steering buttons.');
   if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw Error('Motion permission was declined. Steering buttons still work.');
   sensor.reset();enabled=true;started=performance.now();window.addEventListener('devicemotion',motion);status('Hold the phone upright and steady to centre it…');
  }catch(e){stop(e.message);}finally{pending=false;draw();}};
 el('tiltCalibrate').onclick=()=>{if(enabled&&performance.now()-sensor.time<1000&&sensor.calibrate())status('Centred. Rotate left or right to steer.');else status('Hold the phone upright so its motion can be read.');};
 const reorient=()=>{if(enabled){sensor.reset();started=performance.now();window.YasSimulator?.pause('Phone rotated. Centre the wheel, then resume.');status('Hold steady in the new orientation to centre it…');}};
 window.screen?.orientation?.addEventListener('change',reorient);window.addEventListener('orientationchange',reorient);
 document.addEventListener('visibilitychange',()=>{if(enabled&&document.hidden)sensor.reset();});
 setInterval(()=>{if(!enabled)return;const now=performance.now();if(sensor.angle===null&&now-started>5000)stop('No usable motion data. Hold upright and try again, or use the buttons.');else if(sensor.angle!==null&&now-sensor.time>1000)status('Motion paused — steering buttons still work.');},250);
 root.YasTilt={value:()=>enabled?sensor.value(performance.now()):0,enabled:()=>enabled};draw();
})(typeof window==='undefined'?globalThis:window);
