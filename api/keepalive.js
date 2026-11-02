// Supabase 무료 플랜은 7일간 API 호출이 없으면 프로젝트가 자동 일시중지됩니다.
// 이 함수는 vercel.json의 cron 설정에 따라 매일 한 번 실행되어 공개 테이블을 가볍게 조회합니다.
// 주소: https://gfmission.vercel.app/api/keepalive (누구나 열어도 안전한 읽기 전용 호출)
const config = require('../site-config.js');

module.exports = async (req, res) => {
  const at = new Date().toISOString();
  if (!config.enabled || !config.supabaseUrl || !config.publishableKey) {
    res.status(200).json({ ok: false, reason: 'supabase disabled in site-config.js', at });
    return;
  }
  const url = config.supabaseUrl + '/rest/v1/church_content?select=id&limit=1';
  try {
    const r = await fetch(url, { headers: { apikey: config.publishableKey }, cache: 'no-store' });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, supabaseStatus: r.status, at });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err && err.message), at });
  }
};
