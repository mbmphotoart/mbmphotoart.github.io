import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
const origin = Deno.env.get('SITE_ORIGIN') || 'https://mbmphotoart.github.io';
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Cache-Control': 'no-store' };
const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), {status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async request => {
  if (request.headers.get('Origin') && request.headers.get('Origin') !== origin) return reply({error:'Forbidden'},403);
  if (request.method === 'OPTIONS') return new Response(null,{headers:cors});
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  const owner = Deno.env.get('PORTFOLIO_OWNER_UID');
  const ownerEmail = 'bernasconim8@gmail.com';
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer /,'');
  if (!token) return reply({error:'Unauthorized'},401);
  const api = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  const {data:{user},error} = await api.auth.getUser(token);
  if (error || !user?.email_confirmed_at || (owner ? user.id !== owner : user.email?.toLowerCase() !== ownerEmail)) return reply({error:'Forbidden'},403);
  try {
    const body=await request.json();
    if (body.action === 'list') {
      const page=Number.isInteger(body.page)&&body.page>=0?Math.min(body.page,10000):0;
      const {data,error}=await api.from('portfolio_members').select('user_id,email,active,joined_at').order('joined_at',{ascending:false}).range(page*100,page*100+99);
      if(error) throw error;return reply({members:data});
    }
    if (body.action === 'set-active' && typeof body.active === 'boolean' && typeof body.user_id === 'string' && /^[a-f0-9-]{36}$/.test(body.user_id) && body.user_id !== user.id) {
      const {data,error}=await api.from('portfolio_members').update({active:body.active}).eq('user_id',body.user_id).select('user_id,active').single();
      if(error) throw error;return reply(data);
    }
    return reply({error:'Invalid request'},400);
  } catch {return reply({error:'Request failed'},400);}
});
