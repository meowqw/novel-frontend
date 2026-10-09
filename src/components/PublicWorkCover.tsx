'use client';
import {useEffect,useState} from 'react';
import {BookOpen} from 'lucide-react';
import {mediaUrl} from '@/lib/api';

// Catalog requests a thumbnail; use the same public thumbnail endpoint here,
// falling back to the original image if the variant isn't available.
export default function PublicWorkCover({url,title}:{url:string|null|undefined;title:string}){
 const original=mediaUrl(url);
 const thumb=original?(()=>{try{const u=new URL(original,"http://localhost");if(!u.pathname.includes('/public/media/'))return original;u.searchParams.set('variant','thumb');return u.pathname+u.search}catch{return original}})():null;
 const [src,setSrc]=useState<string|null>(thumb);
 useEffect(()=>setSrc(thumb),[thumb]);
 return <div className="public-work-cover">{src?<img className="work-cover-image" src={src} alt={`Обложка «${title}»`} onError={()=>setSrc(current=>current!==original?original:null)}/>:<><BookOpen size={52} strokeWidth={1.1}/><span>ЛИСТ</span></>}</div>;
}
