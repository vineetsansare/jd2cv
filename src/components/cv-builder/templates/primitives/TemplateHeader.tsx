import React from 'react';
import type { ResumeBasics, CVThemeSettings } from '../../../../types/cvBuilder';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';

interface TemplateHeaderProps {
  basics: ResumeBasics;
  theme: CVThemeSettings;
  align?: 'left' | 'center';
  photoPosition?: 'left' | 'right' | 'top' | 'none';
  showBorders?: boolean;
}

export const TemplateHeader: React.FC<TemplateHeaderProps> = ({
  basics,
  theme,
  align = theme.headerAlignment || 'left',
  photoPosition = 'left',
  showBorders = false
}) => {
  const accent = theme.accentColor || '#2563eb';
  const showPhoto = (theme.showPhoto !== false && basics.showAvatar) && !!basics.avatarUrl;
  const avatarShape = theme.photoShape || basics.avatarShape || 'circle';

  const avatarRadius = avatarShape === 'circle' ? '50%' : avatarShape === 'rounded' ? '12px' : '4px';

  // Helper for icon based on network
  const getNetworkIcon = (network: string) => {
    const net = network.toLowerCase();
    if (net.includes('linkedin')) return <Linkedin size={13} />;
    if (net.includes('github')) return <Github size={13} />;
    if (net.includes('portfolio') || net.includes('website')) return <Globe size={13} />;
    return <ExternalLink size={13} />;
  };

  const photoElement = showPhoto && (
    <div style={{ flexShrink: 0 }}>
      <img
        src={basics.avatarUrl}
        alt={basics.fullName}
        style={{
          width: '78px',
          height: '78px',
          borderRadius: avatarRadius,
          objectFit: 'cover',
          border: `2px solid ${accent}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      />
    </div>
  );

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: align === 'center' ? 'column' : 'row',
        alignItems: align === 'center' ? 'center' : 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        marginBottom: '1.25rem',
        paddingBottom: showBorders ? '1rem' : '0.5rem',
        borderBottom: showBorders ? `1.5px solid ${accent}22` : 'none',
        textAlign: align
      }}
    >
      {photoPosition === 'left' && photoElement}

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <h1 
          style={{
            margin: 0,
            fontSize: 'var(--cv-font-size-h1, 19pt)',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1.15
          }}
        >
          {basics.fullName || 'Your Full Name'}
        </h1>

        {basics.headline && (
          <div 
            style={{
              fontSize: 'var(--cv-font-size-h3, 10.5pt)',
              fontWeight: 600,
              color: accent,
              marginTop: '0.25rem',
              marginBottom: '0.45rem'
            }}
          >
            {basics.headline}
          </div>
        )}

        {/* Contact Links Bar */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: align === 'center' ? 'center' : 'flex-start',
            gap: '0.65rem 1.1rem',
            fontSize: 'var(--cv-font-size-base, 9pt)',
            color: '#475569',
            marginTop: '0.2rem'
          }}
        >
          {basics.email && (
            <a 
              href={`mailto:${basics.email}`} 
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Mail size={12} style={{ color: accent }} />
              <span>{basics.email}</span>
            </a>
          )}

          {basics.phone && (
            <a 
              href={`tel:${basics.phone}`} 
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Phone size={12} style={{ color: accent }} />
              <span>{basics.phone}</span>
            </a>
          )}

          {basics.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={12} style={{ color: accent }} />
              <span>{basics.location}</span>
            </span>
          )}

          {basics.website && (
            <a 
              href={basics.website.startsWith('http') ? basics.website : `https://${basics.website}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Globe size={12} style={{ color: accent }} />
              <span>{basics.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {basics.links && basics.links.map(link => (
            <a 
              key={link.id}
              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {getNetworkIcon(link.network)}
              <span>{link.username || link.network}</span>
            </a>
          ))}
        </div>
      </div>

      {photoPosition === 'right' && photoElement}
    </div>
  );
};
