import React from 'react';
import type { ResumeBasics, CVThemeSettings } from '../../../../types/cvBuilder';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';
import { cleanText } from './ExperienceEntry';

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
  const getNetworkIcon = (network: string = '') => {
    const net = network.toLowerCase();
    if (net.includes('linkedin')) return <Linkedin size={13} />;
    if (net.includes('github')) return <Github size={13} />;
    if (net.includes('portfolio') || net.includes('website')) return <Globe size={13} />;
    return <ExternalLink size={13} />;
  };

  const cleanName = cleanText(basics.fullName) || 'Your Full Name';
  const cleanHeadline = cleanText(basics.headline);
  const cleanLocation = cleanText(basics.location);
  const cleanEmail = cleanText(basics.email);
  const cleanPhone = cleanText(basics.phone);
  const cleanWebsite = cleanText(basics.website);

  const photoElement = showPhoto && (
    <div style={{ flexShrink: 0 }}>
      <img
        src={basics.avatarUrl}
        alt={cleanName}
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
        gap: '1rem',
        marginBottom: '0.85rem',
        paddingBottom: showBorders ? '0.65rem' : '0.35rem',
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
          {cleanName}
        </h1>

        {cleanHeadline && (
          <div 
            style={{
              fontSize: 'var(--cv-font-size-h3, 10.5pt)',
              fontWeight: 600,
              color: accent,
              marginTop: '0.25rem',
              marginBottom: '0.45rem'
            }}
          >
            {cleanHeadline}
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
          {cleanEmail && (
            <a 
              href={`mailto:${cleanEmail}`} 
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Mail size={12} style={{ color: accent }} />
              <span>{cleanEmail}</span>
            </a>
          )}

          {cleanPhone && (
            <a 
              href={`tel:${cleanPhone}`} 
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Phone size={12} style={{ color: accent }} />
              <span>{cleanPhone}</span>
            </a>
          )}

          {cleanLocation && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={12} style={{ color: accent }} />
              <span>{cleanLocation}</span>
            </span>
          )}

          {cleanWebsite && (
            <a 
              href={cleanWebsite.startsWith('http') ? cleanWebsite : `https://${cleanWebsite}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Globe size={12} style={{ color: accent }} />
              <span>{cleanWebsite.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {basics.links && basics.links.map(link => {
            const rawUrl = link.url || '';
            const cleanUrl = rawUrl.replace(/^\[(.*?)\]\((.*?)\)$/, '$2').trim();
            const cleanUsername = cleanText(link.username) || cleanText(link.network);
            const href = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;

            return (
              <a 
                key={link.id}
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {getNetworkIcon(link.network)}
                <span>{cleanUsername}</span>
              </a>
            );
          })}
        </div>
      </div>

      {photoPosition === 'right' && photoElement}
    </div>
  );
};

