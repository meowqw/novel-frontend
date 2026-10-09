import {NextRequest,NextResponse} from 'next/server';
const base=process.env.BACKEND_API_URL||'http://localhost:8080/api/v1';
async function handler(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;
 if(!['GET','HEAD','OPTIONS'].includes(request.method)){
  const origin=request.headers.get('origin');
  const referer=request.headers.get('referer');
  const source=origin||referer;
  if(!source){return NextResponse.json({message:'Origin required'},{status:403})}
  try{if(new URL(source).origin!==request.nextUrl.origin)return NextResponse.json({message:'Invalid origin'},{status:403})}catch{return NextResponse.json({message:'Invalid origin'},{status:403})}
 } 
 const target=new URL(`${base.replace(/\/$/,'')}/${path.map(encodeURIComponent).join('/')}`);
 target.search=request.nextUrl.search;
 const token=request.cookies.get('novel_session')?.value;
 const headers=new Headers({Accept:'application/json'});
 if(token)headers.set('Authorization',`Bearer ${token}`);
 if(request.headers.get('content-type'))headers.set('Content-Type',request.headers.get('content-type')!);
 const isAuth=path.length===2&&path[0]==='auth'&&(path[1]==='login'||path[1]==='register');
 const isLogout=path.length===2&&path[0]==='auth'&&(path[1]==='logout'||path[1]==='logout-all');
 try{
 const upstream=await fetch(target,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),cache:'no-store',redirect:'manual'});
 const contentType=upstream.headers.get('content-type')||'';if(contentType.startsWith('image/')){const bytes=await upstream.arrayBuffer();return new NextResponse(bytes,{status:upstream.status,headers:{'Content-Type':contentType,'Cache-Control':upstream.headers.get('cache-control')||'no-store','X-Content-Type-Options':'nosniff'}})}const raw=await upstream.text();let payload:unknown;try{payload=JSON.parse(raw)}catch{payload={message:'Backend returned non-JSON response'}}
 if(isAuth&&upstream.ok&&payload&&typeof payload==='object'&&'token' in payload&&typeof payload.token==='string'){
  const {token:issued,...safe}=payload;
  const response=NextResponse.json(safe,{status:upstream.status});response.cookies.set('novel_session',issued,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});response.headers.set('Cache-Control','no-store');return response;
 }
 const response=upstream.status===204?new NextResponse(null,{status:204}):NextResponse.json(payload,{status:upstream.status});
 if(isLogout&&upstream.ok)response.cookies.delete('novel_session');
 response.headers.set('Cache-Control','no-store');return response;
 }catch{return NextResponse.json({message:'Backend unavailable'},{status:502})}
}
export {handler as GET,handler as POST,handler as PUT,handler as PATCH,handler as DELETE};
