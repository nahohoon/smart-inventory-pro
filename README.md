# 스마트공장 재고·물류관리 시스템 v9

> 단일 HTML · GitHub Pages 배포형 · Google Sheets 연동

---

## 🚀 GitHub Pages 배포

1. 저장소를 GitHub에 Push
2. Settings → Pages → Source: `Deploy from a branch`
3. Branch: `main` / Folder: `/docs` → Save
4. `https://{username}.github.io/{repo}` 접속

---

## 🔗 Google Apps Script 연동 (CORS 완전 대응)

### 1단계 — 스프레드시트 준비

| 시트명 | 컬럼 구성 |
|--------|-----------|
| `입출고이력` | A:날짜 B:구분 C:품목코드 D:품목명 E:수량 F:입고가격 G:출고가격 H:창고 I:현장명 J:담당자 K:비고 |
| `품목마스터` | A:품목코드 B:품목명 C:규격 D:단위 E:안전재고 |

### 2단계 — Code.gs 설정

1. Google Sheets → 확장 프로그램 → Apps Script
2. `Code.gs` 내용을 이 저장소의 `Code.gs` 파일로 교체
3. 파일 상단 `SS_ID` 변수에 스프레드시트 ID 입력
   - 스프레드시트 URL: `.../spreadsheets/d/★이부분★/edit`

### 3단계 — Apps Script 배포 (⚠️ 핵심 설정)

```
배포 → 새 배포 → 유형: 웹 앱
  실행 계정  : 나 (본인 구글 계정)
  액세스 권한: 모든 사용자 (익명 포함)  ← 반드시 이 옵션
→ 배포 → URL 복사
```

> URL 형식: `https://script.google.com/macros/s/AKf.../exec`

### 4단계 — 시스템 설정에서 URL 입력

1. 시스템 로그인 → 시스템 설정
2. Apps Script URL 붙여넣기
3. 저장방식: `Google Sheets 저장` 선택
4. **연결 테스트** 버튼 클릭 → ✅ 연결 정상

---

## 📱 모바일 최적화

하단 네비게이션 바로 3개 핵심 화면 즉시 전환:

| 화면 | 모바일 UI |
|------|-----------|
| 입출고 등록 | 1열 레이아웃 · 터치 최적화 버튼 |
| 재고 조회 | 카드형 리스트 · 실시간 검색 |
| 부족재고 | 카드형 · 배지 알림 |

☰ 햄버거 메뉴 → 전체 탭(이력·마스터·통계·설정) 접근

---

## ⚙️ 고객사 커스터마이징

`docs/index.html` 상단 CONFIG 블록만 수정:

```javascript
var CONFIG = {
  CLIENT_ID:  'osung',              // 영문 소문자
  COMPANY:    '오성정공 재고시스템',
  LOGO_TEXT:  'OS',
  THEME_C1:   '#1e3a8a',           // 설정 탭에서도 변경 가능
  THEME_C2:   '#2563eb',
  GAS_URL:    '',                   // 배포 후 설정 탭에서 입력
  WAREHOUSES: ['본사창고', '지점창고'],
  USERS: [
    { id: 'admin', pw: 'admin1234', name: '관리자', role: 'admin' },
    { id: 'staff1', pw: '1234',     name: '담당자', role: 'staff' },
    { id: 'view1',  pw: '1234',     name: '조회자', role: 'viewer'}
  ]
};
```

---

## 🔧 GAS 연결 오류 체크리스트

| 증상 | 원인 | 해결 |
|------|------|------|
| `Unexpected token '<'` | HTML 리다이렉트 수신 | CORS 대응 버전으로 Code.gs 교체 |
| `연결 실패 - HTTP 403` | 액세스 권한 설정 오류 | 배포 권한 → 모든 사용자로 재배포 |
| `JSONP 타임아웃` | 스프레드시트 ID 오류 | Code.gs의 SS_ID 재확인 |
| `action 오류` | 구버전 Code.gs | 이 저장소의 Code.gs로 교체 |

---

## 📁 저장소 구조

```
/
├── docs/
│   └── index.html   ← 단일 파일 시스템
├── Code.gs          ← Apps Script (복사해서 사용)
├── _config.yml      ← GitHub Pages 설정
├── README.md
└── .gitignore
```
