/**
 * Pagination Component
 *
 * Eliminates ~300 lines of duplicate pagination JSX
 * across 6 files (EventList, AccidentList, SchoolList, UserList, MarketShareList, BudgetList)
 *
 * Usage:
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={handlePageChange}
 *   maxVisiblePages={5}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  disabled = false
}) => {
  if (totalPages <= 1) {
    return null; // Don't show pagination if only 1 page
  }

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      if (showFirstLast) {
        pages.push(1);
      }
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      if (showFirstLast) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage || disabled) {
      return;
    }
    onPageChange(page);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="d-flex justify-content-center mt-4">
      <nav aria-label="Page navigation">
        <ul className="pagination">
          {/* Previous Button */}
          <li className={`page-item ${currentPage === 1 || disabled ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1 || disabled}
              aria-label="Previous"
            >
              <i className="bi bi-chevron-left"></i> Previous
            </button>
          </li>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => (
            <li
              key={index}
              className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
            >
              {page === '...' ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => handlePageClick(page)}
                  disabled={disabled}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

          {/* Next Button */}
          <li className={`page-item ${currentPage === totalPages || disabled ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages || disabled}
              aria-label="Next"
            >
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  maxVisiblePages: PropTypes.number,
  showFirstLast: PropTypes.bool,
  disabled: PropTypes.bool
};

export default Pagination;
