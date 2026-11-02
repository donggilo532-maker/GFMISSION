// 굳프랜드교회 홈페이지 공개 설정값. publishableKey는 공개 가능한 클라이언트 키입니다.
// service_role / secret 키는 절대 이 파일이나 GitHub에 넣지 마세요.
// 브라우저(index.html, admin.html)와 서버 자동 호출(api/keepalive.js, GitHub Actions)이 함께 읽습니다.
globalThis.GFMISSION_CONFIG = {
  enabled: true,
  supabaseUrl: 'https://uxthtymeawaegwwtrlra.supabase.co',
  publishableKey: 'sb_publishable_Lwj2MQrYRU2kexrIR2MDQQ_OY77sJAS'
};
if (typeof module !== 'undefined' && module.exports) { module.exports = globalThis.GFMISSION_CONFIG; }
