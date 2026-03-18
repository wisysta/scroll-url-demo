# HubSpot 시뮬레이션 (정적 HTML/CSS/JS)

## 로컬 실행 (Python http.server)

프로젝트 루트에서:

```bash
npm run serve
```

또는 직접:

```bash
cd hubspot-sim && python3 -m http.server 8080
```

브라우저: http://localhost:8080/branding.html

## Vercel 배포

1. Vercel 대시보드에서 프로젝트 연결
2. **Root Directory**를 `hubspot-sim`으로 설정
3. Deploy (빌드 없음, 정적 파일만 배포)

배포 후 URL 예: `https://xxx.vercel.app/branding.html`, `/campaign.html`, `/digital.html`
