import React, { useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { Upload, X, Save, Loader2 } from "lucide-react";

const Add = ({ token }) => {
  const [images, setImages] = useState([false, false, false, false]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    bestseller: false,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!images.some((img) => img))
      newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageChange = (index, file) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = false;
    setImages(newImages);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      images.forEach((image, index) => {
        if (image) submitData.append(`image${index + 1}`, image);
      });

      const response = await axios.post(
        backendUrl + "/api/product/add",
        submitData,
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        toast.success("Product added successfully!");
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "",
          bestseller: false,
        });
        setImages([false, false, false, false]);
        setErrors({});
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-white">
            <h1 className="text-2xl font-semibold text-gray-900">
              Add New Product
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Fill in the product details to add it to your inventory
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmitHandler} className="p-6 space-y-8">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Product Images <span className="text-orange-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square border-2 border-dashed border-orange-300 rounded-lg overflow-hidden hover:border-orange-500 transition-colors">
                      {image ? (
                        <div className="relative h-full">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded-full hover:bg-orange-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                          <Upload className="w-8 h-8 text-orange-400" />
                          <span className="text-sm text-gray-600 mt-2">
                            Upload Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageChange(index, e.target.files[0])
                            }
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.images && (
                <p className="text-orange-600 text-sm mt-1">{errors.images}</p>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-orange-200 pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Product Name <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.name ? "border-orange-500" : "border-orange-300"
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="text-orange-600 text-sm mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Category <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.category
                        ? "border-orange-500"
                        : "border-orange-300"
                    }`}
                    placeholder="e.g., Clothing, Electronics, Accessories"
                  />
                  {errors.category && (
                    <p className="text-orange-600 text-sm mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description <span className="text-orange-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.description
                      ? "border-orange-500"
                      : "border-orange-300"
                  }`}
                  placeholder="Enter detailed product description"
                />
                {errors.description && (
                  <p className="text-orange-600 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Price (₹) <span className="text-orange-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.price ? "border-orange-500" : "border-orange-300"
                  }`}
                  placeholder="299"
                  min="1"
                />
                {errors.price && (
                  <p className="text-orange-600 text-sm mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Bestseller Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <input
                type="checkbox"
                id="bestseller"
                checked={formData.bestseller}
                onChange={(e) =>
                  handleInputChange("bestseller", e.target.checked)
                }
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <label
                htmlFor="bestseller"
                className="text-sm font-medium text-gray-900"
              >
                Mark as Bestseller Product
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-orange-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding Product...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Add;
