/**
 * Actify Embed Component
 * A React component for embedding Actify content with TypeScript support
 * @version 1.0.0
 * @license MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface ActifyEmbedProps {
  /** The source URL of the Actify content to embed */
  src: string;
  
  /** Width of the embed container */
  width?: number | string;
  
  /** Height of the embed container */
  height?: number | string;
  
  /** Aspect ratio (e.g., "16/9") */
  aspectRatio?: string;
  
  /** Custom CSS styles for the container */
  style?: CSSProperties;
  
  /** Additional class names */
  className?: string;
  
  /** Whether to show loading indicator */
  showLoading?: boolean;
  
  /** Custom loading component */
  loadingComponent?: ReactNode;
  
  /** Callback when embed loads successfully */
  onLoad?: () => void;
  
  /** Callback when embed fails to load */
  onError?: (error: Error) => void;
  
  /** Actify initialization options */
  actifyOptions?: {
    theme?: 'light' | 'dark';
    autoInit?: boolean;
    components?: string[];
  };
}

/**
 * Validates a URL string
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Parses aspect ratio string (e.g., "16/9") into percentage
 */
const parseAspectRatio = (ratio: string): string => {
  const [width, height] = ratio.split('/').map(Number);
  if (!width || !height || isNaN(width) || isNaN(height)) {
    return '56.25%'; // Default to 16:9
  }
  return `${(height / width) * 100}%`;
};

const ActifyEmbed: React.FC<ActifyEmbedProps> = ({
  src,
  width = '100%',
  height = 'auto',
  aspectRatio,
  style,
  className,
  showLoading = true,
  loadingComponent,
  onLoad,
  onError,
  actifyOptions = {}
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actifyInitialized, setActifyInitialized] = useState(false);

  // Initialize Actify when component mounts
  useEffect(() => {
    if (!isValidUrl(src)) {
      const err = new Error(`Invalid Actify embed URL: ${src}`);
      setError(err);
      onError?.(err);
      return;
    }

    const initActify = async () => {
      try {
        // Load Actify script dynamically if not already loaded
        if (!window.Actify) {
          await loadScript('https://cdn.actify.dev/latest/actify.min.js');
        }

        // Initialize Actify with options
        window.Actify.init(actifyOptions);
        setActifyInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize Actify');
        setError(error);
        onError?.(error);
      }
    };

    initActify();

    return () => {
      // Cleanup if needed
    };
  }, [src, actifyOptions, onError]);

  // Load the embed content when Actify is initialized
  useEffect(() => {
    if (!actifyInitialized || !embedRef.current) return;

    const loadEmbed = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create embed using Actify API
        const embed = await window.Actify.createEmbed(embedRef.current!, src);
        
        // Add event listeners
        embed.on('load', () => {
          setIsLoading(false);
          onLoad?.();
        });

        embed.on('error', (err: Error) => {
          setIsLoading(false);
          setError(err);
          onError?.(err);
        });

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load embed');
        setIsLoading(false);
        setError(error);
        onError?.(error);
      }
    };

    loadEmbed();
  }, [src, actifyInitialized, onLoad, onError]);

  // Dynamic styles based on props
  const containerStyle: CSSProperties = {
    width,
    height: aspectRatio ? undefined : height,
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  const aspectRatioStyle = aspectRatio ? {
    paddingBottom: parseAspectRatio(aspectRatio),
    height: 0,
    position: 'relative'
  } : {};

  const loadingStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  };

  const errorStyle: CSSProperties = {
    ...loadingStyle,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    color: '#ff0000',
    padding: '1rem',
    textAlign: 'center'
  };

  return (
    <div 
      className={`actify-embed ${className || ''}`}
      style={containerStyle}
      data-testid="actify-embed-container"
    >
      {aspectRatio && <div style={aspectRatioStyle} />}
      
      <div 
        ref={embedRef}
        style={aspectRatio ? {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        } : {}}
      />
      
      {isLoading && showLoading && (
        <div style={loadingStyle}>
          {loadingComponent || <DefaultLoadingSpinner />}
        </div>
      )}
      
      {error && (
        <div style={errorStyle}>
          <p>Failed to load Actify content</p>
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
};

// Default loading spinner component
const DefaultLoadingSpinner: React.FC = () => (
  <div style={{
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#4361ee',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />
);

// Helper to dynamically load scripts
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// Type declarations for Actify global
declare global {
  interface Window {
    Actify: {
      init: (options: { theme?: string; autoInit?: boolean; components?: string[] }) => void;
      createEmbed: (container: HTMLElement, src: string) => Promise<{
        on: (event: string, callback: (data?: any) => void) => void;
        destroy: () => void;
      }>;
    };
  }
}

export default ActifyEmbed;
