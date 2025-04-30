import React from 'react';
import PropTypes from 'prop-types';

/**
 * VersionTag Component
 * Displays the Actify version with customizable styling
 * @param {Object} props - Component props
 * @param {string} [props.prefix] - Text to show before version
 * @param {string} [props.suffix] - Text to show after version
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline styles
 * @param {string} [props.version] - Version to display (defaults to ACTIFY_VERSION)
 */
const ActifyVersionTag = ({ 
  prefix = 'Actify', 
  suffix = '',
  className = '',
  style = {},
  version = window.ACTIFY_VERSION || '2.1.4' 
}) => {
  return (
    <div 
      className={`actify-version-tag ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#666',
        backgroundColor: '#f0f0f0',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontFamily: 'monospace',
        ...style
      }}
      data-version={version}
    >
      {prefix && <span style={{ marginRight: '0.25rem' }}>{prefix}</span>}
      <span style={{ fontWeight: 'bold' }}>v{version}</span>
      {suffix && <span style={{ marginLeft: '0.25rem' }}>{suffix}</span>}
    </div>
  );
};

ActifyVersionTag.propTypes = {
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  version: PropTypes.string
};

// Set the version globally if not already set
if (!window.ACTIFY_VERSION) {
  window.ACTIFY_VERSION = '2.1.4';
}

export default ActifyVersionTag;
