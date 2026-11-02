'use strict';
const $ = (id) => document.getElementById(id);
const pin = $('pin'), speed = $('speed');
const delays = {1:200,2:75,3:20,4:0};
const names = {1:'Slow · 200 ms/guess',2:'Normal · 75 ms/guess',3:'Fast · 20 ms/guess',4:'Instant'};
let target = '', next = 0, attempts = 0, running = false, paused = false, timer = null;
let elapsedMs = 0, startedAt = 0;
function log(message){const li=document.createElement('li');li.textContent=message;$('log').prepend(li);while($('log').children.length>7)$('log').lastElementChild.remove();}
function clock(){return elapsedMs+(running&&!paused?performance.now()-startedAt:0)}
function refresh(){
  $('attempts').textContent=attempts.toLocaleString('en-US');
  $('elapsed').textContent=(clock()/1000).toFixed(2)+'s';
  const percent=attempts/10;
  $('percent').textContent=percent.toFixed(1)+'%';
  $('progressBar').style.width=percent+'%';
  $('progressTrack').setAttribute('aria-valuenow',String(percent));
}
function stopTimer(){if(timer!==null){clearTimeout(timer);timer=null;}}
function setControls(){
  $('start').disabled=running&&!paused;
  $('start').textContent=paused?'▶ RESUME ATTACK':'▶ START ATTACK';
  $('pause').disabled=!running||paused;
  pin.disabled=running;speed.disabled=running;
}
function finish(){
  elapsedMs=clock();running=false;paused=false;stopTimer();
  $('statusBadge').textContent='CRACKED';$('statusText').textContent='✓ Password found: '+target;
  log('SUCCESS: '+target+' found in '+attempts+' attempts.');refresh();setControls();
}
function tick(){
  if(!running||paused)return;
  const guess=String(next).padStart(3,'0');
  $('guess').textContent=guess;attempts++;next++;
  if(guess===target){finish();return;}
  if(attempts===1||attempts%50===0)log('Testing '+guess+' ...');
  refresh();
  if(Number(speed.value)===4){
    // Run in bounded batches so the UI remains responsive.
    for(let i=0;i<49&&running;i++){
      const candidate=String(next).padStart(3,'0');
      $('guess').textContent=candidate;attempts++;next++;
      if(candidate===target){finish();return;}
    }
    refresh();
  }
  timer=setTimeout(tick,delays[speed.value]);
}
function start(){
  if(paused){paused=false;running=true;startedAt=performance.now();$('statusBadge').textContent='RUNNING';$('statusText').textContent='Trying combinations...';log('Attack resumed.');setControls();tick();return;}
  if(!/^[0-9]{3}$/.test(pin.value)){
    $('statusText').textContent='Please enter exactly three digits (e.g. 007).';
    pin.focus();return;
  }
  stopTimer();target=pin.value;next=0;attempts=0;elapsedMs=0;startedAt=performance.now();running=true;paused=false;
  $('guess').textContent='---';$('statusBadge').textContent='RUNNING';$('statusText').textContent='Trying combinations...';
  $('log').replaceChildren();log('Starting brute-force search from 000.');refresh();setControls();tick();
}
function pause(){if(!running||paused)return;elapsedMs=clock();paused=true;stopTimer();$('statusBadge').textContent='PAUSED';$('statusText').textContent='Attack paused';log('Attack paused.');refresh();setControls();}
function reset(){stopTimer();running=false;paused=false;target='';next=0;attempts=0;elapsedMs=0;pin.disabled=false;speed.disabled=false;pin.value='';$('guess').textContent='---';$('statusBadge').textContent='READY';$('statusText').textContent='Waiting for your command';$('log').replaceChildren();log('System reset. Enter a PIN to begin.');refresh();setControls();}
$('start').addEventListener('click',start);
$('pause').addEventListener('click',pause);
$('reset').addEventListener('click',reset);
$('togglePin').addEventListener('click',()=>{const show=pin.type==='password';pin.type=show?'text':'password';$('togglePin').textContent=show?'HIDE':'SHOW';$('togglePin').setAttribute('aria-label',show?'Hide password':'Show password');});
speed.addEventListener('input',()=>{$('speedValue').textContent=names[speed.value];});
pin.addEventListener('input',()=>{pin.value=pin.value.replace(/[^0-9]/g,'').slice(0,3);});
setControls();refresh();
