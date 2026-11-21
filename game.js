(() => {
"use strict";
const $ = id => document.getElementById(id);
const startScreen=$("start-screen"), createScreen=$("create-screen"), gameScreen=$("game-screen");
let profile={name:"新同学",grade:"高一",appearance:"boy",hair:"#26334a",uniform:"#e8edf2"};
let game=null;
function show(screen){[startScreen,createScreen,gameScreen].forEach(s=>s.classList.add("hidden"));screen.classList.remove("hidden");}
function drawAvatar(canvas,p){
 const c=canvas.getContext("2d");c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle="#d4e6dc";c.fillRect(0,0,canvas.width,canvas.height);
 c.fillStyle="#bdd7cb";c.beginPath();c.ellipse(90,190,55,12,0,0,Math.PI*2);c.fill();
 c.fillStyle="#24364a";c.fillRect(54,145,72,40);c.fillStyle=p.uniform;c.fillRect(50,105,80,52);
 c.fillStyle="#f0c7a5";c.fillRect(65,48,50,58);c.fillStyle=p.hair;c.fillRect(62,38,56,22);c.fillRect(58,48,12,28);c.fillRect(110,48,12,24);
 if(p.appearance==="girl"){c.fillRect(56,60,10,70);c.fillRect(112,60,10,70);}
 c.fillStyle="#25354a";c.fillRect(76,70,6,5);c.fillRect(99,70,6,5);c.fillStyle="#c77d70";c.fillRect(85,89,12,3);
 c.fillStyle="#dce7ee";c.fillRect(83,108,14,24);c.fillStyle="#597b9a";c.fillRect(86,108,8,23);
}
function updatePreview(){
 profile.name=$("nickname").value.trim()||"新同学";profile.grade=$("grade").value;profile.appearance=$("appearance").value;profile.hair=$("hair").value;profile.uniform=$("uniform").value;
 $("preview-name").textContent=profile.name;drawAvatar($("avatar-preview"),profile);
}
$("start-btn").addEventListener("click",()=>{show(createScreen);updatePreview();});
$("back-start").addEventListener("click",()=>show(startScreen));
["nickname","grade","appearance","hair","uniform"].forEach(id=>$(id).addEventListener("input",updatePreview));
$("create-form").addEventListener("submit",e=>{e.preventDefault();updatePreview();try{localStorage.setItem("kmd-youth-profile",JSON.stringify(profile));}catch(_){}launchGame();});

class IsoCampus{
 constructor(canvas,p){
  this.canvas=canvas;this.ctx=canvas.getContext("2d");this.profile=p;this.tileW=64;this.tileH=32;this.mapW=54;this.mapH=48;
  this.player={x:26,y:24,walk:0,energy:100};this.camera={x:0,y:0};this.keys={};this.joy={x:0,y:0};this.running=false;
  this.last=performance.now();this.elapsed=0;this.dayMinutes=8*60;this.near=null;this.mode="campus";this.currentBuilding=null;this.npcs=[];this.toastTimer=null;
  this.buildWorld();this.installPhase2UI();this.bindControls();this.resize();window.addEventListener("resize",()=>this.resize());
  this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
 }
 buildWorld(){
  this.buildings=[
   {x:6,y:6,w:8,h:6,name:"教学楼",kind:"class",color:"#e5c99d",roof:"#b86f58",room:"教室",desc:"教学楼是校园日常学习的核心区域。"},
   {x:23,y:5,w:8,h:6,name:"图书馆",kind:"library",color:"#e1d2a9",roof:"#82998d",room:"阅览室",desc:"安静的阅览室里摆满了书籍。"},
   {x:39,y:8,w:7,h:6,name:"实验楼",kind:"lab",color:"#c8d8d0",roof:"#688e88",room:"实验室",desc:"这里开展科学实验与社团活动。"},
   {x:5,y:31,w:8,h:6,name:"学生食堂",kind:"food",color:"#edc1a5",roof:"#c77e60",room:"食堂大厅",desc:"可以在这里补充精力。"},
   {x:23,y:34,w:9,h:7,name:"宿舍区",kind:"dorm",color:"#d4c1e2",roof:"#8c77a5",room:"宿舍",desc:"回到宿舍休息，恢复精力。"},
   {x:40,y:31,w:7,h:6,name:"行政楼",kind:"office",color:"#cbd8c8",roof:"#7c9587",room:"办公室",desc:"校园事务与公告发布地点。"}
  ];
  this.areas=[
   {x:16,y:15,w:20,h:17,name:"操场",kind:"field"},
   {x:3,y:17,w:7,h:7,name:"樱花花园",kind:"garden"},
   {x:43,y:17,w:7,h:8,name:"林荫步道",kind:"trees"},
   {x:17,y:4,w:4,h:5,name:"中央喷泉",kind:"fountain"}
  ];
  this.npcs=[
   {x:18,y:24,name:"值日生小林",role:"student",text:"今天的校园很热闹！听说图书馆新到了一批书。",homeX:18,homeY:24,phase:0},
   {x:34,y:22,name:"校园向导",role:"guide",text:"教学楼、图书馆、食堂和宿舍都可以进入。靠近入口后按 E 互动。",homeX:34,homeY:22,phase:1},
   {x:15,y:29,name:"体育委员",role:"student",text:"天气不错！有空来操场跑两圈吧。",homeX:15,homeY:29,phase:2},
   {x:35,y:30,name:"巡逻老师",role:"teacher",text:"记得合理安排学习和休息时间。",homeX:35,homeY:30,phase:3}
  ];
  this.blockers=[];this.rebuildBlockers();
  this.tasks=[{title:"熟悉新校园",desc:"走进校园，拜访一位校园角色。",done:false},{title:"探索校园建筑",desc:"进入任意一栋校园建筑。",done:false},{title:"校园生活体验",desc:"在食堂用餐或在宿舍休息一次。",done:false}];
  this.visited=new Set();
 }
 rebuildBlockers(){
  this.blockers=[];
  if(this.mode==="campus"){
   this.buildings.forEach(b=>this.blockers.push({x:b.x,y:b.y,w:b.w,h:b.h}));
   this.areas.filter(a=>a.kind==="garden"||a.kind==="trees"||a.kind==="fountain").forEach(a=>this.blockers.push({x:a.x,y:a.y,w:a.w,h:a.h}));
  }else{
   this.blockers=[{x:0,y:0,w:18,h:1},{x:0,y:0,w:1,h:14},{x:17,y:0,w:1,h:14},{x:0,y:13,w:7,h:1},{x:11,y:13,w:7,h:1}];
  }
 }
 installPhase2UI(){
  const tag=document.querySelector(".build-tag");if(tag)tag.textContent="PHASE 02 · CAMPUS EXPANSION";
  const mapText=document.querySelector(".modal p");if(mapText)mapText.textContent="校园地图已扩建。靠近建筑入口按 E 进入室内，按 ESC 返回校园。";
  const mini=$("mini-map");if(mini){mini.innerHTML="";mini.style.background="#8eae83";mini.style.display="grid";mini.style.gridTemplateColumns="repeat(3,1fr)";mini.style.gap="5px";mini.style.padding="8px";
   [["教学楼","#c99c76"],["图书馆","#b8b18a"],["实验楼","#8caeaa"],["食堂","#d49b7c"],["宿舍区","#b29bc8"],["行政楼","#9aaf9c"],["操场","#63966d"],["花园","#65946c"],["林荫步道","#477a5c"]].forEach(([n,col])=>{const d=document.createElement("div");d.textContent=n;d.style.cssText=`background:${col};border-radius:6px;display:grid;place-items:center;font-size:10px;color:#fff;min-height:34px`;mini.appendChild(d);});
  }
  const hud=document.querySelector(".hud-left");if(hud&&!$("phase2-task")){const box=document.createElement("div");box.id="phase2-task";box.className="hud-panel";box.innerHTML='<small>校园日常</small><strong style="font-size:13px">新生探索任务</strong><div id="phase2-task-text" style="font-size:10px;color:#d4e2d8;margin-top:6px;line-height:1.5">熟悉新校园</div>';hud.appendChild(box);}
  const controls=document.querySelector(".action-buttons");if(controls&&!$("phase2-task-btn")){const b=document.createElement("button");b.id="phase2-task-btn";b.className="action-btn";b.textContent="任务";b.addEventListener("click",()=>this.showTasks());controls.insertBefore(b,controls.firstChild);}
  const dlg=$("dialog-panel");if(dlg&&!$("dialog-extra")){const x=document.createElement("div");x.id="dialog-extra";x.style.cssText="font-size:11px;color:#9dcbb7;margin-top:7px";dlg.appendChild(x);}
 }
 resize(){const dpr=Math.min(devicePixelRatio||1,2),r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.floor(r.width*dpr));this.canvas.height=Math.max(1,Math.floor(r.height*dpr));this.ctx.setTransform(dpr,0,0,dpr,0,0);this.viewW=r.width;this.viewH=r.height;}
 bindControls(){
  window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();this.keys[k]=true;if(k==="e"||k==="enter")this.interact();if(k==="shift")this.running=true;if(k==="escape"&&this.mode==="interior")this.exitInterior();if(k==="m")$("map-btn").click();},{passive:false});
  window.addEventListener("keyup",e=>{this.keys[e.key.toLowerCase()]=false;if(e.key.toLowerCase()==="shift")this.running=false;});
  $("run-btn").addEventListener("pointerdown",()=>this.running=true);["pointerup","pointercancel","pointerleave"].forEach(ev=>$("run-btn").addEventListener(ev,()=>this.running=false));
  $("interact-btn").addEventListener("click",()=>this.interact());
  const joy=$("joystick"),knob=$("joystick-knob");let active=false;
  const move=e=>{if(!active)return;const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),max=35;if(len>max){dx=dx/len*max;dy=dy/len*max;}knob.style.transform=`translate(${dx}px,${dy}px)`;this.joy={x:dx/max,y:dy/max};};
  joy.addEventListener("pointerdown",e=>{active=true;joy.setPointerCapture(e.pointerId);move(e);});joy.addEventListener("pointermove",move);
  const end=()=>{active=false;this.joy={x:0,y:0};knob.style.transform="translate(0,0)";};joy.addEventListener("pointerup",end);joy.addEventListener("pointercancel",end);
 }
 iso(x,y){return{x:(x-y)*this.tileW/2,y:(x+y)*this.tileH/2};}
 screenToWorld(dx,dy){return{x:(dx/(this.tileW/2)+dy/(this.tileH/2))/2,y:(dy/(this.tileH/2)-dx/(this.tileW/2))/2};}
 blocked(x,y){
  if(this.mode==="campus"&&(x<1||y<1||x>this.mapW-1||y>this.mapH-1))return true;
  if(this.mode==="interior"&&(x<1||y<1||x>17||y>13))return true;
  return this.blockers.some(b=>x>b.x-.18&&x<b.x+b.w+.18&&y>b.y-.18&&y<b.y+b.h+.18);
 }
 update(dt){
  let sx=0,sy=0;if(this.keys.w||this.keys.arrowup)sx-=1,sy-=1;if(this.keys.s||this.keys.arrowdown)sx+=1,sy+=1;if(this.keys.a||this.keys.arrowleft)sx-=1,sy+=1;if(this.keys.d||this.keys.arrowright)sx+=1,sy-=1;
  if(Math.hypot(this.joy.x,this.joy.y)>.12){const v=this.screenToWorld(this.joy.x,this.joy.y);sx=v.x;sy=v.y;}
  const len=Math.hypot(sx,sy);if(len>.01){sx/=len;sy/=len;const speed=(this.running?5.1:3.1)*dt,nx=this.player.x+sx*speed,ny=this.player.y+sy*speed;if(!this.blocked(nx,this.player.y))this.player.x=nx;if(!this.blocked(this.player.x,ny))this.player.y=ny;this.player.walk+=dt*10;if(this.running)this.player.energy=Math.max(0,this.player.energy-dt*1.6);}else this.player.energy=Math.min(100,this.player.energy+dt*.45);
  this.elapsed+=dt;this.dayMinutes=(8*60+Math.floor(this.elapsed*3))%(24*60);
  if(this.mode==="campus")this.npcs.forEach((n,i)=>{n.phase+=dt*.45;n.x=n.homeX+Math.sin(n.phase+i)*.65;n.y=n.homeY+Math.cos(n.phase*.8+i)*.5;});
  const pos=this.iso(this.player.x,this.player.y);this.camera.x=pos.x-this.viewW/2;this.camera.y=pos.y-this.viewH/2+30;
  this.near=this.findNearby();$("energy-meter").style.width=this.player.energy+"%";$("energy-label").textContent=Math.round(this.player.energy);
  $("clock-label").textContent=String(Math.floor(this.dayMinutes/60)).padStart(2,"0")+":"+String(this.dayMinutes%60).padStart(2,"0");
  $("location-label").textContent=this.mode==="interior"?this.currentBuilding.room:(this.near?this.near.name:this.areaName());
  $("hint-label").textContent=this.mode==="interior"?"室内探索 · E 与室内角色/设施互动 · ESC 返回校园":(this.near?`靠近了${this.near.name} · 按 E 或点击互动`:"WASD / 方向键移动，靠近建筑入口按 E 进入");
  this.updateTaskText();
 }
 areaName(){if(this.player.x<15&&this.player.y>27)return"食堂生活区";if(this.player.x>35&&this.player.y>27)return"宿舍生活区";if(this.player.y<14)return"教学活动区";if(this.player.x>35)return"实验活动区";return"中央校园";}
 findNearby(){
  if(this.mode==="interior"){const objs=this.roomObjects();let best=null,dist=1.8;objs.forEach(o=>{const d=Math.hypot(this.player.x-o.x,this.player.y-o.y);if(d<dist){dist=d;best=o;}});return best;}
  let best=null,dist=2.6;
  this.buildings.forEach(b=>{const door={x:b.x+b.w/2,y:b.y+b.h+.7};const d=Math.hypot(this.player.x-door.x,this.player.y-door.y);if(d<dist){dist=d;best={...b,doorX:door.x,doorY:door.y};}});
  this.npcs.forEach(n=>{const d=Math.hypot(this.player.x-n.x,this.player.y-n.y);if(d<1.45&&d<dist){dist=d;best={name:n.name,kind:"npc",desc:n.text,npc:n};}});
  return best;
 }
 roomObjects(){
  const k=this.currentBuilding.kind;
  const common=[{x:9,y:3,name:"室内公告板",kind:"notice",desc:"校园公告：请同学们遵守作息安排，保持公共区域整洁。"}];
  if(k==="class")return [...common,{x:5,y:5,name:"课桌",kind:"desk",desc:"课桌上放着课本和笔记。今天也要认真学习。"} ,{x:13,y:5,name:"黑板",kind:"board",desc:"黑板上写着：认真生活，勇敢追梦。"}];
  if(k==="library")return [...common,{x:5,y:6,name:"书架",kind:"book",desc:"你翻阅了一本校园文学选集，心情平静了下来。"} ,{x:13,y:6,name:"阅览桌",kind:"desk",desc:"找个位置坐下，安静阅读一会儿。"}];
  if(k==="food")return [...common,{x:5,y:6,name:"取餐窗口",kind:"meal",desc:"你吃了一顿热乎的校园餐，精力恢复了。"} ,{x:13,y:6,name:"饮水处",kind:"water",desc:"喝点水，继续校园探索。"}];
  if(k==="dorm")return [...common,{x:5,y:6,name:"宿舍床铺",kind:"rest",desc:"你休息了一会儿，疲惫一扫而空。"} ,{x:13,y:6,name:"个人书桌",kind:"desk",desc:"书桌上摆着课本、台灯和几张照片。"}];
  if(k==="lab")return [...common,{x:5,y:6,name:"实验台",kind:"labwork",desc:"你观察了实验器材，收获了一点新知识。"} ,{x:13,y:6,name:"社团展示墙",kind:"notice",desc:"这里展示着校园科技社团的活动海报。"}];
  return [...common,{x:5,y:6,name:"事务窗口",kind:"notice",desc:"校园事务办理时间：工作日 08:00—17:00。"} ,{x:13,y:6,name:"公告栏",kind:"notice",desc:"本周校园活动：社团招新、运动会筹备。"}];
 }
 interact(){
  if(!this.near){this.showDialog("校园提示","附近没有可互动的目标。请靠近建筑入口、校园人物或室内设施。");return;}
  if(this.mode==="campus"){
   if(this.near.kind==="npc"){this.showDialog(this.near.name,this.near.desc);this.tasks[0].done=true;return;}
   this.enterInterior(this.near);return;
  }
  const o=this.near;let extra="";
  if(o.kind==="meal"||o.kind==="water"){this.player.energy=Math.min(100,this.player.energy+35);this.tasks[2].done=true;extra="精力 +35";}
  if(o.kind==="rest"){this.player.energy=100;this.tasks[2].done=true;extra="精力已恢复至 100";}
  if(o.kind==="book"||o.kind==="desk"||o.kind==="board"||o.kind==="labwork"||o.kind==="notice"){this.player.energy=Math.min(100,this.player.energy+5);}
  this.showDialog(o.name,o.desc,extra);
 }
 enterInterior(b){
  this.currentBuilding=b;this.mode="interior";this.player.x=9;this.player.y=11;this.blockers=[];this.rebuildBlockers();this.tasks[1].done=true;
  this.showDialog(b.room,`你进入了${b.name}。可以在室内自由走动，并与设施互动。按 ESC 返回校园。`);
 }
 exitInterior(){this.mode="campus";const b=this.currentBuilding;this.player.x=b.x+b.w/2;this.player.y=b.y+b.h+1.8;this.currentBuilding=null;this.rebuildBlockers();}
 showDialog(title,text,extra=""){ $("dialog-title").textContent=title;$("dialog-text").textContent=text;const ex=$("dialog-extra");if(ex)ex.textContent=extra;$("dialog-panel").classList.remove("hidden");}
 showTasks(){
  const lines=this.tasks.map((t,i)=>`${t.done?"✓":"○"} ${i+1}. ${t.title}：${t.desc}`).join("\n");
  this.showDialog("新生校园任务",lines,"完成探索、拜访角色、体验生活设施即可推进任务。");
 }
 updateTaskText(){const el=$("phase2-task-text");if(el){const t=this.tasks.find(x=>!x.done);el.textContent=t?t.title:"全部基础任务已完成！";}}
 drawDiamond(x,y,color,stroke=null){const c=this.ctx,w=this.tileW/2,h=this.tileH/2;c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w,y);c.lineTo(x,y+h);c.lineTo(x-w,y);c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}}
 draw(){
  const c=this.ctx,w=this.viewW,h=this.viewH;c.clearRect(0,0,w,h);c.save();c.translate(-this.camera.x,-this.camera.y);
  c.fillStyle=this.mode==="interior"?"#c4aa82":"#789d83";c.fillRect(this.camera.x-100,this.camera.y-100,w+200,h+200);
  if(this.mode==="campus")this.drawCampus();else this.drawInterior();
  c.restore();
 }
 drawCampus(){
  const c=this.ctx;
  for(let sum=0;sum<this.mapW+this.mapH;sum++)for(let x=Math.max(0,sum-this.mapH+1);x<=Math.min(this.mapW-1,sum);x++){const y=sum-x,p=this.iso(x,y);this.drawDiamond(p.x,p.y,((x*7+y*11)%5===0)?"#91b58e":((x+y)%3===0?"#86aa84":"#8daf89"));if((x*13+y*7)%31===0){c.fillStyle="#d5d29a";c.fillRect(p.x-2,p.y-1,3,3);}}
  for(let i=0;i<this.mapW;i++){let p=this.iso(27,i);this.drawDiamond(p.x,p.y,"#c2b99e");p=this.iso(i,25);this.drawDiamond(p.x,p.y,"#c2b99e");}
  this.areas.forEach(a=>{for(let x=a.x;x<a.x+a.w;x++)for(let y=a.y;y<a.y+a.h;y++){const p=this.iso(x,y);let col=a.kind==="field"?"#6f9e76":a.kind==="fountain"?"#75b7bd":"#719b76";this.drawDiamond(p.x,p.y,col);}const p=this.iso(a.x+a.w/2,a.y+a.h/2);c.fillStyle="#f3f1dc";c.font="bold 15px sans-serif";c.textAlign="center";c.fillText(a.name,p.x,p.y);if(a.kind==="garden"||a.kind==="trees"){for(let i=0;i<5;i++){const t=this.iso(a.x+1+(i%3)*2,a.y+1+Math.floor(i/3)*3);this.drawTree(t.x,t.y);}}if(a.kind==="fountain"){c.fillStyle="#5db5c2";c.beginPath();c.arc(p.x,p.y-10,18,0,Math.PI*2);c.fill();}});
  const items=[];this.buildings.forEach(b=>items.push({d:b.x+b.y+b.w+b.h,fn:()=>this.drawBuilding(b)}));this.npcs.forEach(n=>items.push({d:n.x+n.y,fn:()=>this.drawPerson(n.x,n.y,n.role==="teacher"?"#d5dbe4":"#d8c18c","#34445a",n.name,false)}));items.push({d:this.player.x+this.player.y,fn:()=>this.drawPerson(this.player.x,this.player.y,this.profile.uniform,this.profile.hair,this.profile.name,true)});items.sort((a,b)=>a.d-b.d).forEach(i=>i.fn());
 }
 drawInterior(){
  const c=this.ctx;for(let x=0;x<18;x++)for(let y=0;y<14;y++){const p=this.iso(x,y);this.drawDiamond(p.x,p.y,(x+y)%2?"#d6c39d":"#cdb78e");}
  const walls=[this.iso(9,0),this.iso(0,7),this.iso(18,7)];c.strokeStyle="#8b7258";c.lineWidth=8;c.beginPath();c.moveTo(walls[1].x,walls[1].y);c.lineTo(walls[0].x,walls[0].y);c.lineTo(walls[2].x,walls[2].y);c.stroke();
  c.fillStyle="#634d3d";c.font="bold 20px sans-serif";c.textAlign="center";const title=this.iso(9,1);c.fillText(this.currentBuilding.room,title.x,title.y-18);
  const objs=this.roomObjects();objs.forEach(o=>{const p=this.iso(o.x,o.y);c.fillStyle=o.kind==="meal"?"#bd805d":o.kind==="rest"?"#8e7ca8":o.kind==="book"?"#9a7954":"#7d9c91";c.fillRect(p.x-22,p.y-18,44,24);c.fillStyle="#fff";c.font="11px sans-serif";c.fillText(o.name,p.x,p.y-25);});
  this.drawPerson(this.player.x,this.player.y,this.profile.uniform,this.profile.hair,this.profile.name,true);
 }
 drawTree(x,y){const c=this.ctx;c.fillStyle="#705b43";c.fillRect(x-3,y-4,6,18);c.fillStyle="#315f4b";c.beginPath();c.arc(x,y-15,15,0,Math.PI*2);c.fill();c.fillStyle="#4c8060";c.beginPath();c.arc(x-8,y-20,9,0,Math.PI*2);c.fill();}
 drawBuilding(b){
  const c=this.ctx,p=this.iso(b.x+b.w/2,b.y+b.h/2),hw=b.w*this.tileW/2,hh=b.h*this.tileH/2,by=p.y,height=48;
  c.beginPath();c.moveTo(p.x-hw,by);c.lineTo(p.x,by+hh);c.lineTo(p.x+hw,by);c.lineTo(p.x,by-hh);c.closePath();c.fillStyle="#71816e";c.fill();
  c.beginPath();c.moveTo(p.x-hw,by);c.lineTo(p.x,by+hh);c.lineTo(p.x,by+hh+height);c.lineTo(p.x-hw,by+height);c.closePath();c.fillStyle=b.color;c.fill();
  c.beginPath();c.moveTo(p.x+hw,by);c.lineTo(p.x,by+hh);c.lineTo(p.x,by+hh+height);c.lineTo(p.x+hw,by+height);c.closePath();c.fillStyle=this.darken(b.color);c.fill();
  c.beginPath();c.moveTo(p.x,by-hh-height*.5);c.lineTo(p.x+hw,by-height*.5);c.lineTo(p.x,by+hh-height*.5);c.lineTo(p.x-hw,by-height*.5);c.closePath();c.fillStyle=b.roof;c.fill();c.strokeStyle="#604f43";c.lineWidth=2;c.stroke();
  c.fillStyle="#fff8e8";c.font="bold 13px sans-serif";c.textAlign="center";c.fillText(b.name,p.x,by+hh+height+18);
  const door=this.iso(b.x+b.w/2,b.y+b.h+.05);c.fillStyle="#6c4b3d";c.fillRect(door.x-7,door.y-17,14,20);c.fillStyle="#f6e2a5";c.font="10px sans-serif";c.fillText("入口",door.x,door.y+14);
  c.fillStyle="#7899a2";for(let i=0;i<Math.max(2,Math.floor(b.w/2));i++){const xx=p.x-hw+18+i*25;c.fillRect(xx,by+12,9,12);}
 }
 darken(hex){const n=parseInt(hex.slice(1),16),r=Math.max(0,((n>>16)&255)-28),g=Math.max(0,((n>>8)&255)-28),b=Math.max(0,(n&255)-28);return`rgb(${r},${g},${b})`;}
 drawPerson(x,y,shirt,hair,name,isPlayer){const c=this.ctx,p=this.iso(x,y),bob=isPlayer&&Math.sin(this.player.walk*2)>0?2:0;c.fillStyle="#0003";c.beginPath();c.ellipse(p.x,p.y+5,10,5,0,0,Math.PI*2);c.fill();c.fillStyle="#34445a";c.fillRect(p.x-7,p.y-12+bob,6,13);c.fillRect(p.x+1,p.y-12+bob,6,13);c.fillStyle=shirt;c.fillRect(p.x-9,p.y-29+bob,18,18);c.fillStyle="#f0c8a5";c.fillRect(p.x-7,p.y-43+bob,14,14);c.fillStyle=hair;c.fillRect(p.x-8,p.y-46+bob,16,7);c.fillRect(p.x-9,p.y-41+bob,4,7);c.fillStyle="#fff";c.font="10px sans-serif";c.textAlign="center";c.fillText(name.length>7?name.slice(0,7):name,p.x,p.y-53+bob);if(isPlayer){c.strokeStyle="#f5e6a7";c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y-22+bob,15,0,Math.PI*2);c.stroke();}}
 loop(now){const dt=Math.min((now-this.last)/1000,.05);this.last=now;this.update(dt);this.draw();requestAnimationFrame(this.loop);}
 save(){const data={profile:this.profile,player:this.player,elapsed:this.elapsed,mode:this.mode};try{localStorage.setItem("kmd-youth-save",JSON.stringify(data));this.showDialog("保存成功","角色、精力和探索位置已保存在当前设备。");}catch(e){this.showDialog("保存失败","浏览器存储不可用，请检查存储权限。");}}
}
function launchGame(){show(gameScreen);$("hud-name").textContent=profile.name;$("hud-grade").textContent=profile.grade;if(game){game=null;}game=new IsoCampus($("game-canvas"),profile);}
$("dialog-ok").addEventListener("click",()=>$("dialog-panel").classList.add("hidden"));
document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>$(btn.dataset.close).classList.add("hidden")));
$("map-btn").addEventListener("click",()=>$("map-panel").classList.remove("hidden"));
$("settings-btn").addEventListener("click",()=>$("settings-panel").classList.remove("hidden"));
$("save-btn").addEventListener("click",()=>game&&game.save());
$("exit-btn").addEventListener("click",()=>{if(game)game.save();show(startScreen);});
try{const saved=JSON.parse(localStorage.getItem("kmd-youth-profile")||"null");if(saved&&saved.name)profile=saved;}catch(_){}
drawAvatar($("avatar-preview"),profile);
})();