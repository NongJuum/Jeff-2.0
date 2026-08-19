// Ambient type declarations for IDE when node_modules is not installed locally

declare namespace React {
  export type ReactNode = any;
  export type ReactElement = any;
  export type FC<P = {}> = (props: P) => any;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
}

declare module "react" {
  export = React;
  export as namespace React;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactElement {}
}

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    manifest?: string;
    icons?: any;
    [key: string]: any;
  }
}

declare module "lucide-react" {
  export interface LucideProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    className?: string;
    [key: string]: any;
  }
  export type LucideIcon = (props: LucideProps) => any;

  export const CalendarDays: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Dumbbell: LucideIcon;
  export const Flame: LucideIcon;
  export const Library: LucideIcon;
  export const MinusCircle: LucideIcon;
  export const PlayCircle: LucideIcon;
  export const Plus: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Save: LucideIcon;
  export const Search: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Trash2: LucideIcon;
  export const Trophy: LucideIcon;
}
