import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';

const root = path.resolve(import.meta.dirname, '..');
const reference = path.resolve(root, '../reference');
const manifest = JSON.parse(fs.readFileSync(path.join(reference, 'manifest.json'), 'utf8'));
const mapping = {
  home: '9ac7145c9ca24b22b04d3eab2c30237d', about: 'e196b3682f0b462884a9e4219bcdd66b',
  mudra: '4d974f578baf4915873f1b7210ddb665', chakra: '06ef8377f43b430db32299b324fa0dfd',
  element: '9c9bfb4aa9304bbca1af0884bfe81251', dining: '8140876caebb4232b0a5e67cc93f7a9b',
  spa: '70afc086954041c2b00e6e269bbbc990', retreats: '0c092c076a6242fbb9e0c377a0a0a60f',
  contact: '80a36ff7b02945cd9c943d1334028302',
};
const routes = {'home':'/', 'about-us':'/about', accommodation:'/#accommodation', dining:'/dining', 'experiences-and-wellness':'/spa', packages:'/retreats', location:'/contact', reservation:'/contact', mudra:'/mudra', chakra:'/chakra', element:'/element'};
const assets = new Map();
function asset(url) {
  if (!/^https?:/.test(url)) return url;
  if (!assets.has(url)) assets.set(url, '/assets/'+createHash('sha256').update(url).digest('hex').slice(0,16)+'.webp');
  return assets.get(url);
}
const output = {};
let footer = '';
let config;
for (const [slug,id] of Object.entries(mapping)) {
  const html=fs.readFileSync(path.join(reference,id+'.html'),'utf8');
  const {document}=parseHTML(html);
  if (!config) {const sandbox={tailwind:{}};vm.runInNewContext(document.querySelector('#tailwind-config').textContent,sandbox);config=sandbox.tailwind.config;}
  const styles=[...document.querySelectorAll('style')].map(s=>s.textContent).filter(s=>!s.includes('@layer base')).join('\n');
  document.querySelectorAll('script,style').forEach(s=>s.remove());
  // Prototype modals are replaced by one keyboard-accessible React dialog.
  document.querySelectorAll('[id*="modal" i]').forEach(e=> {if(e.tagName==='DIV' && e.className.includes('fixed'))e.remove();});
  document.querySelectorAll('*').forEach(e=>{for(const a of [...e.attributes])if(/^on/i.test(a.name))e.removeAttribute(a.name);});
  document.querySelectorAll('img').forEach((img,i)=>{
    const original=img.getAttribute('src');if(original)img.setAttribute('src',asset(original));
    img.setAttribute('loading',i<2?'eager':'lazy');img.setAttribute('decoding','async');
    if(i===1)img.setAttribute('fetchpriority','high');
    const alt=img.getAttribute('alt')||'';if(alt.startsWith('Image from'))img.setAttribute('alt',alt.includes('logo')?'Light of Landour':alt.split('/').pop().replace(/[-_]/g,' ').replace(/\.[a-z]+$/,''));
  });
  document.querySelectorAll('[style]').forEach(e=>e.setAttribute('style',e.getAttribute('style').replace(/url\(['"]?(https?:[^'"\)]+)['"]?\)/g,(_,url)=>`url('${asset(url)}')`)));
  document.querySelectorAll('video').forEach(v=>{
    const poster=v.getAttribute('poster');if(poster)v.setAttribute('poster',asset(poster));
    v.removeAttribute('autoplay');v.setAttribute('preload','none');v.setAttribute('playsinline','');
    // The source includes remote stock clips. Keep exact poster imagery as the dependable first frame.
    v.setAttribute('data-source-video',v.querySelector('source')?.getAttribute('src')||'');
    v.querySelectorAll('source').forEach(s=>s.remove());
    v.setAttribute('aria-label','Sanctuary visual tour');
  });
  document.querySelectorAll('iframe').forEach((e,i)=>{e.setAttribute('title',e.getAttribute('title')||'Light of Landour location map');e.setAttribute('loading','lazy');});
  document.querySelectorAll('a').forEach(a=>{
    const key=a.getAttribute('data-path');if(routes[key])a.setAttribute('href',routes[key]);
    if(a.getAttribute('href')==='#') {a.setAttribute('data-demo-info',a.textContent.trim());a.setAttribute('href','#inquiry');}
    if(a.getAttribute('target')==='_blank')a.setAttribute('rel','noopener noreferrer');
  });
  document.querySelectorAll('input,select,textarea').forEach((e,i)=>{
    const id=e.id||`${slug}-field-${i}`;e.id=id;e.setAttribute('name',e.getAttribute('name')||id);
    const label=e.parentElement.querySelector('label');
    if(label){label.setAttribute('for',id);e.setAttribute('aria-label',label.textContent.trim());}
    else e.setAttribute('aria-label',e.getAttribute('placeholder')||e.getAttribute('type')||'Choose preference');
    if(e.getAttribute('type')==='email')e.setAttribute('required','');
    if(e.getAttribute('type')==='date'){e.removeAttribute('value');e.setAttribute('required','');}
  });
  document.querySelectorAll('form').forEach((form,i)=>{
    form.setAttribute('data-demo-form','');form.setAttribute('id',form.id||`${slug}-form-${i}`);
    const note=document.createElement('p');note.className='demo-note';note.textContent='Demo inquiry only. No message or reservation will be sent.';form.append(note);
    form.querySelectorAll('button').forEach(b=>{if(!/^(Prithvi|Jal|Agni|Vayu|Akasha)$/.test(b.textContent.trim()))b.setAttribute('type','submit');});
  });
  document.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('type'))b.setAttribute('type','button');if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.textContent.trim().replace(/\s+/g,' '));});
  const main=document.querySelector('main');main.id='main-content';
  output[slug]={slug,title:manifest.screens.find(s=>s.name.endsWith(id)).title.replace('Light of Landour — ',''),html:main.outerHTML,styles,screenId:id};
  if(slug==='home')footer=document.querySelector('footer').outerHTML;
}
fs.mkdirSync(path.join(root,'content'),{recursive:true});
for(const [slug,data] of Object.entries(output))fs.writeFileSync(path.join(root,'content',slug+'.json'),JSON.stringify(data,null,2));
fs.writeFileSync(path.join(root,'content/footer.json'),JSON.stringify({html:footer}));
fs.writeFileSync(path.join(root,'tailwind.config.cjs'),'module.exports = '+JSON.stringify(config,null,2));
fs.writeFileSync(path.join(root,'content/assets.json'),JSON.stringify([...assets].map(([url,file])=>({url,file})),null,2));
fs.writeFileSync(path.join(root,'content/design.md'),manifest.project.designTheme.designMd);
fs.writeFileSync(path.join(reference,'PAGE-MAP.md'),'# Stitch page map\n\nAll nine active HTML screens are desktop designs. Images and extracted Markdown are supporting resources; no mobile page designs were returned.\n\n'+Object.values(output).map(p=>`- ${p.slug==='home'?'/':'/'+p.slug}: ${p.title} — ${p.screenId}`).join('\n')+'\n\nThe implementation retains the exact section markup and content in per-page data, shares layout and interactions, and replaces prototype scripts with accessible React behavior.\n');
console.log(`Imported ${Object.keys(output).length} pages and ${assets.size} exact image references.`);
