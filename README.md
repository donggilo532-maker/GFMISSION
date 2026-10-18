# 굳프랜드교회 홈페이지 v1.1 (2026-10-18)

이 버전은 기존 메인 디자인과 정보를 유지하면서 `주보 모아보기`, `설교 말씀`, `콘텐츠 편집 도우미`를 추가했습니다.

## 파일 구성
- `index.html` : 기존 메인 화면 + 주보·설교 게시판
- `content.json` : 주보·설교 목록 데이터 (2026-10-18 주보 1건, 확인된 설교 영상 0건)
- `admin.html` : 브라우저에서 데이터 입력 및 `content.json` 다운로드 (서버 로그인 기능 없음)
- `README.md` : 사용 안내

## GitHub에서 배포하는 순서
1. 현재 GitHub `donggilo532-maker/GFMISSION`의 `index.html`은 삭제하지 말고 변경 전 버전을 백업하세요. (Git 커밋 이력에 이전 버전이 남습니다.)
2. 압축을 풀고 `index.html`, `content.json`, `admin.html`을 저장소 최상단(root)에 업로드합니다. 기존 index.html이 있으므로 GitHub 웹 편집기의 업로드 덮어쓰기 또는 내용 교체 기능을 이용해야 합니다.
3. GitHub에서 `main` 브랜치의 변경사항을 커밋합니다.
4. Vercel 프로젝트 `gfmission`의 `Deployments`에서 `Ready` 상태를 확인합니다.
5. 홈페이지의 `주보 모아보기`, `설교 말씀`, `콘텐츠 관리 안내(담당자용)`를 열어 확인합니다.
6. 주보 PDF·이미지는 `bulletins/2026-10-25.pdf`와 같이 폴더에 별도 업로드한 뒤 `admin.html`의 경로란에 입력해 데이터 파일을 업데이트합니다.

## 관리자 사용 흐름
`https://gfmission.vercel.app/admin.html` → 주보/설교 내용 등록 → `content.json 다운로드` → GitHub에 `content.json` 커밋 → Vercel 자동 배포

**관리자 주의사항**
- `admin.html`은 인증형 CMS가 아니며 공개 URL입니다. 아무나 편집 화면을 열 수 있지만, 해당 페이지에서 서버 데이터를 직접 수정하지는 못합니다.
- 실제 게시 권한은 GitHub 저장소의 쓰기 권한으로 관리합니다. 계정 비밀번호, GitHub 토큰 등은 입력하거나 소스에 보관하지 마세요.
- 입력 내용은 브라우저 로컬 임시 초안입니다. 이를 공개 페이지에 반영하려면 반드시 GitHub에 업데이트해야 합니다.
- 영상 링크 및 주보 원문은 확인된 자료만 게시하세요. 교회 소속 개인의 사진, 이름 및 연락처 공개에 앞서 동의를 확인하세요.
- 실제 관리자 로그인 및 클릭 즉시 업로드를 원한다면, 추가 인증/DB/스토리지 백엔드가 필요합니다(차기 단계).
- GitHub Actions 유료 기능은 필요하지 않습니다. Vercel의 Git 연결을 통한 일반 배포를 사용합니다.

## 데이터 구조 예시
`content.json`의 `bulletins`는 `id,date,issue,title,summary,image,pdf,published`를 사용합니다.
`sermons`는 `id,date,title,speaker,scripture,summary,url,published`를 사용합니다.
`published: false`이면 공개 홈페이지에서 숨김 처리합니다.

## 현재 확인 범위
- 소스코드와 파일 구조 및 브라우저 기본 동작을 테스트합니다.
- 연결된 GitHub 계정은 현재 대상 저장소에 쓰기 권한이 없어, 실제 원격 업로드는 사용자 계정에서 진행해야 합니다.
- Vercel 운영 프로젝트에 실제 배포되었다고 주장하지 않습니다. 커밋 후 반드시 배포 상태를 확인하세요.
