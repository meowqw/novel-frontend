'use client';
import {use,useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {ArrowLeft,ArrowRight,BookOpen,ChevronDown,ChevronLeft,ChevronRight,Settings2,X} from 'lucide-react';
import {api} from '@/lib/api';
import type {PublicWork,PublicChapter} from '@/lib/types';
import ProseMirrorView from '@/components/ProseMirrorView';
import PublicWorkCover from '@/components/PublicWorkCover';

type ReaderSettings={fontSize:number;lineHeight:number;width:number;theme:'dark'|'paper'|'sepia'};
const defaults:ReaderSettings={fontSize:19,lineHeight:1.9,width:740,theme:'dark'};
const statusLabels:Record<string,string>={ongoing:'В процессе',completed:'Завершено',hiatus:'Приостановлено'};
export default function Read({params}:{params:Promise<{id:string}>}){
 const {id}=use(params);const router=useRouter();const search=useSearchParams();const chapterId=search.get('chapter');
 const [work,setWork]=useState<PublicWork|null>(null);const [chapter,setChapter]=useState<PublicChapter|null>(null);
 const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [chapterLoading,setChapterLoading]=useState(false);
 const [settings,setSettings]=useState<ReaderSettings>(defaults);const [settingsOpen,setSettingsOpen]=useState(false);const [tocOpen,setTocOpen]=useState(false);
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem('list-reader-settings')||'null');if(stored&&typeof stored==='object')setSettings({...defaults,...stored})}catch{}},[]);
 function changeSettings(update:Partial<ReaderSettings>){setSettings(prev=>{const next={...prev,...update};try{localStorage.setItem('list-reader-settings',JSON.stringify(next))}catch{}return next})}
 useEffect(()=>{let active=true;setLoading(true);setError('');setWork(null);api<{data:PublicWork}>(`public/works/${id}`).then(r=>{if(active)setWork(r.data)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id]);
 const ordered=useMemo(()=>{if(!work)return [];const loose=[...work.chapters].sort((a,b)=>a.position-b.position).map(c=>({...c,group:''}));const grouped=[...work.volumes].sort((a,b)=>a.position-b.position).flatMap(v=>[...v.chapters].sort((a,b)=>a.position-b.position).map(c=>({...c,group:v.title})));return [...loose,...grouped]},[work]);
 useEffect(()=>{if(!chapterId){setChapter(null);return}let active=true;setChapter(null);setChapterLoading(true);setError('');api<{data:PublicChapter}>(`public/chapters/${chapterId}`).then(r=>{if(active){if(r.data.work_id!==id){setError('Глава не относится к этому произведению');return}setChapter(r.data)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setChapterLoading(false)});return()=>{active=false}},[chapterId,id]);
 const index=ordered.findIndex(c=>c.id===chapterId);const previous=index>0?ordered[index-1]:null;const next=index>=0&&index<ordered.length-1?ordered[index+1]:null;
 const navigate=useCallback((cid:string|null)=>{setTocOpen(false);router.push(cid?`/read/${id}?chapter=${encodeURIComponent(cid)}`:`/read/${id}`);window.scrollTo({top:0,behavior:'instant'})},[id,router]);
 return <main className={`public-reader theme-${settings.theme}`}>
  <div className="reader-shell">
   <div className="reader-topline"><Link href="/" className="reader-back"><ArrowLeft size={15}/> Главная</Link><span className="reader-brand"><BookOpen size={15}/> Лист / Чтение</span></div>
   {loading?<p className="reader-hint">Загружаем произведение…</p>:null}
   {error?<div className="reader-error" role="alert">{error}</div>:null}
   {work&&!chapterId?<>
     <section className="public-work-hero"><PublicWorkCover url={work.cover_url} title={work.title}/><div className="public-work-details"><div className="reader-eyebrow">ПРОИЗВЕДЕНИЕ · {statusLabels[work.status]??work.status}</div><h1>{work.title}</h1><p className="public-work-author">Автор: {work.author.name||work.author.username}</p><p className="public-work-description">{work.description||'Описание пока не добавлено.'}</p>{ordered.length>0?<button className="button" onClick={()=>navigate(ordered[0].id)}>Начать чтение <ArrowRight size={15}/></button>:<span className="reader-hint">Опубликованных глав пока нет</span>}</div></section>
     <section className="public-toc"><div className="public-toc-heading"><h2>Содержание</h2><span>{ordered.length} глав</span></div>{ordered.length===0?<p className="reader-hint">Здесь появятся опубликованные главы.</p>:<ChapterList chapters={ordered} onSelect={navigate}/>}</section>
   </>:null}
   {work&&chapterId?<>
    <div className="reader-chapterbar"><button className="reader-icon-button" onClick={()=>navigate(null)} title="К произведению"><ChevronLeft size={20}/></button><div className="reader-chapter-name"><span>{work.title}</span><strong>{chapter?.title||'Глава'}</strong></div><button className="reader-icon-button" onClick={()=>setTocOpen(v=>!v)} title="Содержание" aria-label="Содержание"><BookOpen size={19}/></button><button className="reader-icon-button" onClick={()=>setSettingsOpen(v=>!v)} title="Настройки чтения" aria-label="Настройки чтения"><Settings2 size={19}/></button></div>
    {tocOpen?<div className="reader-dropdown"><div className="reader-dropdown-head"><strong>Содержание</strong><button onClick={()=>setTocOpen(false)} aria-label="Закрыть"><X size={17}/></button></div><ChapterList chapters={ordered} onSelect={navigate} selected={chapterId}/></div>:null}
    {settingsOpen?<div className="reader-dropdown reader-settings"><div className="reader-dropdown-head"><strong>Настройки чтения</strong><button onClick={()=>setSettingsOpen(false)} aria-label="Закрыть"><X size={17}/></button></div><div className="reader-settings-grid"><label>Тема<select value={settings.theme} onChange={e=>changeSettings({theme:e.target.value as ReaderSettings['theme']})}><option value="dark">Тёмная</option><option value="paper">Светлая</option><option value="sepia">Сепия</option></select></label><label>Размер текста <span>{settings.fontSize} px</span><input type="range" min="15" max="26" value={settings.fontSize} onChange={e=>changeSettings({fontSize:Number(e.target.value)})}/></label><label>Межстрочный интервал <span>{settings.lineHeight.toFixed(1)}</span><input type="range" min="1.4" max="2.4" step="0.1" value={settings.lineHeight} onChange={e=>changeSettings({lineHeight:Number(e.target.value)})}/></label><label>Ширина текста <span>{settings.width} px</span><input type="range" min="540" max="920" step="20" value={settings.width} onChange={e=>changeSettings({width:Number(e.target.value)})}/></label></div><button className="reader-reset" onClick={()=>changeSettings(defaults)}>Сбросить настройки</button></div>:null}
    {chapterLoading?<p className="reader-hint reader-wait">Загружаем главу…</p>:null}
    {chapter?<article className="reader-manuscript" style={{maxWidth:settings.width,fontSize:settings.fontSize,lineHeight:settings.lineHeight}}><div className="reader-chapter-label">{index>=0?`ГЛАВА ${index+1}`:'ГЛАВА'}</div><h1>{chapter.title}</h1><div className="reader-prose"><ProseMirrorView node={chapter.content} media={chapter.media}/></div><div className="reader-end">Конец главы</div></article>:null}
    {chapter?<nav className="reader-pager" aria-label="Навигация по главам"><button disabled={!previous} onClick={()=>previous&&navigate(previous.id)}><ChevronLeft size={17}/> <span>Предыдущая глава</span></button><button onClick={()=>navigate(null)}><BookOpen size={17}/><span>Оглавление</span></button><button disabled={!next} onClick={()=>next&&navigate(next.id)}><span>Следующая глава</span><ChevronRight size={17}/></button></nav>:null}
   </>:null}
  </div>
 </main>
}
function ChapterList({chapters,onSelect,selected}:{chapters:{id:string;title:string;group:string}[];onSelect:(id:string)=>void;selected?:string|null}){let lastGroup:string|null=null;return <div className="reader-chapter-list">{chapters.map((c,i)=>{const heading=c.group!==lastGroup;lastGroup=c.group;return <div key={c.id}>{heading&&c.group?<div className="reader-volume-label"><ChevronDown size={14}/>{c.group}</div>:null}<button className={selected===c.id?'selected':''} onClick={()=>onSelect(c.id)}><span className="reader-chapter-index">{String(i+1).padStart(2,'0')}</span><span>{c.title}</span><ChevronRight size={16}/></button></div>})}</div>}
