'use client';
import {MediaImage} from './MediaImageExtension';
import {forwardRef,useCallback,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {EditorContent,useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {Bold,Italic,Strikethrough,Code,Heading1,Heading2,Heading3,List,ListOrdered,Quote,Minus,Link2,Undo2,Redo2,Save,RefreshCw,AlertTriangle,ImagePlus} from 'lucide-react';
import {api,json,ApiError} from '@/lib/api';
import type {Draft,Doc,MediaMap} from '@/lib/types';

// Normalize optional image attributes before sending ProseMirror JSON to Laravel.
function normalizeImageAttrs(doc:Doc):Doc {
 const visit=(node:any):any=>{
  if(!node||typeof node!=='object')return node;
  const result={...node};
  if(node.type==='image'&&node.attrs){
   const attrs={...node.attrs};
   if(typeof attrs.alt !== 'string' || attrs.alt.length === 0) delete attrs.alt;
   result.attrs=attrs;
  }
  if(Array.isArray(node.content))result.content=node.content.map(visit);
  return result;
 };
 return visit(doc) as Doc;
}

type SaveState='saved'|'dirty'|'saving'|'conflict'|'error';
export type ChapterEditorHandle={saveNow:()=>Promise<boolean>};
const ChapterEditor=forwardRef<ChapterEditorHandle,{chapterId:string;onSaved?:(version:number)=>void;onStateChange?:(state:SaveState)=>void}>(function ChapterEditor({chapterId,onSaved,onStateChange},ref){
 const [draft,setDraft]=useState<Draft|null>(null);
 const [media,setMedia]=useState<MediaMap>({});const mediaRef=useRef<MediaMap>({});const fileRef=useRef<HTMLInputElement>(null);const uploadBusy=useRef(false);
 const [state,setState]=useState<SaveState>('saved');
 const [message,setMessage]=useState('');
 const version=useRef(0), lastSaved=useRef(''), busy=useRef(false), pending=useRef(false), blocked=useRef(false), currentChapter=useRef(chapterId), editorRef=useRef<ReturnType<typeof useEditor>>(null);
 const editor=useEditor({immediatelyRender:false,extensions:[StarterKit.configure({heading:{levels:[1,2,3]}}),Link.configure({openOnClick:false,HTMLAttributes:{target:'_blank',rel:'noopener noreferrer'}}),MediaImage.configure({resolve:(id:string)=>mediaRef.current[id]?.url||null})],content:{type:'doc',content:[]},editorProps:{attributes:{class:'tiptap-content',spellcheck:'true'}},onUpdate:()=>{if(!blocked.current){pending.current=true;setState('dirty')}}});
 editorRef.current=editor;
 useEffect(()=>{onStateChange?.(state)},[state,onStateChange]);
 const reload=useCallback(async()=>{
  const target=chapterId;blocked.current=true;setMessage('');
  try{const r=await api<{data:Draft}>(`chapters/${target}/draft`);if(currentChapter.current!==target)return;
   version.current=r.data.version;setDraft(r.data);mediaRef.current=r.data.media||{};setMedia(mediaRef.current);const serialized=JSON.stringify(normalizeImageAttrs(r.data.content));lastSaved.current=serialized;pending.current=false;
   editorRef.current?.commands.setContent(r.data.content,false);setState('saved');blocked.current=false;
  }catch(e){setMessage((e as Error).message);setState('error')}
 },[chapterId]);
 useEffect(()=>{currentChapter.current=chapterId;version.current=0;pending.current=false;blocked.current=true;setDraft(null);setState('saved');void reload();return()=>{blocked.current=true}},[chapterId,reload]);
 const save=useCallback(async():Promise<boolean>=>{
  const e=editorRef.current;if(!e||!draft||busy.current||blocked.current)return false;
  if(!pending.current)return true;
  const target=chapterId;const content=normalizeImageAttrs(e.getJSON() as Doc);const snapshot=JSON.stringify(content);
  if(snapshot===lastSaved.current){pending.current=false;setState('saved');return true}
  busy.current=true;setState('saving');
  try{const result=await api<{data:Draft}>(`chapters/${target}/draft`,json('PUT',{version:version.current,content}));
   if(currentChapter.current!==target)return false;
   version.current=result.data.version;if(result.data.media){mediaRef.current=result.data.media;setMedia(result.data.media)}lastSaved.current=snapshot;setDraft(result.data);onSaved?.(result.data.version);
   pending.current=JSON.stringify(normalizeImageAttrs(editorRef.current?.getJSON() as Doc))!==snapshot;setState(pending.current?'dirty':'saved');setMessage('');return !pending.current;
  }catch(err){if(currentChapter.current!==target)return false;
   if(err instanceof ApiError&&err.status===409){blocked.current=true;setState('conflict');setMessage('Черновик изменился в другой вкладке или устройстве. Твои изменения не перезаписаны. Скопируй нужный текст перед загрузкой серверной версии.');}
   else{setState('error');setMessage((err as Error).message)}
   return false;
  }finally{busy.current=false}
 },[chapterId,draft,onSaved]);
 useImperativeHandle(ref,()=>({saveNow:save}),[save]);
 useEffect(()=>{if(state!=='dirty')return;const t=setTimeout(()=>{void save()},1300);return()=>clearTimeout(t)},[state,save]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(pending.current||busy.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[]);
 const uploadImage=useCallback(async(file:File)=>{if(uploadBusy.current||!editorRef.current)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setMessage('Поддерживаются JPEG, PNG и WebP');return}if(file.size>10*1024*1024){setMessage('Изображение должно быть не больше 10 МБ');return}uploadBusy.current=true;setMessage('Загружаем иллюстрацию…');try{const form=new FormData();form.append('kind','chapter_image');form.append('file',file);const response=await api<{data:{id:string;url:string;width:number;height:number;mime_type:string;byte_size:number}}>('media/images',{method:'POST',body:form});const asset=response.data;mediaRef.current={...mediaRef.current,[asset.id]:{url:asset.url,width:asset.width,height:asset.height,mime_type:asset.mime_type,byte_size:asset.byte_size}};setMedia(mediaRef.current);editorRef.current?.chain().focus().insertContent({type:'image',attrs:{mediaId:asset.id,width:'normal'}}).run();setMessage('')}catch(e){setMessage((e as Error).message)}finally{uploadBusy.current=false}},[]);
 const handlePaste=useCallback((e:React.ClipboardEvent<HTMLDivElement>)=>{const file=Array.from(e.clipboardData.files).find(f=>f.type.startsWith('image/'));if(file){e.preventDefault();void uploadImage(file)}},[uploadImage]);
 const handleDrop=useCallback((e:React.DragEvent<HTMLDivElement>)=>{const file=Array.from(e.dataTransfer.files).find(f=>f.type.startsWith('image/'));if(file){e.preventDefault();void uploadImage(file)}},[uploadImage]);
 const tool=(label:string,Icon:typeof Bold,active:boolean,action:()=>void,disabled=false)=><button type="button" title={label} aria-label={label} aria-pressed={active} className={'editor-tool '+(active?'is-active':'')} disabled={!editor||disabled} onClick={action}><Icon size={17}/></button>;
 const addLink=()=>{if(!editor)return;const prev=editor.getAttributes('link').href||'';const url=window.prompt('Ссылка (https://...)',prev);if(url===null)return;if(!url){editor.chain().focus().unsetLink().run();return}if(!/^https?:\/\//i.test(url)){setMessage('Разрешены только ссылки http:// и https://');return}editor.chain().focus().extendMarkRange('link').setLink({href:url}).run()};
 return <div className="rich-editor">
  <div className="rich-toolbar" role="toolbar" aria-label="Форматирование текста">
   {tool('Жирный',Bold,!!editor?.isActive('bold'),()=>editor?.chain().focus().toggleBold().run())}
   {tool('Курсив',Italic,!!editor?.isActive('italic'),()=>editor?.chain().focus().toggleItalic().run())}
   {tool('Зачёркнутый',Strikethrough,!!editor?.isActive('strike'),()=>editor?.chain().focus().toggleStrike().run())}
   {tool('Код',Code,!!editor?.isActive('code'),()=>editor?.chain().focus().toggleCode().run())}
   <span className="tool-separator"/>
   {tool('Заголовок 1',Heading1,!!editor?.isActive('heading',{level:1}),()=>editor?.chain().focus().toggleHeading({level:1}).run())}
   {tool('Заголовок 2',Heading2,!!editor?.isActive('heading',{level:2}),()=>editor?.chain().focus().toggleHeading({level:2}).run())}
   {tool('Заголовок 3',Heading3,!!editor?.isActive('heading',{level:3}),()=>editor?.chain().focus().toggleHeading({level:3}).run())}
   <span className="tool-separator"/>
   {tool('Список',List,!!editor?.isActive('bulletList'),()=>editor?.chain().focus().toggleBulletList().run())}
   {tool('Нумерованный список',ListOrdered,!!editor?.isActive('orderedList'),()=>editor?.chain().focus().toggleOrderedList().run())}
   {tool('Цитата',Quote,!!editor?.isActive('blockquote'),()=>editor?.chain().focus().toggleBlockquote().run())}
   {tool('Разделитель',Minus,false,()=>editor?.chain().focus().setHorizontalRule().run())}
   {tool('Ссылка',Link2,!!editor?.isActive('link'),addLink)}
   {tool('Вставить изображение',ImagePlus,false,()=>fileRef.current?.click())}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void uploadImage(f);e.target.value=''}}/>
   <span className="tool-separator"/>
   {tool('Отменить',Undo2,false,()=>editor?.chain().focus().undo().run(),!editor?.can().undo())}
   {tool('Повторить',Redo2,false,()=>editor?.chain().focus().redo().run(),!editor?.can().redo())}
  </div>
  <div className="editor-savebar"><span className={'save-indicator state-'+state}>{state==='saved'?'Сохранено':state==='dirty'?'Есть изменения':state==='saving'?'Сохранение…':state==='conflict'?'Конфликт версий':'Ошибка сохранения'}{draft?` · v${version.current}`:''}</span><button className="editor-savebutton" type="button" onClick={()=>void save()} disabled={!draft||busy.current||state==='conflict'}><Save size={14}/> Сохранить</button></div>
  {(state==='conflict'||state==='error'||message)&&<div className="editor-warning"><AlertTriangle size={17}/><span>{message}</span><button type="button" onClick={()=>{if(window.confirm('Загрузить серверную версию? Несохранённые изменения будут потеряны.'))void reload()}}><RefreshCw size={14}/> Загрузить с сервера</button></div>}
  <div onPaste={handlePaste} onDrop={handleDrop}><EditorContent editor={editor}/></div>
  <div className="editor-bottom">{draft?`Серверная статистика: ${draft.stats.characters} символов · ${draft.stats.words} слов`:'Загрузка черновика…'}<span>Ctrl / Cmd + B — жирный</span></div>
 </div>
});
export default ChapterEditor;
