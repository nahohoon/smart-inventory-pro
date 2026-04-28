# KY 재고관리 흰색 기준 안정형 PWA 배포 파일

2026-04-28 안정본
- 품목등록 저장 복구
- 입출고 저장 복구
- PC/모바일 PWA 연동 정상
- 품목코드/품목명 자동완성 적용
- GitHub Pages 배포 정상

이 폴더 안의 파일들을 GitHub 저장소의 `docs` 폴더에 그대로 업로드하십시오.

## 업로드 대상
- index.html
- manifest.json
- sw.js
- icons/icon-192.png
- icons/icon-512.png

## 이번 버전 변경점
- manifest.json의 background_color를 #ffffff로 변경
- index.html의 background-color 메타값을 #ffffff로 변경
- 외부 브라우저/설치 앱 실행 시 검은 배경으로 순간 전환되는 현상 완화
- 기존 모바일 UI, GAS 연동, 로그인, 저장 로직은 유지

## GitHub Pages 확인
Settings → Pages에서 Branch가 `main`, Folder가 `/docs`인지 확인하십시오.

## 접속 확인 주소
https://nahohoon.github.io/smart-inventory-pro/?v=pwa-white-1

## 설치 안내
카톡 링크 클릭 후 카톡 내부 브라우저에서 우측 하단 점 3개 → 다른 브라우저 열기.
크롬 또는 삼성인터넷에서 우측 상단 점 3개 → 홈 화면에 추가 또는 앱 설치.
