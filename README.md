# 굳프랜드교회 홈페이지 (GOOD FRIEND MISSION CHURCH)

- 홈페이지: https://gfmission.vercel.app (이 저장소의 `main` 브랜치가 Vercel로 자동 배포됩니다)
- 관리자 페이지: https://gfmission.vercel.app/admin.html
- 백엔드: Supabase 프로젝트 `uxthtymeawaegwwtrlra` (주보·설교 데이터, 관리자 로그인, 파일 저장소)

## 매주 주보 올리는 법 (코드 수정 없음)
1. 휴대폰 또는 PC에서 `admin.html`에 접속해 관리자 이메일/비밀번호로 로그인합니다.
2. 날짜가 자동으로 주일로, 호수(`연도-주차`)와 제목이 자동으로 채워집니다. 필요하면 고칩니다.
3. **주보 이미지 업로드**에서 주보 사진(휴대폰으로 찍은 사진 그대로 가능)이나 PDF를 고릅니다. 큰 사진은 자동으로 줄여서 올립니다.
4. **저장**을 누르면 홈페이지 "주보 모아보기"와 "이번 주 주보"에 바로 표시됩니다. (비공개로 두려면 "승인 후 공개 게시" 체크를 해제)
5. 잘못 올렸으면 아래 "등록된 자료" 표에서 **수정** 또는 **삭제**합니다.

설교도 같은 화면에서 구분을 "설교"로 바꾸고 날짜·제목·설교자·본문·영상 주소(YouTube 등 https 링크)를 넣어 저장하면 됩니다.

## 관리자 추가/변경 (Supabase 대시보드)
1. Authentication > Users > **Add user**로 이메일·비밀번호 계정을 만듭니다 (Auto Confirm 체크).
2. SQL Editor에서 아래를 실행해 관리자 목록에 등록합니다 (이메일만 바꾸면 됩니다).
   ```sql
   insert into public.church_admins (user_id, active)
   select id, true from auth.users where email = '관리자이메일@example.com'
   on conflict (user_id) do update set active = true;
   ```
3. 권한을 거두려면 `update public.church_admins set active = false where user_id = '...'` 로 비활성화합니다.
4. Authentication > Sign In / Providers > Email에서 **Allow new users to sign up은 꺼 두세요.** (관리자는 위 절차로만 발급)

## 자동 깨우기 (Supabase 무료 플랜 일시중지 방지)
Supabase 무료 플랜은 7일간 API 호출이 없으면 프로젝트가 자동으로 일시중지되고, 그러면 주보 목록을 DB에서 읽지 못합니다 (2026-11-02 실제 발생 → 11-03 복구).
- `api/keepalive.js` + `vercel.json`: Vercel cron이 **매일** 공개 테이블을 한 번 읽습니다. 상태 확인: https://gfmission.vercel.app/api/keepalive
- `.github/workflows/supabase-keepalive.yml`: GitHub Actions가 **3일마다** 한 번 더 호출합니다 (백업). GitHub는 60일간 커밋이 없으면 예약 실행을 끄므로, 그때는 Actions 탭에서 다시 켜 주세요.
- 혹시 다시 멈추더라도 홈페이지는 `content.json`의 주보를 대신 보여주므로 오류 화면은 뜨지 않습니다. 대시보드에서 **Restore project**를 누르면 복구됩니다.

## 파일 구성
- `index.html` : 홈페이지. Supabase에서 공개 주보·설교를 읽고, 실패하거나 비어 있으면 `content.json`을 사용
- `admin.html` / `admin-secure.js` : 관리자 로그인, 주보·설교 등록/수정/삭제, 사진·PDF 업로드(자동 축소)
- `site-config.js` : Supabase 주소와 공개(publishable) 키. `service_role`/secret 키는 절대 넣지 마세요
- `content.json` : DB가 비어 있거나 연결이 안 될 때 보여줄 예비 게시자료 (2026-10-18 주보)
- `SUPABASE_SETUP.sql` : 테이블·RLS 정책·`church-assets` 공개 버킷 설정 (이미 적용됨)
- `api/keepalive.js`, `vercel.json`, `.github/workflows/supabase-keepalive.yml` : 자동 깨우기
- `20261018_*.png` : 2026-10-18 주보 사진 원본

## 보안 메모
- 권한 제어의 핵심은 서버의 RLS 정책입니다. `church_admins`에 등록된 계정만 등록·수정·삭제할 수 있고, 방문자는 `published = true`인 자료만 읽습니다.
- `church-assets` 버킷은 공개 파일용입니다. 개인정보가 담긴 문서는 올리지 마세요. 비공개 글에 첨부한 파일도 주소를 알면 열립니다.
- 공용 관리자 비밀번호를 만들지 말고, 담당자별 계정을 발급하세요.

## 이력
- 2026-10-18 v1.1 정적 홈페이지 + v1.2 관리자 인증 패키지 업로드, Supabase 연결(`enabled:true`)
- 2026-11-03 Supabase 일시중지로 주보 목록 오류 → `content.json` 자동 대체, 프로젝트 복구, 자동 깨우기 추가, 관리자 페이지 입력 자동화(주일 날짜·호수·제목)와 사진 자동 축소
