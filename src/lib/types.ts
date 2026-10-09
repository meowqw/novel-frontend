export type Work = {id:string;title:string;description:string|null;slug:string;status:'ongoing'|'completed'|'hiatus';volumes?:Volume[];chapters?:Chapter[];cover_media_id?:string|null;cover_url?:string|null;cover_thumb_url?:string|null};
export type Volume = {id:string;work_id:string;title:string;position:number};
export type Chapter = {id:string;work_id:string;volume_id:string|null;title:string;position:number};
export type User = {id:string;username:string;name:string;email:string};
export type Doc = {type:string;content?:Doc[];text?:string;attrs?:Record<string,unknown>;marks?:{type:string;attrs?:Record<string,unknown>}[]};
export type Draft = {chapter_id:string;content:Doc;version:number;updated_at:string;stats:{characters:number;words:number};media?:MediaMap};
export type PublicWork = Work & {author:{username:string;name:string};published_at:string;cover_url?:string|null;volumes:(Volume & {chapters:Chapter[]})[];chapters:Chapter[]};
export type PublicChapter = Chapter & {content:Doc;stats:{characters:number;words:number};media?:MediaMap};

export type MediaMap=Record<string,{url:string;width:number;height:number;mime_type:string;byte_size?:number}>;
export type CatalogWork={id:string;title:string;description:string|null;slug:string;status:Work["status"];author:{username:string;name:string};cover_url:string|null;published_at:string|null;last_activity_at:string|null;published_chapters_count:number};
export type CatalogPage={data:CatalogWork[];meta:{current_page:number;last_page:number;total:number};links:{next:string|null;prev:string|null}};
