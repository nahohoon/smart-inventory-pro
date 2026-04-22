/**
 * 스마트공장 재고관리 시스템 — Google Apps Script (Code.gs)
 * GitHub Pages CORS/JSONP 완전 대응 버전
 *
 * ▶ 배포 설정 (필수)
 *   실행 계정 : 나(개발자)
 *   액세스 권한: 모든 사용자 (익명 포함)
 *   배포 유형  : 웹 앱
 *
 * ▶ 스프레드시트 구조
 *   시트명: 입출고이력  (A:날짜 B:구분 C:품목코드 D:품목명 E:수량 F:입고가격 G:출고가격 H:창고 I:현장명 J:담당자 K:비고)
 *   시트명: 품목마스터  (A:품목코드 B:품목명 C:규격 D:단위 E:안전재고)
 */

var SS_ID = '★여기에_스프레드시트_ID_입력★'; // ← 필수 수정

/* ── 응답 헬퍼 ── */
function _jsonResponse(data, callback) {
  var json = JSON.stringify(data);
  if (callback) {
    /* JSONP 응답 */
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  /* JSON 응답 (CORS 헤더는 Apps Script가 자동 부여) */
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function _ok(data, cb)  { return _jsonResponse(Object.assign({ success: true  }, data || {}), cb); }
function _err(msg, cb)  { return _jsonResponse({ success: false, message: msg }, cb); }

/* ══ doGet — 모든 요청 처리 ══ */
function doGet(e) {
  var p  = e.parameter || {};
  var cb = p.callback || null;   // JSONP 콜백명
  var action = p.action || '';

  try {
    switch(action) {
      case 'test':             return _ok({ message: '연결 정상' }, cb);
      case 'getMasterItems':   return _getMasterItems(p, cb);
      case 'getTransactions':  return _getTransactions(p, cb);
      case 'saveTransactionGet': return _saveTx(p, cb);
      case 'saveMasterItemGet':  return _saveMasterItem(p, cb);
      case 'deleteMasterItem':   return _deleteMasterItem(p, cb);
      case 'dashboard':        return _dashboard(p, cb);
      default:
        return _err('알 수 없는 action: ' + action, cb);
    }
  } catch(err) {
    return _err('서버 오류: ' + err.message, cb);
  }
}

/* ── 품목 마스터 조회 ── */
function _getMasterItems(p, cb) {
  var ss   = SpreadsheetApp.openById(SS_ID);
  var sh   = ss.getSheetByName('품목마스터');
  if(!sh) return _err('품목마스터 시트를 찾을 수 없습니다', cb);

  var data = sh.getDataRange().getValues();
  var items = [];
  for(var i = 1; i < data.length; i++) {
    var r = data[i];
    if(!r[0]) continue;
    items.push({
      code: String(r[0] || ''),
      name: String(r[1] || ''),
      spec: String(r[2] || ''),
      unit: String(r[3] || 'EA'),
      safety: Number(r[4] || 0)
    });
  }
  return _ok({ items: items }, cb);
}

/* ── 품목 마스터 저장 (추가/수정) ── */
function _saveMasterItem(p, cb) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName('품목마스터');
  if(!sh) return _err('품목마스터 시트를 찾을 수 없습니다', cb);

  var code = String(p.code || '').trim();
  if(!code) return _err('품목코드 없음', cb);

  var data = sh.getDataRange().getValues();
  var rowIdx = -1;
  for(var i = 1; i < data.length; i++) {
    if(String(data[i][0]) === code) { rowIdx = i + 1; break; }
  }

  var row = [code, p.name||'', p.spec||'', p.unit||'EA', Number(p.safety||0)];

  if(rowIdx > 0) {
    sh.getRange(rowIdx, 1, 1, 5).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  return _ok({ message: '저장 완료' }, cb);
}

/* ── 품목 마스터 삭제 ── */
function _deleteMasterItem(p, cb) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName('품목마스터');
  if(!sh) return _err('품목마스터 시트를 찾을 수 없습니다', cb);

  var code = String(p.code || '').trim();
  var data = sh.getDataRange().getValues();
  for(var i = data.length - 1; i >= 1; i--) {
    if(String(data[i][0]) === code) {
      sh.deleteRow(i + 1);
      return _ok({ message: '삭제 완료' }, cb);
    }
  }
  return _err('해당 품목코드 없음: ' + code, cb);
}

/* ── 입출고 이력 조회 ── */
function _getTransactions(p, cb) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName('입출고이력');
  if(!sh) return _ok({ transactions: [] }, cb);

  var data = sh.getDataRange().getValues();
  var txs  = [];
  for(var i = 1; i < data.length; i++) {
    var r = data[i];
    if(!r[0]) continue;
    /* 날짜 처리 */
    var dt = r[0];
    var dateStr = (dt instanceof Date) ? dt.toISOString() : String(dt);
    txs.push({
      date:      dateStr,
      type:      String(r[1] || ''),
      code:      String(r[2] || ''),
      name:      String(r[3] || ''),
      qty:       Number(r[4]  || 0),
      price:     Number(r[5]  || 0),
      warehouse: String(r[7]  || ''),
      site:      String(r[8]  || ''),
      manager:   String(r[9]  || ''),
      note:      String(r[10] || '')
    });
  }
  return _ok({ transactions: txs }, cb);
}

/* ── 입출고 저장 ── */
function _saveTx(p, cb) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName('입출고이력');
  if(!sh) {
    /* 시트 없으면 자동 생성 */
    sh = ss.insertSheet('입출고이력');
    sh.appendRow(['날짜','구분','품목코드','품목명','수량','입고가격','출고가격','창고','현장명','담당자','비고']);
  }

  var isIn   = String(p.type||'') === '입고';
  var priceIn  = isIn  ? Number(p.price||0) : '';
  var priceOut = !isIn ? Number(p.price||0) : '';

  var dt = p.date ? new Date(p.date) : new Date();

  sh.appendRow([
    dt,
    p.type     || '',
    p.code     || '',
    p.name     || '',
    Number(p.qty   || 0),
    priceIn,
    priceOut,
    p.warehouse|| '',
    p.site     || '',
    p.manager  || '',
    p.note     || ''
  ]);

  return _ok({ message: '저장 완료' }, cb);
}

/* ── 대시보드 요약 ── */
function _dashboard(p, cb) {
  var ss   = SpreadsheetApp.openById(SS_ID);
  var txSh = ss.getSheetByName('입출고이력');
  var txCount = txSh ? Math.max(0, txSh.getLastRow() - 1) : 0;
  var mSh  = ss.getSheetByName('품목마스터');
  var mCount = mSh ? Math.max(0, mSh.getLastRow() - 1) : 0;
  return _ok({ txCount: txCount, masterCount: mCount }, cb);
}
