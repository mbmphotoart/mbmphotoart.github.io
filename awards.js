const menuButton=document.querySelector('.menu-toggle');
const menu=document.getElementById('awardMenu');
function setAwardMenu(open){menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',document.documentElement.lang==='it'?(open?'Chiudi il menu':'Apri il menu'):(open?'Close menu':'Open menu'));menu.classList.toggle('open',open)}
menuButton.addEventListener('click',()=>setAwardMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setAwardMenu(false)));
document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!menuButton.contains(e.target))setAwardMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')setAwardMenu(false)});
const viewer=document.getElementById('awardViewer');
const viewerClose=document.getElementById('closeAwardViewer');
let awardReturnFocus=null;
document.querySelectorAll('[data-open-award]').forEach(button=>button.addEventListener('click',()=>{awardReturnFocus=button;viewer.showModal();document.body.classList.add('award-viewer-open');viewerClose.focus()}));
viewerClose.addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()});
viewer.addEventListener('close',()=>{document.body.classList.remove('award-viewer-open');awardReturnFocus?.focus()});
