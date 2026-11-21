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

class TopDownCampus{
 constructor(canvas,p){
  this.canvas=canvas;this.ctx=canvas.getContext("2d");this.profile=p;this.tileW=42;this.tileH=42;this.mapW=88;this.mapH=82;
  this.player={x:42,y:73,walk:0,energy:100};this.camera={x:0,y:0};this.keys={};this.joy={x:0,y:0};this.running=false;
  this.last=performance.now();this.elapsed=0;this.dayMinutes=8*60;this.near=null;this.mode="campus";this.currentBuilding=null;this.npcs=[];this.toastTimer=null;
  this.buildWorld();this.installPhase2UI();this.bindControls();this.resize();window.addEventListener("resize",()=>this.resize());
  this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
 }
 buildWorld(){
  // 校园正俯视布局：建筑名称与功能来自用户此前提供的校园资料。
  this.buildings=[
   {x:7,y:8,w:12,h:9,name:"文渊馆",kind:"library",color:"#e8d8b8",roof:"#8d9f83",room:"图书阅览室",desc:"图书馆 · 藏书阅览、自习学习"},
   {x:29,y:8,w:10,h:8,name:"行知楼 A",kind:"class",color:"#e5d0aa",roof:"#b87961",room:"高一教学楼",desc:"高一教学区 · 普通教室"},
   {x:43,y:8,w:10,h:8,name:"行知楼 B",kind:"class",color:"#e5d0aa",roof:"#bd8068",room:"高一教学楼",desc:"高一教学区 · 普通教室"},
   {x:65,y:8,w:12,h:9,name:"格物楼",kind:"lab",color:"#cbded8",roof:"#648f88",room:"实验教学区",desc:"实验楼 · 科学实验与实践活动"},
   {x:7,y:24,w:12,h:8,name:"杏坛报告厅",kind:"auditorium",color:"#e6d5c8",roof:"#986c70",room:"报告厅",desc:"报告厅 · 集会、讲座与校园活动"},
   {x:29,y:21,w:10,h:8,name:"省身楼 A",kind:"class",color:"#e5d0aa",roof:"#b87961",room:"高二教学楼",desc:"高二教学区 · 普通教室"},
   {x:43,y:21,w:10,h:8,name:"省身楼 B",kind:"class",color:"#e5d0aa",roof:"#bd8068",room:"高二教学楼",desc:"高二教学区 · 普通教室"},
   {x:65,y:24,w:12,h:8,name:"树人楼",kind:"office",color:"#d4dfd0",roof:"#779384",room:"政教处",desc:"政教处 · 学生事务与校园管理"},
   {x:7,y:39,w:10,h:7,name:"求实楼",kind:"bath",color:"#d2e3e3",roof:"#6e9da0",room:"澡堂",desc:"澡堂 · 洗浴与生活服务"},
   {x:29,y:34,w:10,h:8,name:"海粟楼 A",kind:"class",color:"#e5d0aa",roof:"#b87961",room:"高三教学楼",desc:"高三教学区 · 普通教室"},
   {x:43,y:34,w:10,h:8,name:"海粟楼 B",kind:"class",color:"#e5d0aa",roof:"#bd8068",room:"高三教学楼",desc:"高三教学区 · 普通教室"},
   {x:65,y:39,w:12,h:8,name:"思源餐厅",kind:"food",color:"#edc7a9",roof:"#c6815f",room:"学生餐厅",desc:"学生餐厅 · 就餐与补充精力"},
   {x:7,y:52,w:12,h:8,name:"弘远楼",kind:"dorm",color:"#d9cbe4",roof:"#8c78a3",room:"宿舍生活区",desc:"宿舍区 · 学生住宿与生活"},
   {x:29,y:48,w:10,h:8,name:"弘毅楼 A",kind:"dorm",color:"#d9cbe4",roof:"#8c78a3",room:"男生宿舍",desc:"男生宿舍 · 学生住宿"},
   {x:43,y:48,w:10,h:8,name:"弘毅楼 B",kind:"dorm",color:"#d9cbe4",roof:"#927ea9",room:"男生宿舍",desc:"男生宿舍 · 学生住宿"},
   {x:57,y:52,w:10,h:8,name:"弘德楼 A",kind:"dorm",color:"#e3d1e6",roof:"#a184ad",room:"女生宿舍",desc:"女生宿舍 · 学生住宿"},
   {x:70,y:52,w:10,h:8,name:"弘德楼 B",kind:"dorm",color:"#e3d1e6",roof:"#a184ad",room:"女生宿舍",desc:"女生宿舍 · 学生住宿"},
   {x:55,y:66,w:15,h:8,name:"艺体中心",kind:"arts",color:"#d3dedb",roof:"#668b8d",room:"体育与艺术活动区",desc:"艺体中心 · 体育训练与艺术活动"}
  ];
  this.areas=[
   {x:23,y:15,w:38,h:4,name:"教学区主路",kind:"road"},
   {x:22,y:30,w:40,h:4,name:"校园中轴道路",kind:"road"},
   {x:21,y:44,w:41,h:3,name:"生活区道路",kind:"road"},
   {x:22,y:22,w:39,h:7,name:"青春广场",kind:"plaza"},
   {x:22,y:36,w:39,h:7,name:"中央活动广场",kind:"plaza"},
   {x:21,y:62,w:33,h:10,name:"操场",kind:"field"},
   {x:38,y:69,w:10,h:3,name:"操场看台",kind:"stands"},
   {x:33,y:4,w:18,h:3,name:"校园林荫道",kind:"trees"},
   {x:37,y:75,w:10,h:3,name:"校园大门",kind:"gate"},
   {x:19,y:68,w:2,h:5,name:"电话亭西排",kind:"booths"},
   {x:62,y:68,w:2,h:5,name:"电话亭东排",kind:"booths"}
  ];
  this.npcs=[
   {x:25,y:25,name:"校园向导",role:"guide",text:"欢迎来到峰峰一中！你可以探索教学区、生活区和操场。",homeX:25,homeY:25,phase:0},
   {x:58,y:25,name:"值日生小林",role:"student",text:"文渊馆适合安静自习，格物楼里有实验室。",homeX:58,homeY:25,phase:1},
   {x:25,y:46,name:"体育委员",role:"student",text:"操场就在校园南侧，欢迎来运动！",homeX:25,homeY:46,phase:2},
   {x:58,y:46,name:"巡逻老师",role:"teacher",text:"合理安排学习和休息，保持校园整洁。",homeX:58,homeY:46,phase:3}
  ];
  this.blockers=[];this.rebuildBlockers();
  this.tasks=[
   {title:"熟悉新校园",desc:"找到校园向导并与其交谈。",done:false},
   {title:"探索教学区",desc:"进入一栋教学楼或实验楼。",done:false},
   {title:"校园生活体验",desc:"前往思源餐厅用餐或回宿舍休息。",done:false},
   {title:"操场打卡",desc:"前往操场中央，完成一次校园探索。",done:false}
  ];
  this.visited=new Set();
 }
 rebuildBlockers(){
  this.blockers=[];
  if(this.mode==="campus"){
   this.buildings.forEach(b=>this.blockers.push({x:b.x,y:b.y,w:b.w,h:b.h}));
   this.areas.filter(a=>a.kind==="trees"||a.kind==="stands"||a.kind==="booths").forEach(a=>this.blockers.push({x:a.x,y:a.y,w:a.w,h:a.h}));
  }else{
   this.blockers=[{x:0,y:0,w:18,h:1},{x:0,y:0,w:1,h:14},{x:17,y:0,w:1,h:14},{x:0,y:13,w:7,h:1},{x:11,y:13,w:7,h:1}];
  }
 }
 installPhase2UI(){
  const tag=document.querySelector(".build-tag");if(tag)tag.textContent="PHASE 02 · CAMPUS EXPANSION";
  const mapText=document.querySelector(".modal p");if(mapText)mapText.textContent="校园地图已扩建。靠近建筑入口按 E 进入室内，按 ESC 返回校园。";
  const mini=$("mini-map");if(mini){mini.innerHTML="";mini.style.background="#8eae83";mini.style.display="grid";mini.style.gridTemplateColumns="repeat(3,1fr)";mini.style.gap="5px";mini.style.padding="8px";
   [["文渊馆","#8d9f83"],["格物楼","#648f88"],["行知楼·高一","#b87961"],["省身楼·高二","#b87961"],["海粟楼·高三","#b87961"],["杏坛报告厅","#986c70"],["树人楼·政教处","#779384"],["思源餐厅","#c6815f"],["求实楼·澡堂","#6e9da0"],["弘远楼·宿舍","#8c78a3"],["弘毅楼·男宿","#8c78a3"],["弘德楼·女宿","#a184ad"],["艺体中心","#668b8d"],["操场","#b75f55"],["青春广场","#d6cfb8"],["校园大门","#596b60"]].forEach(([n,col])=>{const d=document.createElement("div");d.textContent=n;d.style.cssText=`background:${col};border-radius:6px;display:grid;place-items:center;font-size:10px;color:#fff;min-height:34px`;mini.appendChild(d);});
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
 iso(x,y){return{x:x*this.tileW,y:y*this.tileH};}
 screenToWorld(dx,dy){return{x:dx,y:dy};}
 blocked(x,y){
  if(this.mode==="campus"&&(x<1||y<1||x>this.mapW-1||y>this.mapH-1))return true;
  if(this.mode==="interior"&&(x<1||y<1||x>17||y>13))return true;
  return this.blockers.some(b=>x>b.x-.18&&x<b.x+b.w+.18&&y>b.y-.18&&y<b.y+b.h+.18);
 }
 update(dt){
  let sx=0,sy=0;if(this.keys.w||this.keys.arrowup)sy-=1;if(this.keys.s||this.keys.arrowdown)sy+=1;if(this.keys.a||this.keys.arrowleft)sx-=1;if(this.keys.d||this.keys.arrowright)sx+=1;
  if(Math.hypot(this.joy.x,this.joy.y)>.12){const v=this.screenToWorld(this.joy.x,this.joy.y);sx=v.x;sy=v.y;}
  const len=Math.hypot(sx,sy);if(len>.01){sx/=len;sy/=len;const speed=(this.running?5.1:3.1)*dt,nx=this.player.x+sx*speed,ny=this.player.y+sy*speed;if(!this.blocked(nx,this.player.y))this.player.x=nx;if(!this.blocked(this.player.x,ny))this.player.y=ny;this.player.walk+=dt*10;if(this.running)this.player.energy=Math.max(0,this.player.energy-dt*1.6);}else this.player.energy=Math.min(100,this.player.energy+dt*.45);
  this.elapsed+=dt;this.dayMinutes=(8*60+Math.floor(this.elapsed*3))%(24*60);
  if(this.mode==="campus")this.npcs.forEach((n,i)=>{n.phase+=dt*.45;n.x=n.homeX+Math.sin(n.phase+i)*.65;n.y=n.homeY+Math.cos(n.phase*.8+i)*.5;});
  const pos=this.iso(this.player.x,this.player.y);this.camera.x=pos.x-this.viewW/2;this.camera.y=pos.y-this.viewH/2+30;
  this.near=this.findNearby();if(this.mode==="campus"&&this.player.y>63&&this.player.y<73&&this.player.x>22&&this.player.x<55)this.tasks[3].done=true;$("energy-meter").style.width=this.player.energy+"%";$("energy-label").textContent=Math.round(this.player.energy);
  $("clock-label").textContent=String(Math.floor(this.dayMinutes/60)).padStart(2,"0")+":"+String(this.dayMinutes%60).padStart(2,"0");
  $("location-label").textContent=this.mode==="interior"?this.currentBuilding.room:(this.near?this.near.name:this.areaName());
  $("hint-label").textContent=this.mode==="interior"?"室内探索 · E 与室内角色/设施互动 · ESC 返回校园":(this.near?`靠近了${this.near.name} · 按 E 或点击互动`:"WASD / 方向键移动，靠近建筑入口按 E 进入");
  this.updateTaskText();
 }
 areaName(){
  if(this.player.y>65)return"校园大门";
  if(this.player.y>51&&this.player.y<64)return"操场";
  if(this.player.y>36&&this.player.y<50)return"生活服务区";
  if(this.player.y>20&&this.player.y<34)return"青春广场";
  if(this.player.y<20)return"教学区";
  return"校园中轴";
 }
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
 drawDiamond(x,y,color,stroke=null){const c=this.ctx;c.fillStyle=color;c.fillRect(x-this.tileW/2,y-this.tileH/2,this.tileW,this.tileH);if(stroke){c.strokeStyle=stroke;c.strokeRect(x-this.tileW/2,y-this.tileH/2,this.tileW,this.tileH);}}

 draw(){
  const c=this.ctx,w=this.viewW,h=this.viewH;c.clearRect(0,0,w,h);c.save();c.translate(-this.camera.x,-this.camera.y);
  c.fillStyle=this.mode==="interior"?"#c4aa82":"#789d83";c.fillRect(this.camera.x-100,this.camera.y-100,w+200,h+200);
  if(this.mode==="campus")this.drawCampus();else this.drawInterior();
  c.restore();
 }
 drawCampus(){
  const c=this.ctx;
  c.fillStyle="#82a982";c.fillRect(0,0,this.mapW*this.tileW,this.mapH*this.tileH);
  for(let y=0;y<this.mapH;y+=2)for(let x=0;x<this.mapW;x+=2){
   c.fillStyle=((x*7+y*13)%9===0)?"#8eb58c":"#86ad87";
   c.fillRect(x*this.tileW,y*this.tileH,this.tileW*2,this.tileH*2);
  }
  this.areas.filter(a=>["road","plaza"].includes(a.kind)).forEach(a=>{
   c.fillStyle=a.kind==="road"?"#c9c1a9":"#d6cfb8";
   c.fillRect(a.x*this.tileW,a.y*this.tileH,a.w*this.tileW,a.h*this.tileH);
   c.strokeStyle="#eee8d5";c.lineWidth=3;c.strokeRect(a.x*this.tileW+3,a.y*this.tileH+3,a.w*this.tileW-6,a.h*this.tileH-6);
   this.label(a.name,(a.x+a.w/2)*this.tileW,(a.y+a.h/2)*this.tileH,"#514e40",15);
  });
  const field=this.areas.find(a=>a.kind==="field");
  if(field){
   const x=field.x*this.tileW,y=field.y*this.tileH,w=field.w*this.tileW,h=field.h*this.tileH;
   c.fillStyle="#b75f55";c.beginPath();c.roundRect(x,y,w,h,36);c.fill();
   c.strokeStyle="#f3d9c3";c.lineWidth=4;c.stroke();
   c.fillStyle="#6ca66f";c.fillRect(x+38,y+28,w-76,h-56);
   c.strokeStyle="#e8f0d8";c.lineWidth=3;c.strokeRect(x+38,y+28,w-76,h-56);
   c.beginPath();c.moveTo(x+w/2,y+28);c.lineTo(x+w/2,y+h-28);c.stroke();
   c.beginPath();c.arc(x+w/2,y+h/2,46,0,Math.PI*2);c.stroke();
   this.label("操场 · 足球场",x+w/2,y+20,"#fff",18);
  }
  const stands=this.areas.find(a=>a.kind==="stands");
  if(stands){const x=stands.x*this.tileW,y=stands.y*this.tileH,w=stands.w*this.tileW,h=stands.h*this.tileH;c.fillStyle="#b7b0a2";c.fillRect(x,y,w,h);for(let i=0;i<4;i++){c.fillStyle=i%2?"#d9d3c6":"#a49c8d";c.fillRect(x,y+i*h/4,w,h/8);}}
  const gate=this.areas.find(a=>a.kind==="gate");
  if(gate){const x=gate.x*this.tileW,y=gate.y*this.tileH,w=gate.w*this.tileW;c.fillStyle="#d8d1bd";c.fillRect(x-55,y+18,w+110,18);c.fillStyle="#596b60";c.fillRect(x-45,y-18,18,65);c.fillRect(x+w+27,y-18,18,65);c.fillStyle="#e8dfc8";c.fillRect(x-27,y-14,w+54,15);this.label("峰峰一中",x+w/2,y-25,"#fff",18);}
  this.areas.filter(a=>a.kind==="booths").forEach(a=>{for(let i=0;i<5;i++){const x=a.x*this.tileW,y=(a.y+i)*this.tileH;c.fillStyle="#d7e2d7";c.fillRect(x,y,2*this.tileW*.55,this.tileH*.75);c.fillStyle="#668b83";c.fillRect(x+5,y+5,this.tileW*.45,this.tileH*.55);}});
  for(let i=0;i<34;i++){const x=(4+(i*17)%79)*this.tileW,y=(4+(i*23)%68)*this.tileH;if(this.buildings.some(b=>x>b.x*this.tileW-20&&x<(b.x+b.w)*this.tileW+20&&y>b.y*this.tileH-20&&y<(b.y+b.h)*this.tileH+20))continue;this.drawTree(x,y);}
  const items=[];
  this.buildings.forEach(b=>items.push({d:b.y+b.h,fn:()=>this.drawBuilding(b)}));
  this.npcs.forEach(n=>items.push({d:n.y,fn:()=>this.drawPerson(n.x,n.y,n.role==="teacher"?"#d5dbe4":"#d8c18c","#34445a",n.name,false)}));
  items.push({d:this.player.y,fn:()=>this.drawPerson(this.player.x,this.player.y,this.profile.uniform,this.profile.hair,this.profile.name,true)});
  items.sort((a,b)=>a.d-b.d).forEach(i=>i.fn());
 }
 label(text,x,y,color="#fff",size=14){const c=this.ctx;c.save();c.font=`800 ${size}px sans-serif`;c.textAlign="center";c.lineWidth=4;c.strokeStyle="#26382dcc";c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore();}
 drawInterior(){
  const c=this.ctx,w=18*this.tileW,h=14*this.tileH;
  c.fillStyle="#e9dfcc";c.fillRect(0,0,w,h);
  for(let y=0;y<14;y++)for(let x=0;x<18;x++){c.fillStyle=(x+y)%2?"#d9c9ae":"#e3d5bd";c.fillRect(x*this.tileW,y*this.tileH,this.tileW,this.tileH);}
  // 俯视室内墙体与门口
  c.fillStyle="#eee7d9";c.fillRect(0,0,w,22);c.fillRect(0,0,22,h);c.fillRect(w-22,0,22,h);c.fillRect(0,h-22,7*this.tileW,22);c.fillRect(11*this.tileW,h-22,7*this.tileW,22);
  c.fillStyle="#71513e";c.fillRect(7*this.tileW,h-25,4*this.tileW,9);
  c.fillStyle="#493b30";c.font="bold 22px sans-serif";c.textAlign="center";c.fillText(this.currentBuilding.name+" · "+this.currentBuilding.room,w/2,54);
  const k=this.currentBuilding.kind;
  const furniture=(x,y,ww,hh,label,color)=>{c.fillStyle="#0002";c.fillRect(x*this.tileW+4,y*this.tileH+6,ww*this.tileW,hh*this.tileH);c.fillStyle=color;c.fillRect(x*this.tileW,y*this.tileH,ww*this.tileW,hh*this.tileH);c.strokeStyle="#705d49";c.lineWidth=2;c.strokeRect(x*this.tileW,y*this.tileH,ww*this.tileW,hh*this.tileH);c.fillStyle="#fff";c.font="12px sans-serif";c.fillText(label,(x+ww/2)*this.tileW,(y+hh/2)*this.tileH+4);};
  if(k==="class"){furniture(2,2,4,1,"讲台 / 黑板","#526b73");for(let y=5;y<11;y+=2)for(let x of [2,6,10,14])furniture(x,y,2,1,"课桌","#a7835e");}
  else if(k==="library"){for(let y of [2,5,8])furniture(2,y,3,1,"书架","#805d3e");furniture(8,3,6,2,"阅览桌","#a7835e");furniture(8,8,6,2,"阅读区","#66877b");}
  else if(k==="lab"){for(let y of [3,7])for(let x of [2,8,13])furniture(x,y,3,2,"实验台","#668b88");}
  else if(k==="food"){furniture(2,2,14,1,"取餐窗口","#a86d50");for(let y of [5,8])for(let x of [2,7,12])furniture(x,y,3,2,"餐桌","#a7835e");}
  else if(k==="dorm"){for(let y of [2,6,10]){furniture(2,y,3,2,"床铺","#8d83a8");furniture(8,y,3,2,"床铺","#8d83a8");furniture(14,y,2,2,"衣柜","#826d59");}}
  else if(k==="auditorium"){furniture(5,1,8,2,"舞台","#8d4852");for(let y of [5,7,9,11])furniture(3,y,12,1,"观众席","#826d68");}
  else if(k==="bath"){for(let y of [2,6,10])for(let x of [2,6,10,14])furniture(x,y,2,2,"淋浴间","#76a9ad");}
  else {furniture(2,3,5,3,"活动区","#6c9189");furniture(10,3,5,3,"器材区","#8b9b78");furniture(5,8,8,2,"公共区域","#a7835e");}
  this.drawPerson(this.player.x,this.player.y,this.profile.uniform,this.profile.hair,this.profile.name,true);
 }

 drawTree(x,y){const c=this.ctx;c.fillStyle="#0003";c.beginPath();c.ellipse(x+3,y+8,17,8,0,0,Math.PI*2);c.fill();c.fillStyle="#315f4b";c.beginPath();c.arc(x,y,17,0,Math.PI*2);c.fill();c.fillStyle="#4c8060";c.beginPath();c.arc(x-7,y-6,10,0,Math.PI*2);c.fill();c.fillStyle="#79a96f";c.beginPath();c.arc(x+7,y-7,8,0,Math.PI*2);c.fill();}
 drawBuilding(b){
  const c=this.ctx,x=b.x*this.tileW,y=b.y*this.tileH,w=b.w*this.tileW,h=b.h*this.tileH;
  c.fillStyle="#26382d55";c.fillRect(x+9,y+12,w,h);
  c.fillStyle=b.color||"#d8d0bf";c.fillRect(x,y,w,h);
  c.fillStyle=b.roof;c.fillRect(x+9,y+9,w-18,h-18);
  c.strokeStyle="#655b4e";c.lineWidth=4;c.strokeRect(x+9,y+9,w-18,h-18);
  c.fillStyle="#ffffff24";c.fillRect(x+16,y+16,w-32,8);
  const windows=Math.max(3,Math.floor(b.w/2));
  for(let i=0;i<windows;i++){c.fillStyle="#b9d5d3";c.fillRect(x+20+i*((w-45)/windows),y+h-19,18,7);}
  c.fillStyle="#fff";c.font="900 16px sans-serif";c.textAlign="center";c.shadowColor="#26352b";c.shadowBlur=5;
  c.fillText(b.name,x+w/2,y+h/2-5);c.font="12px sans-serif";c.fillText(b.room||b.desc,x+w/2,y+h/2+15);c.shadowBlur=0;
  c.fillStyle="#654936";c.fillRect(x+w/2-17,y+h-13,34,20);
  c.fillStyle="#fff0c4";c.fillRect(x+w/2-11,y+h-10,22,7);
  c.strokeStyle="#e8d9ae";c.lineWidth=3;c.beginPath();c.moveTo(x+w/2,y+h+8);c.lineTo(x+w/2,y+h+25);c.stroke();
  this.label("入口",x+w/2,y+h+38,"#fff",11);
 }
 darken(hex){const n=parseInt(hex.slice(1),16),r=Math.max(0,((n>>16)&255)-28),g=Math.max(0,((n>>8)&255)-28),b=Math.max(0,(n&255)-28);return`rgb(${r},${g},${b})`;}
 drawPerson(x,y,shirt,hair,name,isPlayer){const c=this.ctx,p=this.iso(x,y),bob=isPlayer&&Math.sin(this.player.walk*2)>0?1:0;c.fillStyle="#0004";c.beginPath();c.ellipse(p.x,p.y+10,12,7,0,0,Math.PI*2);c.fill();c.fillStyle=shirt;c.beginPath();c.arc(p.x,p.y+2+bob,10,0,Math.PI*2);c.fill();c.fillStyle="#f0c8a5";c.beginPath();c.arc(p.x,p.y-5+bob,7,0,Math.PI*2);c.fill();c.fillStyle=hair;c.beginPath();c.arc(p.x,p.y-7+bob,7,Math.PI,Math.PI*2);c.fill();c.fillStyle="#fff";c.font="11px sans-serif";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#24352c";c.strokeText(name.length>7?name.slice(0,7):name,p.x,p.y-19+bob);c.fillText(name.length>7?name.slice(0,7):name,p.x,p.y-19+bob);if(isPlayer){c.strokeStyle="#f5e6a7";c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,16,0,Math.PI*2);c.stroke();}}

 loop(now){const dt=Math.min((now-this.last)/1000,.05);this.last=now;this.update(dt);this.draw();requestAnimationFrame(this.loop);}
 save(){const data={profile:this.profile,player:this.player,elapsed:this.elapsed,mode:this.mode};try{localStorage.setItem("kmd-youth-save",JSON.stringify(data));this.showDialog("保存成功","角色、精力和探索位置已保存在当前设备。");}catch(e){this.showDialog("保存失败","浏览器存储不可用，请检查存储权限。");}}
}
function launchGame(){show(gameScreen);$("hud-name").textContent=profile.name;$("hud-grade").textContent=profile.grade;if(game){game=null;}game=new TopDownCampus($("game-canvas"),profile);}
$("dialog-ok").addEventListener("click",()=>$("dialog-panel").classList.add("hidden"));
document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>$(btn.dataset.close).classList.add("hidden")));
$("map-btn").addEventListener("click",()=>$("map-panel").classList.remove("hidden"));
$("settings-btn").addEventListener("click",()=>$("settings-panel").classList.remove("hidden"));
$("save-btn").addEventListener("click",()=>game&&game.save());
$("exit-btn").addEventListener("click",()=>{if(game)game.save();show(startScreen);});
try{const saved=JSON.parse(localStorage.getItem("kmd-youth-profile")||"null");if(saved&&saved.name)profile=saved;}catch(_){}
drawAvatar($("avatar-preview"),profile);
})();