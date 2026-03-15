# React Components

## Domain
React 18 functional components used across the Remotion compositions and editor UI. All UI is built with functional components, hooks, and TypeScript.

## Key Files
- `src/remotion/components/HookTitle.tsx` — Persistent title bar component
- `src/remotion/components/BilingualCaption.tsx` — Bilingual subtitle renderer
- `src/remotion/components/HighlightedText.tsx` — Vocabulary word highlighting
- `src/remotion/components/VocabCard.tsx` — Pop-up vocabulary card
- `src/remotion/ClipComposition.tsx` — Root composition component
- `src/remotion/editor/App.tsx` — Editor UI root component

## Common Operations
- **Create a component:** `const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => { ... }`
- **Use frame for animation:** `const frame = useCurrentFrame()` (Remotion only)
- **Manage local state:** `const [value, setValue] = useState(initialValue)`
- **Run side effects:** `useEffect(() => { ... }, [deps])`
- **Memoize callbacks:** `const handler = useCallback(() => { ... }, [deps])`
- **Ref a DOM element:** `const ref = useRef<HTMLDivElement>(null)`
- **Complex state:** `const [state, dispatch] = useReducer(reducer, initialState)`
- **Shared context:** `const value = useContext(MyContext)`

## Patterns & Conventions
- All components are functional (no class components)
- TypeScript with explicit prop interfaces
- Inline styles everywhere (no CSS modules, no external CSS)
- Components receive ClipData, SubtitleSegment[], or VocabCard[] as props
- Remotion components use useCurrentFrame() and useVideoConfig() for timing
- Editor components use useState for local state management
- Props are destructured in the function signature

## Gotchas
- useCurrentFrame() only works inside a Remotion Composition context — do not use in editor components
- Remotion components cannot use browser APIs (window, document, localStorage) during render
- useEffect cleanup is important — always return cleanup functions for subscriptions/timers
- Inline styles use camelCase properties (e.g., `fontSize` not `font-size`)
- React 18 strict mode double-invokes effects in development — design effects to be idempotent
- Avoid heavy computations inside render — memoize with useMemo or useCallback
