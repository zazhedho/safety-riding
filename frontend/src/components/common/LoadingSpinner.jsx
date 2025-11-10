/**
 * LoadingSpinner Component
 *
 * Eliminates ~96 lines of duplicate loading spinner JSX
 * across 12+ files
 *
 * Usage:
 * <LoadingSpinner />
 * <LoadingSpinner size="sm" message="Loading data..." />
 * <LoadingSpinner overlay={true} />
 */

import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
  size = 'md',
  message = 'Loading...',
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  const spinner = (
    <div className={`text-center py-5 ${className}`}>
      <div
        className={`spinner-border text-primary ${sizeClasses[size]}`}
        role="status"
      >
        <span className="visually-hidden">{message}</span>
      </div>
      {message && (
        <div className="mt-3 text-muted">
          <small>{message}</small>
        </div>
      )}
    </div>
  );

  // If overlay is true, show spinner with dark background overlay
  if (overlay) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        <div
          className="bg-white p-4 rounded shadow"
          style={{ minWidth: '200px' }}
        >
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  message: PropTypes.string,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingSpinner;
