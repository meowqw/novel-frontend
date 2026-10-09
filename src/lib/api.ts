export class ApiError extends Error { constructor(public status:number, public details:unknown){super(typeof details==='object' && details!==null && 'message' in details ? String(details.message) : `HTTP ${status}`)} }
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{
 const response=await fetch(`/api/${path.replace(/^\//,'')}`,{...init,headers:{Accept:'application/json',...(init.body && !(init.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...init.headers},cache:'no-store'});
 if(response.status===204)return undefined as T;
 const data=await response.json().catch(()=>({message:'Unexpected server response'}));
 if(!response.ok)throw new ApiError(response.status,data);
 return data as T;
}
export const json=(method:string,body:unknown):RequestInit=>({method,body:JSON.stringify(body)});

export function mediaUrl(url:string|null|undefined){if(!url)return null;try{const u=new URL(url,typeof window!=="undefined"?window.location.origin:"http://localhost");const marker="/api/v1/";const idx=u.pathname.indexOf(marker);if(idx>=0)return `/api/${u.pathname.slice(idx+marker.length)}${u.search}`;return url}catch{return url}}
