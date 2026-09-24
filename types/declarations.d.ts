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
    lang?: string;
    [key: string]: any;
  }

  interface IntrinsicElements {
    html: HTMLAttributes<HTMLHtmlElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    input: HTMLAttributes<HTMLInputElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    [elemName: string]: HTMLAttributes<any>;
  }
  interface Element extends React.ReactElement {}
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    manifest?: string;
    icons?: any;
    applicationName?: string;
    formatDetection?: any;
    appleWebApp?: any;
    [key: string]: any;
  }

  export interface Viewport {
    themeColor?: string;
    width?: string;
    initialScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
    viewportFit?: string;
    interactiveWidget?: string;
    colorScheme?: string;
    [key: string]: any;
  }
}

declare module "tailwindcss" {
  export interface Config {
    [key: string]: any;
  }
  const config: Config;
  export default config;
}

