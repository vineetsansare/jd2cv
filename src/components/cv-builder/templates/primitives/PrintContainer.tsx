import React from 'react';
import type { CVThemeSettings } from '../../../../types/cvBuilder';

interface PrintContainerProps {
  theme: CVThemeSettings;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const PrintContainer: React.FC<PrintContainerProps> = ({
  theme,
  className = '',
  children,
  style = {}
}) => {
  // Compute typography font sizes
  const baseSizeMap = {
    compact: { base: '8.8pt', h1: '17pt', h2: '11.5pt', h3: '9.8pt', small: '8pt', padding: '24px 28px' },
    standard: { base: '9.6pt', h1: '19pt', h2: '12.5pt', h3: '10.5pt', small: '8.5pt', padding: '34px 38px' },
    spacious: { base: '10.5pt', h1: '21pt', h2: '13.5pt', h3: '11.5pt', small: '9pt', padding: '44px 48px' }
  };

  const density = theme.fontSize || 'standard';
  const sizes = baseSizeMap[density] || baseSizeMap.standard;

  // Margin overrides
  const marginPadding = theme.pageMargin === 'compact' 
    ? '24px 28px' 
    : theme.pageMargin === 'spacious' 
      ? '44px 48px' 
      : sizes.padding;

  const lineHeightVal = theme.lineHeight === 'tight' ? 1.4 : theme.lineHeight === 'relaxed' ? 1.7 : 1.55;
  const accent = theme.accentColor || '#2563eb';
  const fontFamily = theme.fontFamily || 'Plus Jakarta Sans';

  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '794px',
    minHeight: '1123px',
    margin: '0 auto',
    padding: marginPadding,
    backgroundColor: '#ffffff',
    color: '#1e293b',
    fontFamily: `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    fontSize: sizes.base,
    lineHeight: lineHeightVal,
    boxSizing: 'border-box',
    position: 'relative',
    // Inject CSS variables for deep child components
    ['--cv-accent' as any]: accent,
    ['--cv-font-family' as any]: fontFamily,
    ['--cv-font-size-base' as any]: sizes.base,
    ['--cv-font-size-h1' as any]: sizes.h1,
    ['--cv-font-size-h2' as any]: sizes.h2,
    ['--cv-font-size-h3' as any]: sizes.h3,
    ['--cv-line-height' as any]: `${lineHeightVal}`,
    ...style
  };

  return (
    <div className={`cv-a4-document ${className}`} style={containerStyle}>
      {children}
    </div>
  );
};
