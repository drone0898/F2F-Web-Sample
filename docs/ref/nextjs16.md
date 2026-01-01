# Next.js 16 Reference Guide

> 출시일: 2025년 10월 21일
> 본 프로젝트 버전: 16.1.1

## 주요 특징

### 1. Turbopack (기본 번들러)
- **개발/프로덕션 모두 기본 번들러**로 채택
- 2-5배 빠른 프로덕션 빌드
- 최대 10배 빠른 Fast Refresh

```bash
# Turbopack 사용 (기본)
npm run dev

# Webpack으로 전환 (필요시)
next dev --webpack
next build --webpack
```

### 2. Cache Components (`"use cache"`)
명시적 캐싱 모델로 PPR(Partial Pre-Rendering) 완성.

```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};

// 페이지에서 사용
'use cache';

export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### 3. React Compiler (Stable)
자동 메모이제이션으로 불필요한 리렌더링 방지.

```typescript
// next.config.ts
const nextConfig = {
  reactCompiler: true,
};
```

```bash
# 필수 의존성
npm install babel-plugin-react-compiler@latest
```

### 4. proxy.ts (구 middleware.ts)
네트워크 경계를 명확히 하는 새로운 방식.

```typescript
// proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}
```

- `middleware.ts` → `proxy.ts` 이름 변경
- Node.js 런타임 사용
- Edge 런타임은 deprecated

### 5. React 19.2 통합
App Router는 React 19.2 사용:
- View Transitions
- `useEffectEvent` hook
- Activity 컴포넌트

## API 변경사항

### 비동기 params/searchParams (필수)
```typescript
// Before (오류)
export default function Page({ params, searchParams }) {
  const id = params.id;
}

// After (필수)
export default async function Page({ params, searchParams }) {
  const id = (await params).id;
  const query = (await searchParams).q;
}
```

### 비동기 cookies/headers
```typescript
// Before
const cookieStore = cookies();

// After
const cookieStore = await cookies();
const headerList = await headers();
```

### revalidateTag 변경
```typescript
// Before (deprecated)
revalidateTag('blog-posts');

// After (필수 - cacheLife 프로필)
revalidateTag('blog-posts', 'max');
revalidateTag('news-feed', 'hours');
revalidateTag('products', { expire: 3600 });
```

### 새로운 캐시 함수
```typescript
// updateTag - Server Actions에서만, 즉시 반영
updateTag(`user-${userId}`);

// refresh - 캐시되지 않은 데이터만 새로고침
refresh();
```

## 버전 요구사항

| 항목 | 요구사항 |
|------|---------|
| Node.js | 20.9+ |
| TypeScript | 5.1+ |
| Chrome | 111+ |
| Safari | 16.4+ |

## 제거된 기능
- AMP 지원
- `next lint` 명령어
- `serverRuntimeConfig`, `publicRuntimeConfig`
- `experimental.ppr`, `experimental.dynamicIO`

## 프로젝트 설정

### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone", // Docker 배포용
};

export default nextConfig;
```

### 개발 서버
```bash
npm run dev        # Turbopack (기본)
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버
```

## 참고 문서
- [Next.js 16 공식 블로그](https://nextjs.org/blog/next-16)
- [업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 문서](https://nextjs.org/docs)
