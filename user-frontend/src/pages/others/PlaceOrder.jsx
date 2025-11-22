import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  ShoppingBag,
  ArrowLeft,
  Loader,
  AlertCircle,
  X,
  MapPin,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Order Item from navigation state
  const [orderItem, setOrderItem] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Order Processing
  const [placingOrder, setPlacingOrder] = useState(false);

  // Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
    phone: "",
  });

  useEffect(() => {
    // Get order item from navigation state
    if (location.state?.orderItem) {
      setOrderItem(location.state.orderItem);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const userRes = await api.get("/profile");

      setAddresses(userRes.data.addresses || []);
      setWalletBalance(userRes.data.walletBalance || 0);

      if (userRes.data.addresses?.length > 0) {
        setSelectedAddress(userRes.data.addresses[0]._id);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!orderItem) return 0;
    return orderItem.price * orderItem.quantity;
  };

  const handleAddAddress = async () => {
    if (
      !addressForm.firstName ||
      !addressForm.lastName ||
      !addressForm.email ||
      !addressForm.street ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.zipcode ||
      !addressForm.phone
    ) {
      setError("Please fill all address fields");
      return;
    }

    setError("");
    try {
      await api.post("/profile/address/add", addressForm);
      setSuccess("Address added successfully");
      setShowAddressForm(false);
      setAddressForm({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "India",
        phone: "",
      });
      loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      await api.post("/profile/address/remove", { addressId });
      setSuccess("Address deleted");
      loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderItem) {
      setError("No product selected");
      return;
    }

    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }

    const total = calculateTotal();

    if (walletBalance < total) {
      setError(
        `Insufficient wallet balance. Required: $${total.toFixed(
          2
        )}, Available: $${walletBalance.toFixed(2)}`
      );
      return;
    }

    setPlacingOrder(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/product/order/place", {
        items: [orderItem],
        amount: total,
        addressId: selectedAddress,
      });

      setSuccess("Order placed successfully!");
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <>
      <Helmet>
        <title>Checkout - Place Order</title>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Shop
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-orange-600" />
              Checkout
            </h1>
            <p className="text-gray-600 mt-2">Review and place your order</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError("")}>
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <button onClick={() => setSuccess("")}>
                <X className="w-5 h-5 text-green-600" />
              </button>
            </div>
          )}

          {/* No Item */}
          {!orderItem ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No product selected
              </h3>
              <p className="text-gray-500 mb-6">
                Please select a product to continue
              </p>
              <button
                onClick={() => navigate("/shop")}
                className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Order Item & Address */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Item */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-600" />
                      Order Item
                    </h2>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={orderItem.image || "/placeholder.jpg"}
                        alt={orderItem.name}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {orderItem.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {orderItem.quantity}
                        </p>
                        {orderItem.size && (
                          <p className="text-sm text-gray-600">
                            Size: {orderItem.size}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${(orderItem.price * orderItem.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${orderItem.price} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      Delivery Address
                    </h2>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add New
                    </button>
                  </div>

                  <div className="p-4">
                    {/* Add Address Form */}
                    {showAddressForm && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          New Address
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={addressForm.firstName}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={addressForm.lastName}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <input
                          type="email"
                          placeholder="Email"
                          value={addressForm.email}
                          onChange={(e) =>
                            setAddressForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={addressForm.street}
                          onChange={(e) =>
                            setAddressForm((prev) => ({
                              ...prev,
                              street: e.target.value,
                            }))
                          }
                          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="City"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                state: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Zipcode"
                            value={addressForm.zipcode}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                zipcode: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Phone"
                            value={addressForm.phone}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddAddress}
                            className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm"
                          >
                            Save Address
                          </button>
                          <button
                            onClick={() => setShowAddressForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Saved Addresses */}
                    {addresses.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No saved addresses. Add one above.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address._id}
                            className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                              selectedAddress === address._id
                                ? "border-orange-600 bg-orange-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedAddress(address._id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {address.firstName} {address.lastName}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {address.street}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.state} -{" "}
                                  {address.zipcode}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.country}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                  Phone: {address.phone}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Email: {address.email}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(address._id);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-24">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      Order Summary
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-semibold">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Delivery</span>
                        <span className="font-semibold text-green-600">
                          FREE
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Tax</span>
                        <span className="font-semibold">$0.00</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-orange-600">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Wallet Balance */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Wallet Balance
                          </p>
                          <p className="text-xl font-bold text-blue-900">
                            ${walletBalance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {walletBalance < total && (
                        <p className="text-xs text-red-700 mt-2">
                          Insufficient balance. Please add funds to your wallet.
                        </p>
                      )}
                    </div>

                    {/* Place Order Button */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={
                        placingOrder ||
                        !selectedAddress ||
                        !orderItem ||
                        walletBalance < total
                      }
                      className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {placingOrder ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-gray-500">
                      By placing this order, you agree to our terms and
                      conditions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlaceOrder;
