# React 19 Reference Guide

> 출시일: 2024년 12월 (v19.0.0)
> 최신 버전: 19.2.3 (2025년 12월)

## 주요 새 기능

### 1. `use` API
Promise와 Context를 렌더링 중에 읽는 새로운 방법.

```typescript
import { use } from 'react';

// Promise 읽기 (Suspense 필요)
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

function Page({ commentsPromise }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}

// Context 조건부 읽기 (early return 후에도 가능)
function Heading({ children }) {
  if (children == null) return null;

  const theme = use(ThemeContext);
  return <h1 style={{ color: theme.color }}>{children}</h1>;
}
```

### 2. `useActionState`
Action의 상태를 관리하는 새 hook.

```typescript
import { useActionState } from 'react';

function Form() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get("name"));
      if (error) return error;
      redirect("/success");
      return null;
    },
    null // 초기값
  );

  return (
    <form action={submitAction}>
      <input name="name" />
      <button disabled={isPending}>저장</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### 3. `useFormStatus`
부모 `<form>`의 상태를 읽는 hook.

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>제출</button>;
}
```

### 4. `useOptimistic`
낙관적 업데이트 관리.

```typescript
import { useOptimistic } from 'react';

function ChangeName({ currentName, onUpdate }) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  const submitAction = async (formData) => {
    const newName = formData.get("name");
    setOptimisticName(newName); // 즉시 UI 업데이트
    const result = await updateName(newName);
    onUpdate(result);
  };

  return (
    <form action={submitAction}>
      <p>현재 이름: {optimisticName}</p>
      <input name="name" />
    </form>
  );
}
```

### 5. `useTransition` (비동기 지원)
비동기 함수를 트랜지션에서 사용.

```typescript
import { useTransition } from 'react';

function UpdateName() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) setError(error);
    });
  };

  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? '저장 중...' : '저장'}
    </button>
  );
}
```

## Server Actions

### `"use server"` 지시자
```typescript
// actions.ts
'use server';

export async function updateUser(formData: FormData) {
  const name = formData.get('name');
  await db.users.update({ name });
}

// component.tsx
import { updateUser } from './actions';

function UserForm() {
  return (
    <form action={updateUser}>
      <input name="name" />
      <button>저장</button>
    </form>
  );
}
```

### Form Actions
```typescript
// 직접 함수 전달
<form action={async (formData) => {
  'use server';
  await saveData(formData);
}}>
  <input name="email" />
  <button>제출</button>
</form>
```

## 개선된 기능

### ref as prop (forwardRef 불필요)
```typescript
// Before
const MyInput = forwardRef(({ placeholder }, ref) => {
  return <input placeholder={placeholder} ref={ref} />;
});

// After (React 19)
function MyInput({ placeholder, ref }) {
  return <input placeholder={placeholder} ref={ref} />;
}
```

### ref 정리 함수
```typescript
<input
  ref={(ref) => {
    // ref 생성
    return () => {
      // ref 정리 (언마운트 시)
    };
  }}
/>
```

### Context as Provider
```typescript
const ThemeContext = createContext('light');

// Before
<ThemeContext.Provider value="dark">

// After
<ThemeContext value="dark">
```

### Document Metadata
컴포넌트에서 직접 메타데이터 렌더링.

```typescript
function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <title>{post.title}</title>
      <meta name="author" content={post.author} />
      <meta name="keywords" content={post.keywords} />
      <p>{post.content}</p>
    </article>
  );
}
```

### 리소스 프리로딩
```typescript
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function MyComponent() {
  preinit('https://example.com/script.js', { as: 'script' });
  preload('https://example.com/font.woff', { as: 'font' });
  preconnect('https://example.com');
  prefetchDNS('https://example.com');
}
```

## 에러 처리 개선

```typescript
const root = createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    // Error Boundary에서 잡은 에러
  },
  onUncaughtError: (error, errorInfo) => {
    // 잡히지 않은 에러
  },
  onRecoverableError: (error, errorInfo) => {
    // 자동 복구된 에러
  }
});
```

## React 19.2 추가 기능

### View Transitions
```typescript
import { startTransition } from 'react';

function App() {
  const handleClick = () => {
    startTransition(() => {
      // View Transition 애니메이션과 함께 상태 업데이트
      setCurrentPage(nextPage);
    });
  };
}
```

### useEffectEvent
```typescript
import { useEffectEvent } from 'react';

function Page() {
  const onAnalytics = useEffectEvent((value) => {
    // props 변경 시 다시 실행되지 않음
    analytics.send(value);
  });

  useEffect(() => {
    onAnalytics(currentValue);
  }, [currentValue]);
}
```

### Activity 컴포넌트
```typescript
import { Activity } from 'react';

function App() {
  return (
    <Activity>
      {/* display: none으로 숨기면서 상태 유지 */}
      <BackgroundTask />
    </Activity>
  );
}
```

## useDeferredValue 초기값
```typescript
function Search({ query }) {
  // 초기 렌더링에서 '' 사용, 이후 query로 재렌더링
  const deferredQuery = useDeferredValue(query, '');
  return <Results query={deferredQuery} />;
}
```

## 주요 Breaking Changes

1. **Strict Mode** 이중 렌더링 개선
2. **Legacy Context** 완전 제거
3. **string refs** 제거 (`ref="myRef"`)
4. **defaultProps** for function components 제거 (default parameters 사용)

## 참고 문서
- [React 19 공식 블로그](https://react.dev/blog/2024/12/05/react-19)
- [React 19 업그레이드 가이드](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 문서](https://react.dev)
