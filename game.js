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
  // 校园坐标按用户手绘布局重建；坐标为游戏世界网格，建筑名称与功能均显示在屋顶标牌上。
  const make=(x,y,w,h,name,kind,room,desc,color="#eadfc9",roof="#78877d",func="")=>({x,y,w,h,name,kind,room,desc,color,roof,func});
  this.buildings=[
   make(7,3,7,4,"弘毅楼 B","dorm","男生宿舍 B","男生宿舍生活区。","#e8ddc8","#697b78","男生宿舍"),
   make(7,9,7,4,"弘毅楼 A","dorm","男生宿舍 A","男生宿舍生活区。","#e8ddc8","#697b78","男生宿舍"),
   make(22,1,10,6,"思源餐厅","food","餐厅大厅","提供校园餐食，可以用餐恢复精力。","#eee2ca","#697b78","学生餐厅"),
   make(39,3,7,4,"弘德楼 B","dorm","女生宿舍 B","女生宿舍生活区。","#e8ddc8","#697b78","女生宿舍"),
   make(39,9,7,4,"弘德楼 A","dorm","女生宿舍 A","女生宿舍生活区。","#e8ddc8","#697b78","女生宿舍"),
   make(49,1,5,3,"弘远楼","dorm","弘远楼宿舍","宿舍生活区域。","#e8ddc8","#697b78","宿舍"),
   make(49,7,5,3,"求实楼","bath","洗浴区域","校园澡堂，提供洗浴设施。","#e8ddc8","#697b78","澡堂"),
   make(12,20,7,4,"行知楼 B","class","高一教室 B","高一年级教学楼。","#eee2ca","#697b78","高一年级教学楼"),
   make(12,27,7,4,"行知楼 A","class","高一教室 A","高一年级教学楼。","#eee2ca","#697b78","高一年级教学楼"),
   make(24,14,9,6,"格物楼","lab","实验室","科学实验与实践活动场所。","#e8dfcf","#667c7d","实验楼"),
   make(34,20,7,4,"省身楼 B","class","高二教室 B","高二年级教学楼。","#eee2ca","#697b78","高二年级教学楼"),
   make(34,27,7,4,"省身楼 A","class","高二教室 A","高二年级教学楼。","#eee2ca","#697b78","高二年级教学楼"),
   make(46,18,7,4,"海粟楼 A","class","高三教室 A","高三年级教学楼。","#eee2ca","#697b78","高三年级教学楼"),
   make(46,25,7,4,"海粟楼 B","class","高三教室 B","高三年级教学楼。","#eee2ca","#697b78","高三年级教学楼"),
   make(11,39,8,5,"文渊馆","library","图书馆阅览区","馆内设有书架、阅览桌和阅读空间。","#eee5d2","#697b78","图书馆"),
   make(27,43,7,3,"校园大门","gate","校园入口","参考校园实景大门设计的主入口。","#e9dfcf","#697b78","校园主入口"),
   make(37,39,6,4,"树人楼","office","政教处","校园政教事务办理与管理办公区域。","#eee2ca","#697b78","政教处"),
   make(47,39,7,5,"杏坛报告厅","auditorium","报告厅","设有舞台、幕布和阶梯式观众席。","#e9dfcf","#697b78","学校报告厅"),
   make(2,36,7,5,"艺体中心","art","艺体中心","开展体育与艺术活动的综合场馆。","#e5e8e5","#587c86","体育与艺术活动")
  ];
  this.areas=[
   {x:1,y:13,w:9,h:20,name:"操场 · 标准跑道与足球场",kind:"field"},
   {x:20,y:22,w:13,h:12,name:"青春广场",kind:"plaza"},
   {x:20,y:10,w:4,h:2,name:"一排电话亭",kind:"phone"},
   {x:31,y:10,w:4,h:2,name:"一排电话亭",kind:"phone"},
   {x:23,y:37,w:3,h:2,name:"校园林荫路",kind:"trees"}
  ];
  this.npcs=[
   {x:26,y:25,name:"校园向导",role:"guide",text:"欢迎来到峰峰一中！行知楼是高一教学区，省身楼是高二教学区，海粟楼是高三教学区。",homeX:26,homeY:25,phase:0},
   {x:29,y:32,name:"值日生小林",role:"student",text:"青春广场是大家课间经常经过的地方。",homeX:29,homeY:32,phase:1},
   {x:8,y:31,name:"体育委员",role:"student",text:"操场有标准跑道和足球场，课余时间可以来运动。",homeX:8,homeY:31,phase:2},
   {x:37,y:35,name:"校园老师",role:"teacher",text:"请同学们爱护校园设施，保持环境整洁。",homeX:37,homeY:35,phase:3}
  ];
  this.blockers=[];this.rebuildBlockers();
  this.tasks=[{title:"熟悉新校园",desc:"在青春广场附近找到校园向导。",done:false},{title:"探索教学区域",desc:"进入一栋年级教学楼。",done:false},{title:"体验校园生活",desc:"在思源餐厅用餐或进入文渊馆。",done:false}];
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
  const mapText=document.querySelector(".modal p");if(mapText)mapText.textContent="校园建筑按校园布局图分区。每栋建筑标注名称与功能，靠近入口按 E 进入。";
  const mini=$("mini-map");if(mini){
   mini.innerHTML="";mini.style.cssText="height:260px;margin-top:16px;border-radius:10px;position:relative;overflow:hidden;background:#d6dfc9;padding:8px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:4px;color:#3e4b3e";
   const cells=[
    ["操场",1,2,1,3,"#65936c"],["艺体中心",1,5,1,1,"#9bb6b0"],
    ["弘毅楼 B",2,1,1,1,"#e9d9bd"],["弘毅楼 A",2,2,1,1,"#e9d9bd"],["思源餐厅",3,1,2,1,"#e8d8b8"],
    ["弘德楼 B",5,1,1,1,"#e9d9bd"],["弘德楼 A",5,2,1,1,"#e9d9bd"],["弘远楼",5,3,1,1,"#e9d9bd"],["求实楼",5,4,1,1,"#e9d9bd"],
    ["行知楼 B · 高一",2,3,1,1,"#e9d9bd"],["行知楼 A · 高一",2,4,1,1,"#e9d9bd"],
    ["格物楼 · 实验楼",3,3,1,1,"#d4e1dc"],["青春广场",3,4,1,1,"#c5bfae"],
    ["省身楼 B · 高二",4,3,1,1,"#e9d9bd"],["省身楼 A · 高二",4,4,1,1,"#e9d9bd"],
    ["海粟楼 A · 高三",5,3,1,1,"#e9d9bd"],["海粟楼 B · 高三",5,4,1,1,"#e9d9bd"],
    ["文渊馆 · 图书馆",2,5,1,1,"#e5d6b9"],["大门",3,5,1,1,"#b9c5b8"],["树人楼 · 政教处",4,5,1,1,"#e9d9bd"],["杏坛报告厅",5,5,1,1,"#e5d6b9"]
   ];
   cells.forEach(([label,col,row,cs,rs,bg])=>{const d=document.createElement("div");d.textContent=label;d.style.cssText=`grid-column:${col}/span ${cs};grid-row:${row}/span ${rs};background:${bg};border:1px solid #8e9b83;border-radius:5px;display:grid;place-items:center;text-align:center;padding:3px;font-size:clamp(8px,1.5vw,11px);font-weight:700;color:#435344;min-width:0;`;mini.appendChild(d);});
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
 areaName(){
  if(this.player.x<11&&this.player.y>13&&this.player.y<35)return"操场活动区";
  if(this.player.x>20&&this.player.x<34&&this.player.y>22&&this.player.y<35)return"青春广场";
  if(this.player.y<14)return"校园北区";
  if(this.player.y>37)return"校园南区";
  return"校园教学区";
 }
 findNearby(){
  if(this.mode==="interior"){const objs=this.roomObjects();let best=null,dist=1.8;objs.forEach(o=>{const d=Math.hypot(this.player.x-o.x,this.player.y-o.y);if(d<dist){dist=d;best=o;}});return best;}
  let best=null,dist=2.6;
  this.buildings.forEach(b=>{const door={x:b.x+b.w/2,y:b.y+b.h+.7};const d=Math.hypot(this.player.x-door.x,this.player.y-door.y);if(d<dist){dist=d;best={...b,doorX:door.x,doorY:door.y};}});
  this.npcs.forEach(n=>{const d=Math.hypot(this.player.x-n.x,this.player.y-n.y);if(d<1.45&&d<dist){dist=d;best={name:n.name,kind:"npc",desc:n.text,npc:n};}});
  return best;
 }
 roomObjects(){
  const b=this.currentBuilding,k=b.kind;
  const common=[{x:9,y:3,name:"室内公告板",kind:"notice",desc:"校园公告：请同学们遵守校园作息，保持公共区域整洁。"}];
  if(k==="class")return [...common,{x:5,y:6,name:"课桌",kind:"desk",desc:`这里是${b.room}，课桌上摆放着课本和学习用品。`},{x:13,y:6,name:"黑板",kind:"board",desc:"黑板上写着：认真生活，勇敢追梦。"}];
  if(k==="library")return [...common,{x:5,y:6,name:"书架",kind:"book",desc:"书架上整齐摆放着各类书籍。你翻阅了一本校园文学选集。"},{x:13,y:6,name:"阅览桌",kind:"desk",desc:"明亮的阅览空间适合安静阅读。"}];
  if(k==="food")return [...common,{x:5,y:6,name:"取餐窗口",kind:"meal",desc:"你吃了一顿热乎的校园餐，精力恢复了。"},{x:13,y:6,name:"饮水处",kind:"water",desc:"喝点水，继续校园探索。"}];
  if(k==="dorm")return [...common,{x:5,y:6,name:"宿舍床铺",kind:"rest",desc:"你在宿舍休息了一会儿，疲惫一扫而空。"},{x:13,y:6,name:"个人书桌",kind:"desk",desc:"书桌上摆着课本、台灯和几张照片。"}];
  if(k==="lab")return [...common,{x:5,y:6,name:"实验台",kind:"labwork",desc:"你观察了实验器材，了解了一项实验原理。"},{x:13,y:6,name:"实验展示墙",kind:"notice",desc:"这里展示着学生实验成果。"}];
  if(k==="auditorium")return [...common,{x:5,y:6,name:"舞台",kind:"stage",desc:"舞台配有大屏幕与红色幕布，适合举办校园集会和文艺演出。"},{x:13,y:6,name:"观众席",kind:"seat",desc:"阶梯式观众席面向舞台排列。"}];
  if(k==="art")return [...common,{x:5,y:6,name:"活动区",kind:"notice",desc:"这里是艺体活动与训练空间。"},{x:13,y:6,name:"器材区",kind:"notice",desc:"请按规定使用和归还活动器材。"}];
  if(k==="bath")return [...common,{x:5,y:6,name:"洗浴区",kind:"water",desc:"这里是校园洗浴设施区域。"},{x:13,y:6,name:"更衣区",kind:"notice",desc:"请妥善保管个人物品。"}];
  if(k==="gate")return [...common,{x:5,y:6,name:"门卫室",kind:"notice",desc:"校园主入口，访客请遵守校园出入管理规定。"},{x:13,y:6,name:"校门广场",kind:"notice",desc:"从这里进入校园，开启一天的校园生活。"}];
  return [...common,{x:5,y:6,name:"事务窗口",kind:"notice",desc:"政教处：校园日常管理与学生事务办理。"},{x:13,y:6,name:"公告栏",kind:"notice",desc:"请留意校园通知与活动安排。"}];
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
  this.areas.forEach(a=>{
   for(let x=a.x;x<a.x+a.w;x++)for(let y=a.y;y<a.y+a.h;y++){const p=this.iso(x,y);let col=a.kind==="field"?((x+y)%2?"#54885f":"#65996a"):a.kind==="plaza"?"#c9c3b0":a.kind==="phone"?"#b6a98f":"#719b76";this.drawDiamond(p.x,p.y,col);}
   const p=this.iso(a.x+a.w/2,a.y+a.h/2);c.fillStyle="#fff8e8";c.font="bold 14px Microsoft YaHei, sans-serif";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#5d715d";c.strokeText(a.name,p.x,p.y);c.fillText(a.name,p.x,p.y);
   if(a.kind==="field"){
    const q1=this.iso(a.x+1,a.y+1),q2=this.iso(a.x+a.w-1,a.y+1),q3=this.iso(a.x+a.w-1,a.y+a.h-1),q4=this.iso(a.x+1,a.y+a.h-1);
    c.strokeStyle="#d7e2cf";c.lineWidth=3;c.beginPath();c.moveTo(q1.x,q1.y);c.lineTo(q2.x,q2.y);c.lineTo(q3.x,q3.y);c.lineTo(q4.x,q4.y);c.closePath();c.stroke();
    c.strokeStyle="#e5e7d8";c.lineWidth=2;c.beginPath();c.moveTo((q1.x+q4.x)/2,(q1.y+q4.y)/2);c.lineTo((q2.x+q3.x)/2,(q2.y+q3.y)/2);c.stroke();
   }
   if(a.kind==="trees"){for(let i=0;i<5;i++){const t=this.iso(a.x+1+(i%3),a.y+Math.floor(i/3));this.drawTree(t.x,t.y);}}
  });
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
  const c=this.ctx,p=this.iso(b.x+b.w/2,b.y+b.h/2),hw=b.w*this.tileW/2,hh=b.h*this.tileH/2,by=p.y,height=54;
  // building side walls
  c.beginPath();c.moveTo(p.x-hw,by);c.lineTo(p.x,by+hh);c.lineTo(p.x,by+hh+height);c.lineTo(p.x-hw,by+height);c.closePath();c.fillStyle=b.color;c.fill();
  c.beginPath();c.moveTo(p.x+hw,by);c.lineTo(p.x,by+hh);c.lineTo(p.x,by+hh+height);c.lineTo(p.x+hw,by+height);c.closePath();c.fillStyle=this.darken(b.color);c.fill();
  // roof
  c.beginPath();c.moveTo(p.x,by-hh-10);c.lineTo(p.x+hw,by-5);c.lineTo(p.x,by+hh);c.lineTo(p.x-hw,by-5);c.closePath();c.fillStyle=b.roof;c.fill();c.strokeStyle="#5e665f";c.lineWidth=2;c.stroke();
  // rows of windows on visible facades
  c.fillStyle="#7899a2";for(let i=0;i<Math.max(2,Math.floor(b.w/1.7));i++){const xx=p.x-hw+18+i*25;c.fillRect(xx,by+12,10,13);c.fillRect(p.x+hw-18-i*25,by+12,10,13);}
  // clear two-line sign: building name + function
  const labelY=by+hh+height+18;
  c.font="bold 15px Microsoft YaHei, sans-serif";c.textAlign="center";c.lineWidth=4;c.strokeStyle="#fff8e8";c.strokeText(b.name,p.x,labelY);c.fillStyle="#574b3e";c.fillText(b.name,p.x,labelY);
  c.font="bold 11px Microsoft YaHei, sans-serif";c.strokeStyle="#fff8e8";c.lineWidth=3;c.strokeText(b.func||b.desc,p.x,labelY+15);c.fillStyle="#6b6255";c.fillText(b.func||b.desc,p.x,labelY+15);
  const door=this.iso(b.x+b.w/2,b.y+b.h+.05);c.fillStyle="#60483a";c.fillRect(door.x-7,door.y-17,14,20);c.fillStyle="#f6e2a5";c.font="10px sans-serif";c.fillText("入口",door.x,door.y+14);
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