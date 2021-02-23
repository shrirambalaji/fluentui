import { IStyle } from '@fluentui/style-utilities';
import { Theme } from '@fluentui/theme';
import { useTheme } from './useTheme';
import { useWindow } from '@fluentui/react-window-provider';
import { mergeStylesRenderer } from './styleRenderers/mergeStylesRenderer';

const graphGet = (graphNode: Map<any, any>, path: any[]): any | undefined => {
  for (const key of path) {
    graphNode = graphNode.get(key);

    if (!graphNode) {
      return;
    }
  }

  return graphNode;
};

const graphSet = (graphNode: Map<any, any>, path: any[], value: any) => {
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    let current = graphNode.get(key);

    if (!current) {
      current = new Map();

      graphNode.set(key, current);
    }

    graphNode = current;
  }

  graphNode.set(path[path.length - 1], value);
};

/** Options that can be provided to the hook generated by `makeStyles`. */
export type UseStylesOptions = {
  theme?: Theme;
};

/**
 * Registers a css object, optionally as a function of the theme.
 *
 * @param styleOrFunction - Either a css javascript object, or a function which takes in `ITheme`
 * and returns a css javascript object.
 */
export function makeStyles<TStyleSet extends { [key: string]: IStyle }>(
  styleOrFunction: TStyleSet | ((theme: Theme) => TStyleSet),
): (options?: UseStylesOptions) => { [key in keyof TStyleSet]: string } {
  // Create graph of inputs to map to output.
  const graph = new Map();

  return (options: UseStylesOptions = {}) => {
    let { theme } = options;
    const win = useWindow();
    const contextualTheme = useTheme();

    theme = theme || contextualTheme;
    const renderer = mergeStylesRenderer;

    const id = renderer.getId();
    const isStyleFunction = typeof styleOrFunction === 'function';
    const path = isStyleFunction ? [id, win, theme] : [id, win];
    let value = graphGet(graph, path);

    if (!value) {
      const styles = isStyleFunction ? (styleOrFunction as (theme: Theme) => TStyleSet)(theme!) : styleOrFunction;

      value = mergeStylesRenderer.renderStyles(styles, { targetWindow: win, rtl: !!theme!.rtl });
      graphSet(graph, path, value);
    }

    return value;
  };
}
