(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const startScreen = $("start-screen"), createScreen = $("create-screen"), gameScreen = $("game-screen");
  let profile = { name:"新同学", grade:"高一", appearance:"boy", hair:"#26334a", uniform:"#e8edf2" };
  let game = null;

  function show(screen) {
    [startScreen, createScreen, gameScreen].forEach(s => s.classList.add("hidden"));
    screen.classList.remove("hidden");
  }
  function drawAvatar(canvas, p) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#d4e6dc"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#bdd7cb"; ctx.beginPath(); ctx.ellipse(90,190,55,12,0,0,Math.PI*2); ctx.fill();
    // pixel-style student portrait
    ctx.fillStyle="#24364a"; ctx.fillRect(54,145,72,40);
    ctx.fillStyle=p.uniform; ctx.fillRect(50,105,80,52);
    ctx.fillStyle="#f0c7a5"; ctx.fillRect(65,48,50,58);
    ctx.fillStyle=p.hair; ctx.fillRect(62,38,56,22); ctx.fillRect(58,48,12,28); ctx.fillRect(110,48,12,24);
    if(p.appearance==="girl"){ctx.fillStyle=p.hair;ctx.fillRect(56,60,10,70);ctx.fillRect(112,60,10,70);}
    ctx.fillStyle="#25354a";ctx.fillRect(76,70,6,5);ctx.fillRect(99,70,6,5);
    ctx.fillStyle="#c77d70";ctx.fillRect(85,89,12,3);
    ctx.fillStyle="#dce7ee";ctx.fillRect(83,108,14,24);
    ctx.fillStyle="#597b9a";ctx.fillRect(86,108,8,23);
  }
  function updatePreview(){
    profile.name=$("nickname").value.trim()||"新同学";
    profile.grade=$("grade").value; profile.appearance=$("appearance").value;
    profile.hair=$("hair").value; profile.uniform=$("uniform").value;
    $("preview-name").textContent=profile.name;
    drawAvatar($("avatar-preview"),profile);
  }
  $("start-btn").addEventListener("click",()=>{show(createScreen);updatePreview();});
  $("back-start").addEventListener("click",()=>show(startScreen));
  ["nickname","grade","appearance","hair","uniform"].forEach(id=>$(id).addEventListener("input",updatePreview));
  $("create-form").addEventListener("submit",e=>{
    e.preventDefault(); updatePreview();
    try{localStorage.setItem("kmd-youth-profile",JSON.stringify(profile));}catch(_){}
    launchGame();
  });

  class IsoCampus {
    constructor(canvas, p) {
      this.canvas=canvas; this.ctx=canvas.getContext("2d"); this.profile=p;
      this.tileW=64; this.tileH=32; this.mapW=38; this.mapH=38;
      this.player={x:19,y:19,dir:0,walk:0,energy:100};
      this.camera={x:0,y:0}; this.keys={}; this.joy={x:0,y:0}; this.running=false;
      this.last=performance.now(); this.elapsed=0; this.dayMinutes=8*60;
      this.near=null; this.decor=[]; this.blockers=[]; this.npcs=[];
      this.buildWorld(); this.bindControls(); this.resize();
      window.addEventListener("resize",()=>this.resize());
      this.loop=this.loop.bind(this); requestAnimationFrame(this.loop);
    }
    buildWorld(){
      // Fixed campus areas, laid out on an isometric grid.
      this.buildings=[
        {x:7,y:7,w:7,h:5,name:"教学楼",kind:"class",color:"#d7b98e",roof:"#b76e55",desc:"教学楼：这里将开放课堂、课程表和考试系统。"},
        {x:23,y:6,w:6,h:5,name:"图书馆",kind:"library",color:"#d9c99e",roof:"#8e9c91",desc:"图书馆：未来可以阅读书籍、完成学习任务。"},
        {x:5,y:24,w:7,h:5,name:"学生食堂",kind:"food",color:"#e2b69a",roof:"#c57c61",desc:"学生食堂：后续开放菜单、饭卡和校园经济系统。"},
        {x:24,y:23,w:8,h:6,name:"宿舍区",kind:"dorm",color:"#c9b3d8",roof:"#88749f",desc:"宿舍区：后续开放床位、休息和宿舍装饰。"},
        {x:15,y:2,w:7,h:4,name:"行政楼",kind:"office",color:"#c7d1c4",roof:"#788e84",desc:"行政楼：校园事务和特殊剧情将在这里展开。"}
      ];
      this.obstacles=[
        {x:14,y:14,w:10,h:8,name:"操场",kind:"field"},
        {x:2,y:17,w:4,h:4,name:"花园",kind:"garden"},
        {x:31,y:13,w:4,h:5,name:"林荫区",kind:"trees"}
      ];
      this.npcs=[
        {x:17,y:20,name:"值日生小林",text:"欢迎来到峰峰一中！校园地图和生活系统正在逐步开放。"},
        {x:21,y:18,name:"校园向导",text:"你可以四处走走，靠近建筑后按 E 键查看介绍。"}
      ];
      this.blockers=[];
      this.buildings.forEach(b=>this.blockers.push({x:b.x-0.3,y:b.y-0.3,w:b.w+0.6,h:b.h+0.6}));
      this.obstacles.filter(o=>o.kind!=="field").forEach(o=>this.blockers.push({x:o.x,y:o.y,w:o.w,h:o.h}));
    }
    resize(){
      const dpr=Math.min(window.devicePixelRatio||1,2), rect=this.canvas.getBoundingClientRect();
      this.canvas.width=Math.max(1,Math.floor(rect.width*dpr)); this.canvas.height=Math.max(1,Math.floor(rect.height*dpr));
      this.ctx.setTransform(dpr,0,0,dpr,0,0); this.viewW=rect.width; this.viewH=rect.height;
    }
    bindControls(){
      window.addEventListener("keydown",e=>{
        const k=e.key.toLowerCase();
        if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();
        this.keys[k]=true;
        if(k==="e"||k==="enter")this.interact();
        if(k==="shift")this.running=true;
      },{passive:false});
      window.addEventListener("keyup",e=>{this.keys[e.key.toLowerCase()]=false;if(e.key.toLowerCase()==="shift")this.running=false;});
      $("run-btn").addEventListener("pointerdown",()=>this.running=true);
      ["pointerup","pointercancel","pointerleave"].forEach(ev=>$("run-btn").addEventListener(ev,()=>this.running=false));
      $("interact-btn").addEventListener("click",()=>this.interact());
      const joy=$("joystick"), knob=$("joystick-knob"); let active=false, rect;
      const move=e=>{
        if(!active)return; const r=joy.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
        let dx=e.clientX-cx,dy=e.clientY-cy, len=Math.hypot(dx,dy), max=35;
        if(len>max){dx=dx/len*max;dy=dy/len*max;}
        knob.style.transform=`translate(${dx}px,${dy}px)`;
        this.joy={x:dx/max,y:dy/max};
      };
      joy.addEventListener("pointerdown",e=>{active=true;joy.setPointerCapture(e.pointerId);move(e);});
      joy.addEventListener("pointermove",move);
      const end=()=>{active=false;this.joy={x:0,y:0};knob.style.transform="translate(0,0)";};
      joy.addEventListener("pointerup",end);joy.addEventListener("pointercancel",end);
    }
    iso(x,y){return {x:(x-y)*this.tileW/2,y:(x+y)*this.tileH/2};}
    screenToWorld(dx,dy){return {x:(dx/(this.tileW/2)+dy/(this.tileH/2))/2,y:(dy/(this.tileH/2)-dx/(this.tileW/2))/2};}
    blocked(x,y){
      if(x<1||y<1||x>this.mapW-1||y>this.mapH-1)return true;
      return this.blockers.some(b=>x>b.x-0.25&&x<b.x+b.w+0.25&&y>b.y-0.25&&y<b.y+b.h+0.25);
    }
    update(dt){
      let sx=0,sy=0;
      if(this.keys.w||this.keys.arrowup)sx-=1,sy-=1;
      if(this.keys.s||this.keys.arrowdown)sx+=1,sy+=1;
      if(this.keys.a||this.keys.arrowleft)sx-=1,sy+=1;
      if(this.keys.d||this.keys.arrowright)sx+=1,sy-=1;
      // Touch joystick is in screen coordinates; convert to isometric world vector.
      if(Math.hypot(this.joy.x,this.joy.y)>.12){const v=this.screenToWorld(this.joy.x,this.joy.y);sx=v.x;sy=v.y;}
      const len=Math.hypot(sx,sy);
      if(len>.01){
        sx/=len;sy/=len; const speed=(this.running?5.1:3.1)*dt;
        const nx=this.player.x+sx*speed, ny=this.player.y+sy*speed;
        if(!this.blocked(nx,this.player.y))this.player.x=nx;
        if(!this.blocked(this.player.x,ny))this.player.y=ny;
        this.player.walk+=dt*10; this.player.dir=Math.atan2(sy,sx);
        this.player.energy=Math.max(0,this.player.energy-(this.running?dt*1.8:0));
      } else {this.player.energy=Math.min(100,this.player.energy+dt*.35);}
      this.elapsed+=dt; this.dayMinutes=(8*60+Math.floor(this.elapsed*3))%(24*60);
      const pos=this.iso(this.player.x,this.player.y);
      this.camera.x=pos.x-this.viewW/2; this.camera.y=pos.y-this.viewH/2+30;
      this.near=this.findNearby();
      $("energy-meter").style.width=this.player.energy+"%";$("energy-label").textContent=Math.round(this.player.energy);
      const hh=String(Math.floor(this.dayMinutes/60)).padStart(2,"0"),mm=String(this.dayMinutes%60).padStart(2,"0");
      $("clock-label").textContent=hh+":"+mm;
      $("location-label").textContent=this.near?this.near.name:this.areaName();
      $("hint-label").textContent=this.near?`靠近了${this.near.name} · 按 E 或点击互动`:"WASD / 方向键移动，靠近建筑按 E 互动";
    }
    areaName(){
      if(this.player.x<13&&this.player.y>20)return "食堂生活区";
      if(this.player.x>22&&this.player.y>20)return "宿舍生活区";
      if(this.player.y<13)return "教学活动区";
      return "中央校园";
    }
    findNearby(){
      let best=null,dist=2.4;
      for(const b of this.buildings){const cx=b.x+b.w/2,cy=b.y+b.h/2,d=Math.hypot(this.player.x-cx,this.player.y-cy);if(d<dist){dist=d;best=b;}}
      for(const n of this.npcs){const d=Math.hypot(this.player.x-n.x,this.player.y-n.y);if(d<1.5){dist=d;best={name:n.name,kind:"npc",desc:n.text};}}
      return best;
    }
    interact(){
      if(!this.near){this.showDialog("校园提示","附近没有可互动的建筑或人物。继续探索，靠近目标后再试试。");return;}
      this.showDialog(this.near.name,this.near.desc||"这里很快就会开放更多校园玩法。");
    }
    showDialog(title,text){$("dialog-title").textContent=title;$("dialog-text").textContent=text;$("dialog-panel").classList.remove("hidden");}
    drawDiamond(x,y,color,stroke=null){
      const c=this.ctx,w=this.tileW/2,h=this.tileH/2;c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w,y);c.lineTo(x,y+h);c.lineTo(x-w,y);c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}
    }
    draw(){
      const c=this.ctx,w=this.viewW,h=this.viewH;c.clearRect(0,0,w,h);
      c.save();c.translate(-this.camera.x,-this.camera.y);
      const top=this.iso(0,0), bottom=this.iso(this.mapW,this.mapH);
      // base background
      c.fillStyle="#789d83";c.fillRect(this.camera.x-100,this.camera.y-100,w+200,h+200);
      for(let sum=0;sum<this.mapW+this.mapH;sum++){
        for(let x=Math.max(0,sum-this.mapH+1);x<=Math.min(this.mapW-1,sum);x++){
          const y=sum-x,p=this.iso(x,y);
          const shade=((x*7+y*11)%5===0)?"#91b58e":((x+y)%3===0?"#86aa84":"#8daf89");
          this.drawDiamond(p.x,p.y,shade);
          if((x*13+y*7)%31===0){c.fillStyle="#d5d29a";c.fillRect(p.x-2,p.y-1,3,3);}
        }
      }
      // paths
      for(let i=0;i<38;i++){
        let p=this.iso(18,i);this.drawDiamond(p.x,p.y,"#b9b49a");
        p=this.iso(i,19);this.drawDiamond(p.x,p.y,"#b9b49a");
      }
      // areas
      this.obstacles.forEach(o=>{
        if(o.kind==="field"){
          for(let x=o.x;x<o.x+o.w;x++)for(let y=o.y;y<o.y+o.h;y++){const p=this.iso(x,y);this.drawDiamond(p.x,p.y,((x+y)%2)?"#6b9d76":"#75a981");}
          const a=this.iso(o.x+o.w/2,o.y+o.h/2);c.fillStyle="#e2e9d5";c.font="bold 18px sans-serif";c.textAlign="center";c.fillText("运动场",a.x,a.y);
        } else if(o.kind==="garden"){
          for(let x=o.x;x<o.x+o.w;x++)for(let y=o.y;y<o.y+o.h;y++){const p=this.iso(x,y);this.drawDiamond(p.x,p.y,"#739e76");}
          const a=this.iso(o.x+2,o.y+2);this.drawTree(a.x,a.y);
        } else {
          for(let x=o.x;x<o.x+o.w;x++)for(let y=o.y;y<o.y+o.h;y++){const p=this.iso(x,y);this.drawDiamond(p.x,p.y,"#759c76");}
          for(let i=0;i<5;i++){const a=this.iso(o.x+1+(i%2)*2,o.y+1+Math.floor(i/2)*1.5);this.drawTree(a.x,a.y);}
        }
      });
      // buildings and characters depth sorted by base y
      const items=[];
      this.buildings.forEach(b=>items.push({depth:b.x+b.y+b.w+b.h,draw:()=>this.drawBuilding(b)}));
      this.npcs.forEach(n=>items.push({depth:n.x+n.y,draw:()=>this.drawPerson(n.x,n.y,"#d8c18c","#34445a",n.name,false)}));
      items.push({depth:this.player.x+this.player.y,draw:()=>this.drawPerson(this.player.x,this.player.y,this.profile.uniform,this.profile.hair,this.profile.name,true)});
      items.sort((a,b)=>a.depth-b.depth).forEach(i=>i.draw());
      c.restore();
    }
    drawTree(x,y){
      const c=this.ctx;c.fillStyle="#705b43";c.fillRect(x-3,y-4,6,18);
      c.fillStyle="#315f4b";c.beginPath();c.arc(x,y-15,15,0,Math.PI*2);c.fill();
      c.fillStyle="#4c8060";c.beginPath();c.arc(x-8,y-20,9,0,Math.PI*2);c.fill();
    }
    drawBuilding(b){
      const c=this.ctx,p=this.iso(b.x+b.w/2,b.y+b.h/2),tw=this.tileW/2,th=this.tileH/2;
      const halfW=b.w*tw,halfH=b.h*th,baseY=p.y;
      // footprint and walls
      c.beginPath();c.moveTo(p.x,baseY-halfH);c.lineTo(p.x+halfW,baseY);c.lineTo(p.x,baseY+halfH);c.lineTo(p.x-halfW,baseY);c.closePath();c.fillStyle="#6f806d";c.fill();
      const height=42;
      c.beginPath();c.moveTo(p.x-halfW,baseY);c.lineTo(p.x,baseY+halfH);c.lineTo(p.x,baseY+halfH+height);c.lineTo(p.x-halfW,baseY+height);c.closePath();c.fillStyle=b.color;c.fill();
      c.beginPath();c.moveTo(p.x+halfW,baseY);c.lineTo(p.x,baseY+halfH);c.lineTo(p.x,baseY+halfH+height);c.lineTo(p.x+halfW,baseY+height);c.closePath();c.fillStyle=this.darken(b.color);c.fill();
      c.beginPath();c.moveTo(p.x,baseY-halfH-height*.45);c.lineTo(p.x+halfW,baseY-height*.45);c.lineTo(p.x,baseY+halfH-height*.45);c.lineTo(p.x-halfW,baseY-height*.45);c.closePath();c.fillStyle=b.roof;c.fill();
      c.strokeStyle="#604f43";c.lineWidth=2;c.stroke();
      c.fillStyle="#fff8e8";c.font="bold 13px sans-serif";c.textAlign="center";c.fillText(b.name,p.x,baseY+halfH+height+17);
      // windows
      c.fillStyle="#7899a2";for(let i=0;i<Math.max(2,Math.floor(b.w/2));i++){const xx=p.x-halfW+18+i*25;c.fillRect(xx,baseY+12,9,12);}
    }
    darken(hex){const n=parseInt(hex.slice(1),16),r=Math.max(0,((n>>16)&255)-28),g=Math.max(0,((n>>8)&255)-28),b=Math.max(0,(n&255)-28);return `rgb(${r},${g},${b})`;}
    drawPerson(x,y,shirt,hair,name,isPlayer){
      const c=this.ctx,p=this.iso(x,y),bob=isPlayer&&Math.sin(this.player.walk*2)>.5?2:0;
      c.fillStyle="#0003";c.beginPath();c.ellipse(p.x,p.y+5,10,5,0,0,Math.PI*2);c.fill();
      c.fillStyle="#34445a";c.fillRect(p.x-7,p.y-12+bob,6,13);c.fillRect(p.x+1,p.y-12+bob,6,13);
      c.fillStyle=shirt;c.fillRect(p.x-9,p.y-29+bob,18,18);
      c.fillStyle="#f0c8a5";c.fillRect(p.x-7,p.y-43+bob,14,14);
      c.fillStyle=hair;c.fillRect(p.x-8,p.y-46+bob,16,7);c.fillRect(p.x-9,p.y-41+bob,4,7);
      c.fillStyle="#fff";c.font="10px sans-serif";c.textAlign="center";c.fillText(name.length>7?name.slice(0,7):name,p.x,p.y-53+bob);
      if(isPlayer){c.strokeStyle="#f5e6a7";c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y-22+bob,15,0,Math.PI*2);c.stroke();}
    }
    loop(now){
      const dt=Math.min((now-this.last)/1000,.05);this.last=now;
      this.update(dt);this.draw();requestAnimationFrame(this.loop);
    }
    save(){
      const data={profile:this.profile,player:this.player,elapsed:this.elapsed};
      try{localStorage.setItem("kmd-youth-save",JSON.stringify(data));this.showDialog("保存成功","当前角色和探索位置已保存在这台设备的浏览器中。");}
      catch(e){this.showDialog("保存失败","浏览器存储不可用，请检查隐私模式或存储权限。");}
    }
  }

  function launchGame(){
    show(gameScreen);
    $("hud-name").textContent=profile.name;$("hud-grade").textContent=profile.grade;
    if(game){game=null;}
    game=new IsoCampus($("game-canvas"),profile);
  }
  $("dialog-ok").addEventListener("click",()=>$("dialog-panel").classList.add("hidden"));
  document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>$(btn.dataset.close).classList.add("hidden")));
  $("map-btn").addEventListener("click",()=>{$("map-panel").classList.remove("hidden");});
  $("settings-btn").addEventListener("click",()=>{$("settings-panel").classList.remove("hidden");});
  $("save-btn").addEventListener("click",()=>game&&game.save());
  $("exit-btn").addEventListener("click",()=>{if(game)game.save();show(startScreen);});
  $("mini-map").innerHTML='<div style="position:absolute;left:42%;top:10%;width:16%;height:25%;background:#d5b68e;transform:skewY(-25deg)"></div><div style="position:absolute;left:12%;top:55%;width:25%;height:25%;background:#e2b69a;transform:skewY(-25deg)"></div><div style="position:absolute;right:12%;top:55%;width:28%;height:25%;background:#c9b3d8;transform:skewY(-25deg)"></div><div style="position:absolute;left:45%;top:43%;width:20%;height:24%;background:#6b9d76"></div>';
  // Restore only the character profile. Cloud saves and multiplayer arrive in later phases.
  try{const saved=JSON.parse(localStorage.getItem("kmd-youth-profile")||"null");if(saved&&saved.name){profile=saved;}}catch(_){}
  drawAvatar($("avatar-preview"),profile);
})();