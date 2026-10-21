const contactMenuButton=document.querySelector('.menu-toggle');
const contactMenu=document.getElementById('contactMenu');
function setContactMenu(open){contactMenuButton.setAttribute('aria-expanded',String(open));contactMenuButton.setAttribute('aria-label',document.documentElement.lang==='it'?(open?'Chiudi il menu':'Apri il menu'):(open?'Close menu':'Open menu'));contactMenu.classList.toggle('open',open)}
contactMenuButton.addEventListener('click',()=>setContactMenu(contactMenuButton.getAttribute('aria-expanded')!=='true'));
contactMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setContactMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setContactMenu(false)});
document.addEventListener('click',e=>{if(!contactMenu.contains(e.target)&&!contactMenuButton.contains(e.target))setContactMenu(false)});
document.getElementById('contactYear').textContent=new Date().getFullYear();
