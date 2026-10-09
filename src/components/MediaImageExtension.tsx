'use client';

import {Node,mergeAttributes} from '@tiptap/core';
import {ReactNodeViewRenderer,NodeViewWrapper} from '@tiptap/react';
import type {NodeViewProps} from '@tiptap/react';
import {mediaUrl} from '@/lib/api';
import type {MediaMap} from '@/lib/types';

function ImageView({node,extension}:NodeViewProps){
  const mediaId = typeof node.attrs.mediaId === 'string' ? node.attrs.mediaId : '';
  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';
  const width = typeof node.attrs.width === 'string' ? node.attrs.width : 'normal';
  const resolve = extension.options.resolve as ((id:string)=>string|null);
  const url = mediaUrl(resolve(mediaId));
  return <NodeViewWrapper className={`editor-illustration width-${width}`} data-drag-handle>
    {url ? <img src={url} alt={alt || 'Иллюстрация'} draggable={false}/> : <span>Иллюстрация недоступна</span>}
  </NodeViewWrapper>;
}

export const MediaImage=Node.create<{resolve:(id:string)=>string|null}>({
  name:'image',group:'block',atom:true,draggable:true,
  addOptions(){return {resolve:()=>null}},
  addAttributes(){return {mediaId:{default:null},alt:{default:''},width:{default:'normal'}}},
  parseHTML(){return [{tag:'div[data-media-image]'}]},
  renderHTML({HTMLAttributes}){return ['div',mergeAttributes({'data-media-image':'true','data-media-id':HTMLAttributes.mediaId})]},
  addNodeView(){return ReactNodeViewRenderer(ImageView)}
});
export function resolveMedia(map:MediaMap|undefined,id:string){return map?.[id]?.url||null}
