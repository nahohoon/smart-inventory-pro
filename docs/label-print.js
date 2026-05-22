/* ============================================================
   label-print.js  –  KY 재고관리 QR 라벨 모듈
   OSJ 검증 구조 기반, KY 데이터 구조에 맞게 이식
   ============================================================ */
console.log('[KY-LP] label-print.js loaded');

/* ── 전역 변수 초기화 (모듈 로드 시점) ── */
if (!Array.isArray(window.labelALL))   window.labelALL   = [];
if (!Array.isArray(window.labelSLOTS)) window.labelSLOTS = [];

(function (global) {
  'use strict';

  /* ── 프리셋 정의 ── */
  var LABEL_PRESETS = {
    '2x6': {
      cols: 2, rows: 6,
      width: 99.4, height: 47.8,
      qr: 20, qrTable: 18,
      nameFont: 11, codeFont: 9, specFont: 7.5,
      padding: [2, 2, 2, 5],
      gapX: 3, gapY: 0,
      pagePad: [5, 4, 5, 4]
    },
    '3x8': {
      cols: 3, rows: 8,
      width: 66.0, height: 35.8,
      qr: 13, qrTable: 11,
      nameFont: 7.5, codeFont: 6.5, specFont: 6.0,
      padding: [1.5, 1.5, 1.5, 2],
      gapX: 2, gapY: 0,
      pagePad: [5, 4, 5, 4]
    }
  };

  /* ── 현재 프리셋 키 조회 ── */
  function getCurrentPresetKey() {
    var el = document.getElementById('labelPreset');
    return (el && el.value) || '2x6';
  }

  /* ── 현재 프리셋 객체 조회 ── */
  function getCurrentPreset() {
    var key = getCurrentPresetKey();
    var p = LABEL_PRESETS[key] || LABEL_PRESETS['2x6'];
    return Object.assign({ key: key }, p);
  }

  /* ── 전체 슬롯 수 ── */
  function getTotalSlots() {
    var p = getCurrentPreset();
    if (!p || !p.cols || !p.rows) return 12;
    return p.cols * p.rows;
  }

  /* ── labelSLOTS 배열 길이 동기화 ── */
  function ensureLabelSlots() {
    var total = getTotalSlots();
    if (!Array.isArray(global.labelSLOTS)) global.labelSLOTS = [];
    while (global.labelSLOTS.length < total) global.labelSLOTS.push(null);
    if (global.labelSLOTS.length > total) global.labelSLOTS = global.labelSLOTS.slice(0, total);
  }

  /* ── CSS 변수 적용 (프리셋 기반 print style 동적 주입) ── */
  function applyLabelVars(preset) {
    injectPrintStyle(preset);
  }

  /* ── print CSS 동적 주입 ── */
  function injectPrintStyle(preset) {
    var old = document.getElementById('lbl-print-css');
    if (old) old.parentNode.removeChild(old);
    var pad = preset.padding;
    var pp = preset.pagePad;
    var qr = preset.qr, qrT = preset.qrTable;
    var css = [
      '@media print{',
      '#lbl-preview{padding:' + pp[0] + 'mm ' + pp[1] + 'mm ' + pp[2] + 'mm ' + pp[3] + 'mm!important}',
      '#lbl-grid{',
      '  grid-template-columns:repeat(' + preset.cols + ',' + preset.width + 'mm)!important;',
      '  grid-template-rows:repeat(' + preset.rows + ',' + preset.height + 'mm)!important;',
      '  column-gap:' + preset.gapX + 'mm!important;',
      '  row-gap:' + preset.gapY + 'mm!important;',
      '}',
      '#tab-label .lc{',
      '  width:' + preset.width + 'mm!important;',
      '  height:' + preset.height + 'mm!important;',
      '  min-height:' + preset.height + 'mm!important;',
      '  max-height:' + preset.height + 'mm!important;',
      '  padding:' + pad[0] + 'mm ' + pad[1] + 'mm ' + pad[2] + 'mm ' + pad[3] + 'mm!important;',
      '  gap:' + preset.gapX * 0.4 + 'mm!important;',
      '}',
      '#tab-label .lc.empty{height:' + preset.height + 'mm!important;min-height:' + preset.height + 'mm!important;max-height:' + preset.height + 'mm!important}',
      '#tab-label .qb{width:' + qr + 'mm!important;height:' + qr + 'mm!important;min-width:' + qr + 'mm!important;max-width:' + qr + 'mm!important;min-height:' + qr + 'mm!important;max-height:' + qr + 'mm!important}',
      '#tab-label .qb img,#tab-label .qb canvas,#tab-label .qb svg{width:' + qr + 'mm!important;height:' + qr + 'mm!important;max-width:' + qr + 'mm!important;max-height:' + qr + 'mm!important}',
      '#tab-label .qb table{width:' + qrT + 'mm!important;height:' + qrT + 'mm!important;max-width:' + qrT + 'mm!important;max-height:' + qrT + 'mm!important}',
      '#tab-label .ln{font-size:' + preset.nameFont + 'pt!important}',
      '#tab-label .lb{font-size:' + preset.codeFont + 'pt!important}',
      '#tab-label .ls,#tab-label .lcat,#tab-label .lu{font-size:' + preset.specFont + 'pt!important}',
      '}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'lbl-print-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ── HTML 이스케이프 ── */
  function lblEsc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── 메시지 표시 ── */
  var _labelMsgTimer = null;
  function lblShowMsg(txt, bg) {
    var el = document.getElementById('lbl-msg');
    if (!el) return;
    el.textContent = txt;
    el.style.background = bg || '#0F2448';
    el.style.display = 'block';
    clearTimeout(_labelMsgTimer);
    _labelMsgTimer = setTimeout(function () { el.style.display = 'none'; }, 3500);
  }

  /* ── 슬롯 카운트 업데이트 ── */
  function updCnt() {
    var filled = global.labelSLOTS.filter(function (s) { return !!s; }).length;
    var total = getTotalSlots();
    var badge = document.getElementById('lbl-slot-badge');
    if (badge) badge.textContent = filled + '/' + total + ' 슬롯';
    var hc = document.getElementById('lbl-hd-cnt');
    if (hc) hc.textContent = global.labelALL.length + '품목';
  }

  /* ── QR 생성 (기존 label-qrcode.min.js 의 QRCode 재사용) ── */
  function makeQR(container, text, size) {
    console.log('[KY-LP] makeQR data=', text);
    container.innerHTML = '';
    size = size || 84;
    var ok = tryQR(container, text, QRCode.CorrectLevel.L, size);
    if (!ok) {
      var fallback = (text || '').split(' ')[0];
      tryQR(container, fallback, QRCode.CorrectLevel.L, size);
    }
  }

  function tryQR(container, text, level, size) {
    container.innerHTML = '';
    size = size || 84;
    try {
      new QRCode(container, {
        text: text || ' ',
        width: size, height: size,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: level
      });
      setTimeout(function () {
        var px = size + 'px';
        var img = container.querySelector('img');
        if (img) img.style.cssText = 'display:block;width:' + px + ';height:' + px + ';max-width:' + px + ';max-height:' + px;
        var cvs = container.querySelector('canvas');
        if (cvs) cvs.style.cssText = 'display:block;width:' + px + ';height:' + px + ';max-width:' + px + ';max-height:' + px;
      }, 80);
      return true;
    } catch (err) {
      container.style.cssText = 'background:#eee;display:flex;align-items:center;justify-content:center;font-size:9px;color:#666';
      container.textContent = 'QR오류';
      return false;
    }
  }

  /* ── 그리드 렌더링 ── */
  function renderGrid() {
    var key = getCurrentPresetKey();
    console.log('[KY-LP] renderGrid preset=', key);
    var grid = document.getElementById('lbl-grid');
    if (!grid) return;
    ensureLabelSlots();
    var preset = getCurrentPreset();

    grid.style.gridTemplateColumns = 'repeat(' + preset.cols + ', 1fr)';
    grid.style.maxWidth = preset.cols <= 2 ? '920px' : 'none';

    /* QR 크기(px): 화면 기준 96dpi 환산 */
    var qrPx = Math.round(preset.qr * 3.7795);

    grid.innerHTML = '';
    global.labelSLOTS.forEach(function (slot, i) {
      var card = document.createElement('div');
      card.className = 'lc' + (slot ? '' : ' empty');
      card.setAttribute('data-preset', preset.key);

      var sno = document.createElement('div');
      sno.className = 'sno';
      sno.textContent = '#' + (i + 1);
      card.appendChild(sno);

      if (slot) {
        var rm = document.createElement('button');
        rm.className = 'brm';
        rm.innerHTML = '&#10005;';
        (function (idx) {
          rm.onclick = function () { global.labelSLOTS[idx] = null; renderGrid(); updCnt(); };
        })(i);
        card.appendChild(rm);

        var qb = document.createElement('div');
        qb.className = 'qb';
        qb.style.cssText = 'width:' + qrPx + 'px;height:' + qrPx + 'px;min-width:' + qrPx + 'px;max-width:' + qrPx + 'px;flex-shrink:0;overflow:hidden';
        card.appendChild(qb);

        var li = document.createElement('div');
        li.className = 'li';
        if (preset.key === '3x8') {
          li.style.cssText = 'flex:1;min-width:0;overflow:hidden;font-size:' + preset.nameFont + 'pt';
        }
        li.innerHTML =
          '<div class="lbr">' +
          (slot.c ? '<span class="lcat">' + lblEsc(slot.c) + '</span>' : '') +
          (slot.u ? '<span class="lu">' + lblEsc(slot.u) + '</span>' : '') +
          '</div>' +
          '<div class="ln">' + lblEsc(slot.n) + '</div>' +
          (slot.s ? '<div class="ls">' + lblEsc(slot.s) + '</div>' : '') +
          '<div class="lb">' + lblEsc(slot.b) + '</div>';
        card.appendChild(li);

        (function (el, text, delay, sz) {
          setTimeout(function () { makeQR(el, text, sz); }, delay);
        })(qb, slot.b, i * 30, qrPx);
      } else {
        var et = document.createElement('div');
        et.className = 'et';
        et.textContent = '빈 슬롯';
        card.appendChild(et);
      }
      grid.appendChild(card);
    });
    updCnt();
  }

  /* ── KY 품목마스터 → 라벨 아이템 변환
     KY 마스터 키: code/itemCode/barcode/품목코드, name/itemName/품목명,
                   spec/규격/model, category/분류, unit/단위 ── */
  function masterToLabelItem(r) {
    var code = String(r.code || r.itemCode || r.barcode || r['품목코드'] || '').trim();
    if (!code) return null;
    return {
      b: code,
      n: String(r.name || r.itemName || r['품목명'] || '').trim(),
      s: String(r.spec || r['규격'] || r.model || '').trim(),
      c: String(r.category || r['분류'] || '').trim(),
      u: String(r.unit || r['단위'] || 'EA').trim() || 'EA'
    };
  }

  /* ── 전체 품목 목록 재구성 ── */
  function rebuildLabelItems() {
    if (typeof global.getMaster !== 'function') return;
    global.labelALL = global.getMaster().map(masterToLabelItem).filter(Boolean);
    global.labelALL.sort(function (a, b) {
      return a.b < b.b ? -1 : a.b > b.b ? 1 : 0;
    });
    var hc = document.getElementById('lbl-hd-cnt');
    if (hc) hc.textContent = global.labelALL.length + '품목';
  }

  /* ── 자동완성: 검색 결과 반환 ── */
  function _pick(item) {
    var qty = parseInt(document.getElementById('lbl-qty').value, 10) || 1;
    var ssVal = parseInt(document.getElementById('lbl-ss').value, 10);
    var maxSlots = getTotalSlots();
    var start;
    if (!ssVal) {
      var lastFilled = -1;
      for (var i = 0; i < maxSlots; i++) { if (global.labelSLOTS[i]) lastFilled = i; }
      start = lastFilled + 2;
      if (start > maxSlots) start = 1;
    } else {
      start = ssVal;
    }
    var added = 0, idx = start - 1;
    while (added < qty && idx < maxSlots) { global.labelSLOTS[idx] = item; added++; idx++; }
    renderGrid();
    lblShowMsg(added + '개 추가: ' + item.n);
    document.getElementById('lbl-q').value = '';
    hideSugg();
  }

  /* ── pickFirstOrDirect: QR 스캔 등 직접 코드 입력 처리 ── */
  function pickFirstOrDirect(val) {
    val = (val || '').trim();
    if (!val) return;
    var res = qRes(val);
    if (res.length) {
      _pick(res[0]);
    } else {
      /* 마스터에 없어도 코드만으로 라벨 생성 */
      _pick({ b: val, n: val, s: '', c: '', u: 'EA' });
    }
  }

  /* ── 검색 결과 목록 ── */
  function qRes(v) {
    if (v === undefined) {
      var el = document.getElementById('lbl-q');
      v = el ? el.value.trim().toLowerCase() : '';
    } else {
      v = v.toLowerCase();
    }
    if (!v) return [];
    return (global.labelALL || []).filter(function (it) {
      return it.b.toLowerCase().indexOf(v) >= 0 ||
        it.n.toLowerCase().indexOf(v) >= 0 ||
        (it.s || '').toLowerCase().indexOf(v) >= 0;
    }).slice(0, 25);
  }

  /* ── 자동완성 드롭다운 렌더링 ── */
  function onQ() {
    var res = qRes();
    var sugg = document.getElementById('lbl-sugg');
    if (!res.length) { sugg.style.display = 'none'; return; }
    sugg.innerHTML = '';
    res.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'lbl-si';
      row.innerHTML =
        '<span class="lbl-sb">' + lblEsc(it.c || '-') + '</span>' +
        '<span class="lbl-sm">' + lblEsc(it.b) + '</span>' +
        '<span>' + lblEsc(it.n) + '</span>' +
        (it.s ? '<span style="font-size:11px;color:#888">' + lblEsc(it.s) + '</span>' : '');
      (function (item) { row.onclick = function () { _pick(item); }; })(it);
      sugg.appendChild(row);
    });
    sugg.style.display = 'block';
  }

  /* ── 자동완성 닫기 ── */
  function hideSugg() {
    var sugg = document.getElementById('lbl-sugg');
    if (sugg) sugg.style.display = 'none';
  }

  /* ── 슬롯 선택 옵션 업데이트 ── */
  function updateSSOptions() {
    var ss = document.getElementById('lbl-ss');
    if (!ss) return;
    var total = getTotalSlots();
    var prev = ss.value;
    ss.innerHTML = '<option value="0">자동</option>';
    for (var i = 1; i <= total; i++) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = '#' + i;
      ss.appendChild(opt);
    }
    var prevN = parseInt(prev, 10);
    if (prevN > 0 && prevN <= total) ss.value = prev;
    else ss.value = '0';
  }

  /* ── 프리셋 변경 핸들러 ── */
  function onPresetChange() {
    var total = getTotalSlots();
    while (global.labelSLOTS.length < total) global.labelSLOTS.push(null);
    if (global.labelSLOTS.length > total) global.labelSLOTS = global.labelSLOTS.slice(0, total);
    updateSSOptions();
    renderGrid();
    updCnt();
  }

  /* ── 전체 초기화 ── */
  function clearAll() {
    var total = getTotalSlots();
    global.labelSLOTS = new Array(total).fill(null);
    renderGrid();
    updCnt();
    lblShowMsg('전체 초기화');
  }

  /* ── 인쇄 ── */
  function doPrint() {
    if (global.labelSLOTS.every(function (s) { return !s; })) {
      lblShowMsg('슬롯에 품목을 먼저 추가하세요');
      return;
    }
    var preset = getCurrentPreset();
    injectPrintStyle(preset);
    document.querySelectorAll('#lbl-grid .qb canvas').forEach(function (cvs) {
      if (!cvs.parentNode.querySelector('img.qb-print-img')) {
        var img = document.createElement('img');
        img.className = 'qb-print-img';
        img.src = cvs.toDataURL('image/png');
        img.style.cssText = 'display:block;width:84px;height:84px;max-width:84px;max-height:84px';
        cvs.parentNode.appendChild(img);
      }
    });
    setTimeout(function () {
      window.print();
      setTimeout(function () {
        var st = document.getElementById('lbl-print-css');
        if (st) st.parentNode.removeChild(st);
        document.querySelectorAll('#lbl-grid .qb img.qb-print-img').forEach(function (img) {
          img.parentNode.removeChild(img);
        });
      }, 500);
    }, 300);
  }

  /* ── 라벨 탭 초기화 ── */
  var _labelTabInited = false;
  function init() {
    console.log('[KY-LP] init called');
    if (_labelTabInited) return;
    _labelTabInited = true;

    if (!Array.isArray(global.labelALL)) global.labelALL = [];
    if (!Array.isArray(global.labelSLOTS)) global.labelSLOTS = [];

    ensureLabelSlots();
    updateSSOptions();
    rebuildLabelItems();
    renderGrid();

    var qEl = document.getElementById('lbl-q');
    if (qEl) {
      qEl.addEventListener('input', onQ);
      qEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var v = qEl.value.trim();
          if (v) pickFirstOrDirect(v);
        }
        if (e.key === 'Escape') hideSugg();
      });
    }
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#lbl-sw')) hideSugg();
    });
  }

  /* ── 공개 API ── */
  global.LabelPrint = {
    init: init,
    renderGrid: renderGrid,
    makeQR: makeQR,
    doPrint: doPrint,
    clearAll: clearAll,
    pick: _pick,
    pickFirstOrDirect: pickFirstOrDirect,
    onQ: onQ,
    hideSugg: hideSugg,
    onPresetChange: onPresetChange,
    rebuildLabelItems: rebuildLabelItems,
    getCurrentPreset: getCurrentPreset,
    getTotalSlots: getTotalSlots,
    ensureLabelSlots: ensureLabelSlots,
    applyLabelVars: applyLabelVars,
    updCnt: updCnt
  };

  console.log('[KY-LP] LabelPrint module ready');

})(window);

/* ── 글로벌 브릿지: 기존 HTML onclick 핸들러와 하위 호환 ── */
window.renderGrid      = function ()       { window.LabelPrint && window.LabelPrint.renderGrid(); };
window.makeQR          = function (c, t, s){ window.LabelPrint && window.LabelPrint.makeQR(c, t, s); };
window.doPrint         = function ()       { window.LabelPrint && window.LabelPrint.doPrint(); };
window.clearAll        = function ()       { window.LabelPrint && window.LabelPrint.clearAll(); };
window.onPresetChange  = function ()       { window.LabelPrint && window.LabelPrint.onPresetChange(); };
window.initLabelTab    = function ()       { window.LabelPrint && window.LabelPrint.init(); };
window.rebuildLabelItems = function ()     { window.LabelPrint && window.LabelPrint.rebuildLabelItems(); };
window.pick            = function (item)   { window.LabelPrint && window.LabelPrint.pick(item); };
window.hideSugg        = function ()       { window.LabelPrint && window.LabelPrint.hideSugg(); };
window.onQ             = function ()       { window.LabelPrint && window.LabelPrint.onQ(); };
window.updCnt          = function ()       { window.LabelPrint && window.LabelPrint.updCnt(); };
console.log('[KY-LP] global bridges registered');
