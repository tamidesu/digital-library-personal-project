 
(function(){
  const card = document.getElementById('confirmCard');
  const btn  = document.getElementById('btnContinue');

  function setVars(el, e, prefix=''){
    const r = el.getBoundingClientRect();
    el.style.setProperty(`--${prefix}x`, `${e.clientX - r.left}px`);
    el.style.setProperty(`--${prefix}y`, `${e.clientY - r.top}px`);
  }

  if (card){
    card.addEventListener('mousemove', e=>{
      setVars(card, e);           
      card.style.setProperty('--mx', `${e.clientX - card.getBoundingClientRect().left}px`);
      card.style.setProperty('--my', `${e.clientY - card.getBoundingClientRect().top}px`);
      card.classList.add('is-hover');
    });
    card.addEventListener('mouseleave', ()=> card.classList.remove('is-hover'));
  }

  if (btn){
    btn.addEventListener('mousemove', e=> setVars(btn, e, 'b'));
  }
 
  function confettiBurst(){
    const cvs = document.createElement('canvas');
    cvs.width = innerWidth; cvs.height = innerHeight;
    Object.assign(cvs.style, {position:'fixed', inset:0, pointerEvents:'none', zIndex:2000});
    document.body.appendChild(cvs);
    const ctx = cvs.getContext('2d');

    const colors = ['#60a5fa','#a855f7','#ec4899','#22d3ee','#34d399'];
    const P = Array.from({length:120}, ()=>({
      x: cvs.width/2, y: cvs.height/3,
      vx: (Math.random()*6-3), vy: (Math.random()*-6-4),
      g: .18 + Math.random()*.05, s: 3+Math.random()*3,
      a: 1, c: colors[(Math.random()*colors.length)|0], rot: Math.random()*6.28
    }));

    let t=0; const loop=()=>{
      ctx.clearRect(0,0,cvs.width,cvs.height);
      P.forEach(p=>{
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.a -= .008;
        ctx.save(); ctx.globalAlpha = Math.max(0,p.a);
        ctx.translate(p.x,p.y); ctx.rotate(p.rot += 0.1);
        ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s);
        ctx.restore();
      });
      t++; if (t<450 && P.some(p=>p.a>0)) requestAnimationFrame(loop);
      else cvs.remove();
    }; loop();
  }
 
  window.addEventListener('load', confettiBurst);
  btn?.addEventListener('click', confettiBurst);
  
})();
