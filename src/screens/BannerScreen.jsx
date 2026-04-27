import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import { BannerList } from "../components/banner/BannerList";
import { BannerForm } from "../components/banner/BannerForm";

/**
 * UI component responsible for rendering the banner screen section.
 */
export function BannerScreen() {
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  /**
   * Handles add banner behavior.
   */
  const handleAddBanner = () => {
    setEditingBanner(null);
    setShowForm(true);
  };

  /**
   * Handles edit banner behavior.
   */
  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  /**
   * Handles form success behavior.
   */
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBanner(null);
  };

  /**
   * Handles form close behavior.
   */
  const handleFormClose = () => {
    setShowForm(false);
    setEditingBanner(null);
  };

  return (
    <>
      <div>
        <BannerList
          onAddBanner={handleAddBanner}
          onEditBanner={handleEditBanner}
        />
      </div>

      {showForm && (
        <BannerForm
          banner={editingBanner}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <ToastContainer position="bottom-center" />
    </>
  );
}
