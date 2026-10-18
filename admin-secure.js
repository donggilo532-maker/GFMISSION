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
let user=null,entries=[];
const clean=()=>{
 $('record-id').value='';$('editor').reset();$('event-date').value=todayLocal();
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
   const actions=row.insertCell();
   const edit=document.createElement('button');edit.textContent='수정';edit.className='secondary';
   edit.addEventListener('click',()=>{
     $('record-id').value=entry.id;$('category').value=entry.category;$('event-date').value=entry.event_date;
     $('title').value=entry.title;$('issue').value=entry.issue||'';$('preacher').value=entry.preacher||'';
     $('scripture').value=entry.scripture||'';$('summary').value=entry.summary||'';
     $('video-url').value=entry.video_url||'';$('published').checked=!!entry.published;
     $('editor').scrollIntoView({behavior:'smooth'});
   });actions.append(edit);
   const del=document.createElement('button');del.textContent='삭제';del.className='danger';
   del.addEventListener('click',async()=>{
     if(!confirm('이 게시물을 삭제할까요? 게시자료만 삭제되며 업로드 파일은 남습니다.'))return;
     const {error}=await db.from('church_content').delete().eq('id',entry.id);
     if(error){message('editor-status','삭제 실패: '+error.message,true);return;}
     message('editor-status','삭제했습니다.');await refresh();
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
 e.preventDefault();if(!user)return;
 const id=scrub($('record-id').value);const old=entries.find(x=>x.id===id)||{};
 const video=scrub($('video-url').value);
 if(!validHttps(video)){message('editor-status','설교 영상 주소는 https:// 주소만 가능합니다.',true);return;}
 const category=$('category').value, date=$('event-date').value,title=scrub($('title').value);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!title){message('editor-status','날짜와 제목을 확인하세요.',true);return;}
 const payload={category,event_date:date,title,issue:scrub($('issue').value)||null,preacher:scrub($('preacher').value)||null,
 scripture:scrub($('scripture').value)||null,summary:scrub($('summary').value)||null,
 video_url:video||null,published:$('published').checked,image_url:old.image_url||null,pdf_url:old.pdf_url||null};
 try{
   message('editor-status','저장 중입니다. 잠시 기다려 주세요...');
   if(category==='bulletin'){
     const img=await upload($('image-file'),category,date);
     const pdf=await upload($('pdf-file'),category,date);
     if(img)payload.image_url=img;if(pdf)payload.pdf_url=pdf;
   }
   const query=id?db.from('church_content').update(payload).eq('id',id):db.from('church_content').insert(payload);
   const {error}=await query;
   if(error)throw error;
   clean();message('editor-status','저장되었습니다. 공개로 설정한 자료는 방문자에게 표시됩니다.');await refresh();
 }catch(err){message('editor-status','저장 실패: '+err.message,true)}
});
clean();syncAuth();
})();
