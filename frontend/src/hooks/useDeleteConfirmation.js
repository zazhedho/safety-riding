/**
 * useDeleteConfirmation Hook
 *
 * Eliminates ~240 lines of duplicate delete confirmation logic
 * across 6 files (EventList, AccidentList, SchoolList, MarketShareList, BudgetList, UserList)
 *
 * Usage:
 * const {
 *   showModal,
 *   itemToDelete,
 *   handleDeleteClick,
 *   handleDeleteConfirm,
 *   handleDeleteCancel
 * } = useDeleteConfirmation(service.delete, onSuccess);
 */

import { useState } from 'react';
import { toast } from 'react-toastify';

export const useDeleteConfirmation = (
  deleteFunction,
  onSuccess = null,
  options = {}
) => {
  const {
    successMessage = 'Item deleted successfully',
    errorMessage = 'Failed to delete item',
    confirmationRequired = true
  } = options;

  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Open delete confirmation modal
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    if (confirmationRequired) {
      setShowModal(true);
    } else {
      // Skip modal and delete immediately
      performDelete(item);
    }
  };

  // Perform actual deletion
  const performDelete = async (item) => {
    if (!item) return;

    setDeleting(true);
    try {
      await deleteFunction(item.id);
      toast.success(successMessage);

      // Call onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(item);
      }

      // Close modal and reset state
      setShowModal(false);
      setItemToDelete(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || errorMessage;
      toast.error(errorMsg);
      console.error('Error deleting item:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Confirm deletion
  const handleDeleteConfirm = async () => {
    await performDelete(itemToDelete);
  };

  // Cancel deletion
  const handleDeleteCancel = () => {
    setShowModal(false);
    setItemToDelete(null);
  };

  return {
    showModal,
    itemToDelete,
    deleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    setShowModal,
    setItemToDelete
  };
};

export default useDeleteConfirmation;
