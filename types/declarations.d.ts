// Ambient type declarations for IDE when node_modules is not installed locally

declare namespace React {
  export type ReactNode = any;
  export type ReactElement = any;
  export type FC<P = {}> = (props: P) => any;
  export interface ChangeEvent<T = any> {
    target: T & { value: string; [key: string]: any };
    currentTarget: T & { value: string; [key: string]: any };
    [key: string]: any;
  }
  export interface MouseEvent<T = any> {
    target: T;
    currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
    [key: string]: any;
  }
  export interface KeyboardEvent<T = any> {
    key: string;
    code: string;
    target: T;
    currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
    [key: string]: any;
  }
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
  interface DOMAttributes<T = any> {
    children?: React.ReactNode;
    onChange?: (event: React.ChangeEvent<T>) => void;
    onClick?: (event: React.MouseEvent<T>) => void;
    onKeyDown?: (event: React.KeyboardEvent<T>) => void;
    onKeyUp?: (event: React.KeyboardEvent<T>) => void;
    onSubmit?: (event: any) => void;
    [key: string]: any;
  }

  interface HTMLAttributes<T = any> extends DOMAttributes<T> {
    className?: string;
    style?: any;
    id?: string;
    name?: string;
    value?: any;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    open?: boolean;
    href?: string;
    target?: string;
    rel?: string;
    src?: string;
    alt?: string;
    [key: string]: any;
  }

  interface IntrinsicElements {
    input: HTMLAttributes<HTMLInputElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    [elemName: string]: HTMLAttributes<any>;
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

  export interface Viewport {
    themeColor?: string;
    width?: string;
    initialScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
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

  export const Bell: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Dumbbell: LucideIcon;
  export const Download: LucideIcon;
  export const Flame: LucideIcon;
  export const Library: LucideIcon;
  export const MinusCircle: LucideIcon;
  export const PlayCircle: LucideIcon;
  export const Plus: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Save: LucideIcon;
  export const Search: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Timer: LucideIcon;
  export const Trash2: LucideIcon;
  export const Trophy: LucideIcon;
  export const Volume2: LucideIcon;
  export const X: LucideIcon;
}
