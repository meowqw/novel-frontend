import type {ReactNode} from 'react';
import {mediaUrl} from '@/lib/api';
import type {MediaMap,Doc} from '@/lib/types';

export default function ProseMirrorView({node,media}:{node:Doc;media?:MediaMap}){
  if(node.type==='text'){
    let text:ReactNode=node.text??'';
    for(const mark of node.marks??[]){
      switch(mark.type){
        case 'bold': text=<strong>{text}</strong>;break;
        case 'italic':text=<em>{text}</em>;break;
        case 'strike':text=<s>{text}</s>;break;
        case 'code':text=<code>{text}</code>;break;
        case 'link':{
          const href=String(mark.attrs?.href??'');
          text=/^(https?:\/\/|mailto:)/i.test(href)?<a href={href} rel="noopener noreferrer" target="_blank">{text}</a>:text;
          break;
        }
      }
    }
    return <>{text}</>;
  }
  if(node.type==='image'){const id=String(node.attrs?.mediaId||'');const asset=media?.[id];const url=mediaUrl(asset?.url);return url?<figure className={`reader-illustration width-${String(node.attrs?.width||'normal')}`}><img src={url} alt={String(node.attrs?.alt||'Иллюстрация')} loading="lazy"/></figure>:<div className="reader-image-missing">Иллюстрация недоступна</div>}
  if(node.type==='hardBreak')return <br/>;
  if(node.type==='horizontalRule')return <hr/>;
  const children=(node.content??[]).map((child,i)=><ProseMirrorView node={child} media={media} key={i}/>);
  switch(node.type){
    case 'doc':return <>{children}</>;
    case 'paragraph':return <p>{children}</p>;
    case 'heading':{const level=Number(node.attrs?.level);if(level===1)return <h2>{children}</h2>;if(level===2)return <h3>{children}</h3>;return <h4>{children}</h4>}
    case 'blockquote':return <blockquote>{children}</blockquote>;
    case 'bulletList':return <ul>{children}</ul>;
    case 'orderedList':return <ol start={Number(node.attrs?.start)||1}>{children}</ol>;
    case 'listItem':return <li>{children}</li>;
    case 'codeBlock':return <pre><code>{children}</code></pre>;
    default:return <>{children}</>;
  }
}
