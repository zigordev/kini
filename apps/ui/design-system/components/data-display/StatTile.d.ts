import * as React from 'react';

export interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  direction?: 'up' | 'down' | 'flat';
  hint?: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
  style?: React.CSSProperties;
}

export declare function StatTile(props: StatTileProps): JSX.Element;
