'use client';
import {Node,mergeAttributes} from '@tiptap/core';
import {ReactNodeViewRenderer,NodeViewWrapper} from '@tiptap/react';
import {mediaUrl} from '@/lib/api';
import type {MediaMap} from '@/lib/types';
function ImageView({node,extension}:{node:{attrs:{mediaId:string;alt?:string;width?:string}};extension:{options:{resolve:(id:string)=>string|null}}}){const url=mediaUrl(extension.options.resolve(node.attrs.mediaId));return <NodeViewWrapper className={`editor-illustration width-${node.attrs.width||'normal'}`} data-drag-handle>{url?<img src={url} alt={node.attrs.alt||'Иллюстрация'} draggable={false}/>:<span>Иллюстрация недоступна</span>}</NodeViewWrapper>}
export const MediaImage=Node.create<{resolve:(id:string)=>string|null}>({name:'image',group:'block',atom:true,draggable:true,addOptions(){return {resolve:()=>null}},addAttributes(){return {mediaId:{default:null},alt:{default:''},width:{default:'normal'}}},parseHTML(){return [{tag:'div[data-media-image]'}]},renderHTML({HTMLAttributes}){return ['div',mergeAttributes({'data-media-image':'true','data-media-id':HTMLAttributes.mediaId}),0]},addNodeView(){return ReactNodeViewRenderer(ImageView)}});
export function resolveMedia(map:MediaMap|undefined,id:string){return map?.[id]?.url||null}
