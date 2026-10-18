(()=>{'use strict';
const c=window.GFMISSION_CONFIG||{};
const $=id=>document.getElementById(id);
const show=(id,on)=>$(id).classList.toggle('hidden',!on);
const message=(id,msg,bad=false)=>{$(id).textContent=msg;$(id).className=bad?'error':'ok';};
if(!c.enabled)return;
show('disabled',false);show('login',true);
if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(c.supabaseUrl||'')||!c.publishableKey||!window.supabase){
 message('login-status','인증 설정 또는 인증 라이브러리를 확인해 주세요.',true);return;
}
const db=window.supabase.createClient(c.supabaseUrl,c.publishableKey);
let user=null,entries=[],saving=false;
// Only render links inside this project's public church-assets bucket.
const safeAssetUrl=value=>{
  try{
    const url=new URL(value), project=new URL(c.supabaseUrl);
    return url.protocol==='https:'&&url.origin===project.origin&&
      url.pathname.startsWith('/storage/v1/object/public/church-assets/');
  }catch{return false;}
};
const assetLink=(label,value)=>{
  if(!safeAssetUrl(value))return null;
  const a=document.createElement('a');a.href=value;a.textContent=label;
  a.target='_blank';a.rel='noopener noreferrer';return a;
};
const showFiles=entry=>{
  const box=$('file-preview');box.replaceChildren();
  if(!entry)return;
  const image=assetLink('기존 이미지 열기',entry.image_url);
  const pdf=assetLink('기존 PDF 열기',entry.pdf_url);
  if(image)box.append(image);if(pdf)box.append(pdf);
  if(!image&&!pdf)box.textContent='연결된 첨부파일이 없습니다.';
};

const clean=()=>{
 $('record-id').value='';$('editor').reset();$('event-date').value=todayLocal();
 showFiles(null);
};
const validHttps=s=>!s||(()=>{try{return new URL(s).protocol==='https:'}catch{return false}})();
const scrub=s=>(s||'').trim();
const todayLocal=()=>{const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
const canEdit=async u=>{
 if(!u)return false;
 const {data,error}=await db.from('church_admins').select('user_id').eq('user_id',u.id).eq('active',true).maybeSingle();
 return !error&&!!data;
};
const refresh=async()=>{
 const {data,error}=await db.from('church_content').select('*').order('event_date',{ascending:false}).limit(150);
 if(error)throw error;
 entries=data||[];
 const body=$('table-body');body.replaceChildren();
 if(!entries.length){const row=body.insertRow(), cell=row.insertCell();cell.colSpan=5;cell.textContent='등록된 자료가 없습니다.';return;}
 for(const entry of entries){
   const row=body.insertRow();
   const cells=[entry.event_date,entry.category==='bulletin'?'주보':'설교',entry.title,entry.published?'공개':'비공개'];
for(const val of cells){row.insertCell().textContent=val||'—';}
const attachments=document.createElement('div');attachments.className='file-links';
for(const [label,url] of [['이미지',entry.image_url],['PDF',entry.pdf_url]]){
  const link=assetLink(label,url);if(link)attachments.append(link);
}
if(attachments.childNodes.length)row.cells[2].append(attachments);
const actions=row.insertCell();
   const edit=document.createElement('button');edit.textContent='수정';edit.className='secondary';
   edit.addEventListener('click',()=>{
     $('record-id').value=entry.id;$('category').value=entry.category;$('event-date').value=entry.event_date;
     $('title').value=entry.title;$('issue').value=entry.issue||'';$('preacher').value=entry.preacher||'';
     $('scripture').value=entry.scripture||'';$('summary').value=entry.summary||'';
$('video-url').value=entry.video_url||'';$('published').checked=!!entry.published;
$('image-file').value='';$('pdf-file').value='';showFiles(entry);
message('editor-status','기존 글 수정 중입니다. 파일을 다시 선택하지 않으면 이전 첨부파일을 유지합니다.');
$('editor').scrollIntoView({behavior:'smooth'});
   });actions.append(edit);
   const del=document.createElement('button');del.textContent='삭제';del.className='danger';
   del.addEventListener('click',async()=>{
     if(!confirm('이 게시물을 삭제할까요? 게시자료만 삭제되며 업로드 파일은 남습니다.'))return;
del.disabled=true;
try{
  const {error}=await db.from('church_content').delete().eq('id',entry.id);
  if(error)throw error;
  message('editor-status','게시물만 삭제했습니다. 공개 파일 저장소의 업로드 파일은 남습니다.');await refresh();
}catch(err){message('editor-status','삭제 실패: '+err.message,true);del.disabled=false;}
   });actions.append(del);
 }
};
const syncAuth=async()=>{
 const {data:{user:u},error}=await db.auth.getUser();
 if(error||!u||!await canEdit(u)){
   user=null;show('dashboard',false);show('records',false);show('login',true);
   if(u){await db.auth.signOut();message('login-status','이 계정에는 교회 관리자 권한이 없습니다.',true);}
   return;
 }
 user=u;show('login',false);show('dashboard',true);show('records',true);
 $('current-user').textContent='관리자: '+(u.email||'');
 try{await refresh()}catch(err){message('editor-status','목록을 불러오지 못했습니다: '+err.message,true)}
};
$('login-form').addEventListener('submit',async e=>{
 e.preventDefault();message('login-status','인증 중입니다...');
 const email=$('email').value.trim(), password=$('password').value;
 try{
   const {error}=await db.auth.signInWithPassword({email,password});
   $('password').value='';
   if(error)throw error;
   await syncAuth();
 }catch(err){message('login-status','로그인에 실패했습니다. 계정과 관리자 권한을 확인하세요.',true)}
});
$('logout').addEventListener('click',async()=>{await db.auth.signOut();user=null;show('dashboard',false);show('records',false);show('login',true);message('login-status','로그아웃했습니다.');});
$('new').addEventListener('click',clean);
async function upload(input,category,date){
 const file=input.files?.[0];if(!file)return null;
 const allowed=input.id==='pdf-file'?['application/pdf']:['image/jpeg','image/png','image/webp'];
 if(!allowed.includes(file.type))throw Error('허용되지 않는 파일 형식입니다.');
 if(file.size>10*1024*1024)throw Error('파일은 10MB 이하만 허용합니다.');
 const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
 const uuid=crypto.randomUUID();const path=`${category}/${date}/${uuid}.${ext}`;
 const {error}=await db.storage.from('church-assets').upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;
 const {data}=db.storage.from('church-assets').getPublicUrl(path);
 return data.publicUrl;
}
$('editor').addEventListener('submit',async e=>{
 e.preventDefault();if(!user||saving)return;
 const id=scrub($('record-id').value);const old=entries.find(x=>x.id===id)||{};
 const video=scrub($('video-url').value);
 if(!validHttps(video)){message('editor-status','설교 영상 주소는 https:// 주소만 가능합니다.',true);return;}
const category=$('category').value, date=$('event-date').value,title=scrub($('title').value);
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!title){message('editor-status','날짜와 제목을 확인하세요.',true);return;}
if(id&&old.category!==category){message('editor-status','기존 글의 종류는 바꿀 수 없습니다. 새 글을 입력해 주세요.',true);return;}
if(category==='bulletin'&&!scrub($('issue').value)){
  message('editor-status','주보 호수를 입력하세요. 예: 2026-42',true);return;
}
if($('published').checked&&!old.published){
  if(!confirm('이 자료를 공개하시겠습니까? 이미지는 비공개 글이어도 공개 저장소에서 직접 열릴 수 있습니다.'))return;
}
 const payload={category,event_date:date,title,issue:category==='bulletin'?scrub($('issue').value):null,preacher:scrub($('preacher').value)||null,
 scripture:scrub($('scripture').value)||null,summary:scrub($('summary').value)||null,
 video_url:video||null,published:$('published').checked,image_url:old.image_url||null,pdf_url:old.pdf_url||null};
const submit=$('editor').querySelector('button[type="submit"]');
saving=true;submit.disabled=true;submit.textContent='저장 중...';
try{
  message('editor-status','저장 중입니다. 잠시 기다려 주세요...');
  if(category==='bulletin'){
    // Read fresh records rather than trusting the cached list. The unique index
    // in the supplied migration is still needed to close concurrent-save races.
    const {data:matching,error:lookupError}=await db.from('church_content')
      .select('id').eq('category','bulletin').eq('event_date',date).limit(20);
    if(lookupError)throw lookupError;
    if((matching||[]).some(item=>item.id!==id)){
      throw Error('같은 날짜의 주보가 이미 있습니다. 새 글 대신 기존 주보의 수정 버튼을 누르세요.');
    }
     const img=await upload($('image-file'),category,date);
     const pdf=await upload($('pdf-file'),category,date);
     if(img)payload.image_url=img;if(pdf)payload.pdf_url=pdf;
   }
   const query=id?db.from('church_content').update(payload).eq('id',id):db.from('church_content').insert(payload);
   const {error}=await query;
   if(error)throw error;
   clean();message('editor-status','저장되었습니다. 공개로 설정한 자료는 방문자에게 표시됩니다.');await refresh();
 }catch(err){message('editor-status','저장 실패: '+err.message,true)}
 finally{saving=false;submit.disabled=false;submit.textContent='저장';}
});
clean();syncAuth();
})();
