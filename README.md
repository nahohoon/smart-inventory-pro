# 스마트공장 재고·물류관리 시스템 v9

> 단일 HTML 파일 기반 · GitHub Pages 배포형

## 🚀 GitHub Pages 배포 방법

1. 이 저장소를 GitHub에 Push
2. Settings → Pages → Source: `Deploy from a branch`
3. Branch: `main` / Folder: `/docs` 선택 → Save
4. 배포 완료 후 `https://{username}.github.io/{repo}` 접속

## 📁 구조

```
/
├── docs/
│   └── index.html   ← 메인 시스템 파일 (단일 파일 동작)
├── _config.yml      ← GitHub Pages 설정
└── README.md        ← 이 파일
```

## ⚙️ 고객사 커스터마이징

`docs/index.html` 상단 `CONFIG` 블록만 수정:

```javascript
var CONFIG = {
  CLIENT_ID:  'osung',              // 영문 소문자 (localStorage 키)
  COMPANY:    '오성정공 재고시스템', // 화면 표시 회사명
  LOGO_TEXT:  'OS',                 // 로고 2~3자
  THEME_C1:   '#1e3a8a',           // 기본 컬러 (설정 탭에서도 변경 가능)
  THEME_C2:   '#2563eb',
  GAS_URL:    '',                   // Google Apps Script URL
  WAREHOUSES: ['본사창고', '지점창고'],
  USERS: [
    { id: 'admin', pw: 'admin1234', name: '관리자', role: 'admin' },
    ...
  ]
};
```

## 📱 모바일 최적화 화면

| 화면 | 최적화 내용 |
|------|------------|
| 입출고 등록 | 큰 터치 버튼, 1열 폼 레이아웃 |
| 재고 조회 | 카드형 리스트, 실시간 검색 |
| 부족재고 | 카드형 긴급도 표시, 배지 알림 |

하단 네비게이션 바로 3개 화면 즉시 전환

## 🔗 주요 기능

- 바코드 스캔 입출고 등록
- 입출고 이력 11컬럼 + 누적재고
- 다중 필터 · 엑셀/CSV 다운로드
- Google Sheets 자동 동기화 (10초 간격)
- 컬러 테마 6종 (설정 탭)
- 세션 자동복구 (8시간)
- 오프라인 동작 (localStorage)
