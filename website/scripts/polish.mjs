import fs from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import sharp from 'sharp';
const files=(await fs.readdir('content')).filter(f=>/^(home|about|mudra|chakra|element|dining|spa|retreats|contact|footer)\.json$/.test(f));
const sizes=new Map();
for(const file of await fs.readdir('public/assets')){
 if(!/^[a-f0-9]{16}\.webp$/.test(file))continue;
 const source='public/assets/'+file;const metadata=await sharp(source).metadata();sizes.set('/assets/'+file,metadata);
 for(const width of [480,960])if(metadata.width>width)await sharp(source).resize({width}).webp({quality:78}).toFile(source.replace('.webp',`-${width}.webp`));
}
for(const file of files){
 const data=JSON.parse(await fs.readFile('content/'+file,'utf8'));const {document}=parseHTML(data.html);
 document.querySelectorAll('video').forEach(v=>{const img=document.createElement('img');img.src=v.getAttribute('poster');img.alt='Himalayan landscape at Light of Landour';img.className=v.className;img.setAttribute('fetchpriority','high');v.replaceWith(img);});
 document.querySelectorAll('img').forEach(img=>{const src=img.getAttribute('src');const m=sizes.get(src);if(!m)return;img.setAttribute('width',m.width);img.setAttribute('height',m.height);img.setAttribute('decoding','async');const variants=[480,960].filter(w=>w<m.width).map(w=>`${src.replace('.webp',`-${w}.webp`)} ${w}w`);variants.push(`${src} ${m.width}w`);img.setAttribute('srcset',variants.join(', '));img.setAttribute('sizes','(max-width: 767px) 100vw, (max-width: 1100px) 65vw, 1100px');});
 document.querySelectorAll('button').forEach(b=>{
 const text=b.textContent.trim();
 if(/volume_|closed_caption/.test(text)&&!b.id&&!/Audio Tour/.test(b.getAttribute('aria-label')||'')){b.remove();return;}
 if(/play_arrow|pause|volume_|fullscreen|Watch .*Tour/.test(text)){
 b.setAttribute('data-photo-tour','');b.setAttribute('aria-label','Explore photo tour');b.removeAttribute('title');
 b.innerHTML=text.replace(/\s+/g,' ').match(/^(play_arrow|pause|fullscreen|volume_up)$/)?'<span class="material-symbols-outlined" aria-hidden="true">photo_library</span>':'<span class="material-symbols-outlined" aria-hidden="true">photo_library</span><span>Explore photo tour</span>';
 }
 if(/Floor Plan/.test(text)){b.innerHTML=b.innerHTML.replace('Floor Plan','Suite Details');b.setAttribute('aria-label','Suite Details');}
 });
 document.querySelectorAll('a').forEach(a=>{
 const label=a.textContent.trim();
 if(/Explore Seasonal Cafe Menu/.test(label))a.setAttribute('href','/dining#curated-menu');
 if(/(?:google\.com\/maps|maps\.google\.com)/.test(a.getAttribute('href')||''))a.setAttribute('href','https://www.google.com/maps/search/?api=1&query=Light+of+Landour+Char+Dukan+Mussoorie');
 if(a.hasAttribute('data-demo-info')&&/Privacy|Cancellation|Terms/i.test(label)){a.removeAttribute('data-demo-info');a.setAttribute('href','mailto:namaste@lightoflandour.com?subject='+encodeURIComponent(label+' enquiry'));}
 if(/Stay & Silence Policies|Guest Protocol/.test(label)){a.removeAttribute('data-demo-info');a.setAttribute('href','/contact#sanctuaryContactForm');}
 if(a.hasAttribute('data-demo-info')&&/facebook|youtube|Facebook|YouTube|play_circle/.test(label)){a.remove();}
 });
 document.querySelectorAll('span,p,h2,h3').forEach(e=>{if(e.children.length)return;e.textContent=e.textContent.replace(/\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}/g,'Sanctuary photo collection').replace(/Binaural Mountain Stereo/g,'Views from the Himalayas').replace(/Ambient Audio Active/g,'Sanctuary photo collection').replace(/Cinematic Retrospective • 4K HDR/g,'The Element Collection').replace(/Char Dukan Ridge Soundscape/g,'Char Dukan Ridge').replace(/Himalayan Soundscape/g,'Himalayan Views').replace(/Audio Experience/g,'Visual Experience');});
 document.querySelectorAll('.material-symbols-outlined').forEach(e=>e.setAttribute('aria-hidden','true'));
 data.html=[...document.childNodes].map(node=>node.outerHTML||node.textContent).join('');await fs.writeFile('content/'+file,JSON.stringify(data,null,2));
}
console.log('Polished nine pages, shared footer, and responsive image variants.');

