'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {Layers2,LogIn,LogOut,PenLine,UserRound} from 'lucide-react';
import {api} from '@/lib/api';
import type {User} from '@/lib/types';
export default function SiteHeader(){
 const pathname=usePathname();const router=useRouter();const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);const [menu,setMenu]=useState(false);
 useEffect(()=>{let live=true;setLoading(true);api<{data:User}>('auth/me').then(r=>{if(live)setUser(r.data)}).catch(()=>{if(live)setUser(null)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[pathname]);
 async function logout(){try{await api('auth/logout',{method:'POST'})}catch{}setUser(null);setMenu(false);router.replace('/');router.refresh()}
 return <header className="topbar"><div className="topbar-inner"><Link className="logo" href="/" aria-label="Лист — главная"><span className="logo-mark"><Layers2 size={20} strokeWidth={2.1}/></span>лист<span className="logo-period">.</span></Link><nav className="main-nav" aria-label="Основная навигация"><Link href="/">Главная</Link><Link href="/catalog">Каталог</Link><Link href="/dashboard">Мои произведения</Link></nav><div className="top-actions">{loading?<span className="header-skeleton" aria-label="Проверка авторизации"/>:user?<><Link className="nav-create" href="/dashboard"><PenLine size={16}/> Студия</Link><div className="account-wrap"><button className="account-trigger" type="button" onClick={()=>setMenu(!menu)} aria-expanded={menu}><span className="account-avatar">{(user.name||user.username).slice(0,1).toUpperCase()}</span><span className="account-name">{user.name||user.username}</span></button>{menu&&<div className="account-menu"><div className="account-meta"><strong>{user.name}</strong><small>@{user.username}</small></div><Link href="/dashboard" onClick={()=>setMenu(false)}><UserRound size={16}/> Кабинет автора</Link><button type="button" onClick={logout}><LogOut size={16}/> Выйти</button></div>}</div></>:<Link className="nav-login" href="/login"><LogIn size={16}/> Войти</Link>}</div></div></header>
}
