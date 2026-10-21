import { prepareAdmin } from './admin.js';
import { getClient, configured, text, route, message, privateFile, safePath } from './member-client.js';
let photos = [], filtered = [], page = 0, epoch = 0, urls = [], viewerUrl;
const size = 10, grid = document.getElementById('members-grid'), category = document.getElementById('member-category');
const viewer = document.getElementById('member-viewer'), viewerImg = viewer.querySelector('img');
function clearImages() { urls.forEach(URL.revokeObjectURL); urls = []; }
function closeViewer() { viewer.close(); viewerImg.removeAttribute('src'); if (viewerUrl) URL.revokeObjectURL(viewerUrl); viewerUrl = null; }
viewer.querySelector('button').addEventListener('click', closeViewer);
viewer.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
async function openPhoto(photo) {
  try {
    const image = await privateFile(photo.src);
    viewerUrl = URL.createObjectURL(image); viewerImg.src = viewerUrl; viewerImg.alt = photo.title;
    viewer.querySelector('p').textContent = photo.title; viewer.showModal();
  } catch (error) { message(error.message); }
}
async function render() {
  const generation = ++epoch; clearImages(); grid.replaceChildren();
  filtered = photos.filter(p => category.value === 'all' || (category.value === 'top' ? p.top : p.category === category.value));
  const pages = Math.max(1, Math.ceil(filtered.length / size)); page = Math.min(page, pages - 1);
  document.getElementById('member-page').textContent = `${page + 1} / ${pages}`;
  document.getElementById('member-prev').disabled = page === 0;
  document.getElementById('member-next').disabled = page === pages - 1;
  message(text(`${filtered.length} fotografie`, `${filtered.length} photographs`));
  const pending = filtered.slice(page * size, (page + 1) * size).map(photo => {
    const figure = document.createElement('figure'); figure.className = 'member-photo';
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', text('Apri: ', 'Open: ') + photo.title);
    const img = document.createElement('img'); img.alt = photo.title; img.width = photo.width; img.height = photo.height;
    const caption = document.createElement('figcaption'); caption.textContent = photo.title;
    button.append(img); figure.append(button, caption); grid.append(figure); button.addEventListener('click', () => openPhoto(photo));
    return { photo, img };
  });
  async function worker() {
    while (pending.length && generation === epoch) {
      const { photo, img } = pending.shift();
      try {
        const blob = await privateFile(photo.thumb.split('?')[0]);
        if (generation !== epoch) continue;
        const url = URL.createObjectURL(blob); urls.push(url); img.src = url;
      } catch (error) { if (generation === epoch) message(error.message); }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
}
category.addEventListener('change', () => { page = 0; render(); });
for (const [id, delta] of [['member-prev', -1], ['member-next', 1]]) document.getElementById(id).addEventListener('click', () => { page += delta; render(); });
document.getElementById('member-logout').addEventListener('click', async () => { epoch++; clearImages(); closeViewer(); grid.replaceChildren(); const api = await getClient(); await api.auth.signOut(); location.replace(route('accesso')); });
async function start() {
  if (!configured()) { message(text('La raccolta riservata non è ancora attiva.', 'The private collection is not yet available.')); return; }
  try {
    const api = await getClient(); const { data: { user }, error } = await api.auth.getUser();
    if (error || !user?.email_confirmed_at) { location.replace(route('accesso')); return; }
    document.getElementById('member-controls').hidden = false;
    const catalogue = JSON.parse(await (await privateFile('catalogue.json')).text());
    if (!Array.isArray(catalogue.photos)) throw new Error('Invalid catalogue');
    photos = catalogue.photos.filter(p => safePath(p.src) && safePath(p.thumb.split('?')[0]));
    photos.sort((a, b) => (b.dateTaken || '').localeCompare(a.dateTaken || ''));
    for (const [value, label] of Object.entries(catalogue.categories)) { const option = document.createElement('option'); option.value = value; option.textContent = label; category.append(option); }
    document.getElementById('member-controls').hidden = false;
    await render();
    prepareAdmin().catch(() => {});
    api.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { epoch++; clearImages(); grid.replaceChildren(); location.replace(route('accesso')); } });
  } catch (error) { message(error.message); }
}
start();
