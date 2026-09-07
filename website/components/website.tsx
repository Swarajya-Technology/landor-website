'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import footer from '@/content/footer.json';
type Page = {slug:string;title:string;html:string;styles:string};
type GalleryImage = {src:string;alt:string};
type Modal = {kind:'inquiry'|'info'|'gallery';title:string;description?:string;detail?:string;images?:GalleryImage[];index?:number};
const pages=[['home','Home'],['about','About Us'],['mudra','Mudra Rooms & Duplex Suites'],['chakra','Chakra Rooms & Suites'],['element','Element Rooms & Cottages'],['dining','Dining'],['spa','Spa & Wellness'],['retreats','Retreat Packages'],['contact','Contact Us']];
const href=(slug:string)=>slug==='home'?'/':'/'+slug;
const plain=(node:Element|null)=>node?.textContent?.trim().replace(/\s+/g,' ')||'';
function localDay(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export default function Website({page}:{page:Page}) {
  const [menu,setMenu]=useState(false),[scrolled,setScrolled]=useState(false),[modal,setModal]=useState<Modal|null>(null),[status,setStatus]=useState('');
  const content=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null),touch=useRef(0),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const open=(value:Modal)=>{opener.current=document.activeElement as HTMLElement;setStatus('');setModal(value);};
  const close=()=>{setModal(null);setStatus('');timers.current.push(setTimeout(()=>opener.current?.focus(),250));};
  const galleryStep=(delta:number)=>setModal(m=>m?.images?{...m,index:((m.index||0)+delta+m.images.length)%m.images.length}:m);
  useEffect(()=>{const scroll=()=>setScrolled(window.scrollY>35);scroll();window.addEventListener('scroll',scroll,{passive:true});return()=>{window.removeEventListener('scroll',scroll);timers.current.forEach(clearTimeout);};},[]);
  useEffect(()=>{
    const root=content.current;if(!root)return;
    const controller=new AbortController();const {signal}=controller;
    root.querySelectorAll<HTMLElement>('[id*="feedback"], [id*="success"]').forEach(e=>e.hidden=true);
    root.querySelectorAll<HTMLInputElement>('input[type=date]').forEach((input,i)=>{input.min=localDay();input.value=localDay(i%2===0?1:3);});
    root.querySelectorAll<HTMLElement>('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));
    root.querySelectorAll<HTMLElement>('button').forEach(b=>{if(/^(Prithvi|Jal|Agni|Vayu|Akasha)$/.test(plain(b))){b.dataset.choice=plain(b);b.setAttribute('aria-pressed','false');}});
    const gallery=[...root.querySelectorAll<HTMLImageElement>('main img')].filter(i=>!i.alt.includes('logo')&&!i.src.includes('939a704ba707d668'));
    gallery.forEach(img=>{if(!img.closest('a,button')){img.dataset.galleryImage='';img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',`Open photograph: ${img.alt}`);}});
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.08});
    if(!reduced)root.querySelectorAll('section h2,section article,section .scroll-reveal').forEach(e=>{if(e.getBoundingClientRect().top>innerHeight){e.classList.add('motion-ready');observer.observe(e);}});
    let raf=0;
    const parallax=()=>{if(raf||reduced)return;raf=requestAnimationFrame(()=>{root.querySelectorAll<HTMLElement>('section:first-child img,section:first-child video').forEach(e=>{if(e.closest('.absolute')&&e.getBoundingClientRect().bottom>0){e.classList.add('parallax-image');e.style.transform=`translateY(${Math.min(window.scrollY*.08,45)}px) scale(1.04)`;}});raf=0;});};
    window.addEventListener('scroll',parallax,{passive:true,signal});
    const getCard=(el:Element)=>{let node:Element|null=el.parentElement;while(node&&node!==root){if(node.querySelector('h2,h3')&&node.querySelector('img'))return node;node=node.parentElement;}return null;};
    const showGallery=(img?:HTMLImageElement)=>{const images=gallery.filter((v,i,a)=>a.findIndex(w=>w.src===v.src)===i).map(i=>({src:i.getAttribute('src')!,alt:i.alt}));if(images.length)open({kind:'gallery',title:'Light of Landour — Gallery',images,index:Math.max(0,images.findIndex(i=>i.src===img?.getAttribute('src')))});};
    const submit=(form:HTMLFormElement)=>{
      if(!form.reportValidity())return;
      const dates=[...form.querySelectorAll<HTMLInputElement>('input[type=date]')];
      if(dates.length>=2&&dates[1].value<=dates[0].value){dates[1].setCustomValidity('Check-out must be after check-in.');dates[1].reportValidity();return;}
      let result=form.querySelector<HTMLElement>('.form-status');if(!result){result=document.createElement('p');result.className='form-status';result.setAttribute('role','status');form.append(result);}
      result.textContent='Preparing your demo inquiry…';form.setAttribute('aria-busy','true');const buttons=[...form.querySelectorAll<HTMLButtonElement>('button[type=submit]')];buttons.forEach(b=>b.disabled=true);
      timers.current.push(setTimeout(()=>{result!.textContent='Demo complete. Your details have been validated locally. No message was sent, no payment was taken, and no reservation was made.';form.removeAttribute('aria-busy');buttons.forEach(b=>b.disabled=false);},650));
    };
    root.addEventListener('input',e=>{if(e.target instanceof HTMLInputElement)e.target.setCustomValidity('');},{signal});
    root.addEventListener('submit',e=>{e.preventDefault();if(e.target instanceof HTMLFormElement)submit(e.target);},{signal});
    root.addEventListener('keydown',e=>{if(e.target instanceof HTMLImageElement&&['Enter',' '].includes(e.key)){e.preventDefault();showGallery(e.target);}},{signal});
    root.addEventListener('click',e=>{
      const target=e.target as Element;const img=target.closest<HTMLImageElement>('[data-gallery-image]');if(img){showGallery(img);return;}
      const button=target.closest<HTMLElement>('button,a');if(!button)return;const text=plain(button);const filter=button.dataset.filter;
      if(filter){e.preventDefault();root.querySelectorAll<HTMLElement>('[data-category]').forEach(card=>card.hidden=filter!=='all'&&card.dataset.category!==filter);root.querySelectorAll<HTMLElement>('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));return;}
      if(button.dataset.choice){e.preventDefault();button.parentElement?.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));return;}
      if(button.closest('form')&&button.getAttribute('type')==='submit')return;
      if(/play_arrow|pause|volume_|fullscreen|closed_caption|Watch .*Tour|Watch Suite/.test(text)){e.preventDefault();showGallery();return;}
      const card=getCard(button);const heading=plain(card?.querySelector('h3,h2')||null);
      if(text==='Details'){e.preventDefault();const category=button.closest<HTMLElement>('[data-category]')?.dataset.category;const collection:Record<string,string>={heart:'mudra',soul:'chakra',body:'element'};window.location.assign('/'+(collection[category||'']||'mudra'));return;}
      if(/Floor Plan|Suite Details/.test(text)){e.preventDefault();const detail=card?.cloneNode(true) as HTMLElement|undefined;detail?.querySelectorAll('a,button,script').forEach(e=>e.remove());open({kind:'info',title:heading||'Suite Details',description:/Floor Plan/.test(text)?'The Stitch project does not include a floor-plan drawing. Explore the supplied suite photography and specifications below.':undefined,detail:detail?.innerHTML});return;}
      if(button.dataset.demoInfo!==undefined){e.preventDefault();const label=button.dataset.demoInfo||text;if(/View|arrow_forward/.test(label)&&page.slug==='about'){const route=/Heart/.test(heading)?'mudra':/Soul/.test(heading)?'chakra':'element';window.location.assign('/'+route);return;}if(/Instagram|photo_camera/.test(label)){window.open('https://instagram.com/lightoflandour','_blank','noopener,noreferrer');return;}open({kind:'info',title:label||'Guest Information',description:'This reference does not include the linked details. Please contact the sanctuary at namaste@lightoflandour.com or +91-9068555303.'});return;}
      if(/Reserve|Book|Inquire|Request|Personalized|Make Your Package|Bespoke|Apply For/.test(text)&&(!button.getAttribute('href')?.startsWith('tel:'))){
        if(button.tagName==='A'&&button.getAttribute('href')?.startsWith('#')&&!button.closest('article')&&!/Reserve .*Duplex|Reserve Attic/.test(text))return;
        e.preventDefault();open({kind:'inquiry',title:heading||text.replace(/arrow_forward|east|auto_awesome/g,'').trim()});return;
      }
      if(button.tagName==='BUTTON'&&!button.closest('form')){e.preventDefault();open({kind:'inquiry',title:text||'Plan Your Stay'});}
    },{signal});
    return()=>{controller.abort();observer.disconnect();cancelAnimationFrame(raf);};
  },[page.slug]);
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className={`site-header ${scrolled?'scrolled':''}`}>
      <div className="contact-strip"><div><a href="tel:+919068555303">+91-9068555303</a><a className="strip-email" href="mailto:namaste@lightoflandour.com">namaste@lightoflandour.com</a><span className="strip-location">Char Dukan, Landour, Mussoorie</span><span>Sanctuary Elevation: 7,500 FT</span></div></div>
      <div className="header-row"><a className="brand" href="/"><img src="/assets/939a704ba707d668.webp" width="48" height="32" alt="" /><span>Light of Landour</span></a>
        <nav className="desktop-nav" aria-label="Primary">{[['home','Home'],['about','About Us'],['mudra','Accommodation'],['dining','Dining'],['spa','Experiences'],['retreats','Packages'],['contact','Location']].map(([slug,label])=><a key={slug} href={href(slug)} aria-current={page.slug===slug?'page':undefined}>{label}</a>)}</nav>
        <div className="header-actions"><button className="primary-button" onClick={()=>open({kind:'inquiry',title:'Book Your Stay'})}>Book Your Stay</button><Sheet open={menu} onOpenChange={setMenu}><SheetTrigger className="menu-trigger" aria-label="Open navigation menu"><span/><span/></SheetTrigger><SheetContent className="navigation-sheet"><SheetTitle>Light of Landour</SheetTitle><SheetDescription>Explore our Himalayan sanctuary</SheetDescription><div className="menu-grid"><nav aria-label="All pages">{pages.map(([slug,label],i)=><a key={slug} href={href(slug)} aria-current={slug===page.slug?'page':undefined} style={{animationDelay:`${100+i*40}ms`}}><span>{String(i+1).padStart(2,'0')}</span>{label}</a>)}</nav><img className="menu-image" src="/assets/cc243cf09d1ff4e3.webp" alt="Sunlit terrace overlooking the Himalayas" /></div><div className="menu-bottom">Char Dukan, Upper Mall, Landour, Mussoorie<a href="tel:+919068555303">+91-9068555303</a><a href="mailto:namaste@lightoflandour.com">namaste@lightoflandour.com</a></div></SheetContent></Sheet></div>
      </div>
    </header>
    <div ref={content} className="stitch-content" data-page={page.slug}><div dangerouslySetInnerHTML={{__html:page.html}}/><div dangerouslySetInnerHTML={{__html:footer.html}}/></div>
    <Dialog open={!!modal} onOpenChange={value=>{if(!value)close();}}><DialogContent className={`site-dialog ${modal?.kind==='gallery'?'gallery-dialog':''}`} onKeyDown={e=>{if(modal?.kind==='gallery'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();galleryStep(e.key==='ArrowLeft'?-1:1);}}}>
      <DialogTitle>{modal?.title}</DialogTitle><DialogDescription>{modal?.kind==='inquiry'?'Share your preferences. This is a demonstration; your inquiry stays in this browser.':modal?.description|| (modal?.kind==='gallery'?'Explore the imagery from our sanctuary. Use the arrows, thumbnails, or swipe to browse.':'Details from the sanctuary design.')}</DialogDescription>
      {modal?.kind==='gallery'&&modal.images&&<><img className="gallery-image" src={modal.images[modal.index||0].src} alt={modal.images[modal.index||0].alt} onTouchStart={e=>touch.current=e.changedTouches[0].clientX} onTouchEnd={e=>{const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>40)galleryStep(delta>0?-1:1);}}/><div className="gallery-controls"><button onClick={()=>galleryStep(-1)} aria-label="Previous image">← Previous</button><span aria-live="polite">{(modal.index||0)+1} / {modal.images.length}</span><button onClick={()=>galleryStep(1)} aria-label="Next image">Next →</button></div><div className="gallery-thumbnails">{modal.images.map((im,i)=><button key={im.src} aria-label={`View image ${i+1}`} aria-current={i===(modal.index||0)?'true':undefined} onClick={()=>setModal({...modal,index:i})}><img src={im.src} alt=""/></button>)}</div></>}
      {modal?.kind==='info'&&modal.detail&&<div className="detail-content" dangerouslySetInnerHTML={{__html:modal.detail}}/>}
      {modal?.kind==='inquiry'&&<form className="inquiry-fields" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const arrival=form.elements.namedItem('arrival') as HTMLInputElement;const departure=form.elements.namedItem('departure') as HTMLInputElement;if(departure.value<=arrival.value){departure.setCustomValidity('Check-out must be after check-in.');departure.reportValidity();return;}setStatus('Preparing your demo inquiry…');timers.current.push(setTimeout(()=>setStatus('Demo complete. No message was sent, no payment was taken, and no reservation was made.'),650));}}>
        <label>Full name *<input name="name" autoComplete="name" required/></label><label>Email address *<input name="email" type="email" autoComplete="email" required/></label><label>Check-in *<input name="arrival" type="date" min={localDay()} defaultValue={localDay(1)} required/></label><label>Check-out *<input name="departure" type="date" min={localDay(1)} defaultValue={localDay(3)} onChange={e=>e.target.setCustomValidity('')} required/></label><label className="full-field">Your preferences<textarea name="preferences" rows={3} defaultValue={modal.title}/></label><p className="demo-note">Demo inquiry only. Your information is not sent or stored.</p><button className="primary-button full-field" disabled={status.startsWith('Preparing')}>Preview Inquiry</button>{status&&<p className="form-status" role="status">{status}</p>}
      </form>}
    </DialogContent></Dialog>
  </>;
}
