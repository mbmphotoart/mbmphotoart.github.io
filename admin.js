import { getClient, text } from './member-client.js';
export async function prepareAdmin() {
  const api=await getClient();
  const {data:{user:owner}}=await api.auth.getUser();
  let page=0;
  const panel=document.getElementById('member-admin');
  async function load(){
    const {data,error}=await api.functions.invoke('manage-members',{body:{action:'list',page}});
    if(error||!Array.isArray(data?.members)) return;
    panel.hidden=false;
    const tbody=panel.querySelector('tbody');tbody.replaceChildren();
    for(const member of data.members){
      const row=document.createElement('tr');const email=document.createElement('td');email.textContent=member.email;
      const state=document.createElement('td');state.textContent=member.active?text('Attivo','Active'):text('Revocato','Revoked');
      const action=document.createElement('td');const button=document.createElement('button');button.type='button';button.disabled=member.user_id===owner?.id;button.textContent=member.active?text('Revoca accesso','Revoke access'):text('Riattiva','Restore');
      button.addEventListener('click',async()=>{button.disabled=true;const {error}=await api.functions.invoke('manage-members',{body:{action:'set-active',user_id:member.user_id,active:!member.active}});if(error){button.disabled=false;panel.querySelector('[role="status"]').textContent=text('Operazione non riuscita.','The operation failed.');}else await load();});
      action.append(button);row.append(email,state,action);tbody.append(row);
    }
    panel.querySelector('[data-prev]').disabled=page===0;panel.querySelector('[data-next]').disabled=data.members.length<100;
  }
  panel.querySelector('[data-prev]').addEventListener('click',()=>{page=Math.max(0,page-1);load();});
  panel.querySelector('[data-next]').addEventListener('click',()=>{page++;load();});
  await load();
}
