import React, { useState, useEffect } from 'react';
import { X, Coins, Zap, Crown, Loader, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_URL = import.meta.env.VITE_PAYMENT_URL || '';

const PACKAGE_ICONS = {
  starter: Zap,
  standard: Star,
  premium: Crown,
};

const PACKAGE_COLORS = {
  starter: {
    gradient: 'from-blue-500 to-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  standard: {
    gradient: 'from-purple-500 to-purple-600',
    light: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  premium: {
    gradient: 'from-amber-500 to-amber-600',
    light: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
};

const CreditPackagesModal = ({ isOpen, onClose, credits }) => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmingId(null);
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const data = await apiService.getCreditPackages();
      setPackages(data.packages || []);
    } catch {
      toast.error('Failed to load credit packages');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleBuyClick = (packageId) => {
    setConfirmingId(packageId);
  };

  const handleConfirmPurchase = async (pkg) => {
    if (!currentUser) {
      toast.error('You must be logged in to purchase credits.');
      return;
    }
    if (!PAYMENT_URL) {
      toast.error('Payment service is not configured.');
      return;
    }
    setIsRedirecting(true);
    try {
      const callbackUrl = `${window.location.origin}/?payment_success=true`;
      const data = await apiService.createCheckoutSession(pkg.id, callbackUrl);
      window.location.href = `${PAYMENT_URL}/pay?code=${encodeURIComponent(data.code)}`;
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Checkout session error:', err);
      toast.error(`Checkout failed: ${msg}`);
      setIsRedirecting(false);
    }
  };

  const handleClose = () => {
    setConfirmingId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-fade-in shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Get Credits</h2>
              {credits !== null && credits !== undefined && (
                <p className="text-sm text-gray-500">
                  Current balance: <span className="font-medium text-amber-600">{credits} credits</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {isLoadingPackages ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-gray-500">Loading packages...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-6 sm:mb-8">
                Choose a credit package to power your video-to-PDF conversions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {packages.map((pkg) => {
                  const colors = PACKAGE_COLORS[pkg.id] || PACKAGE_COLORS.starter;
                  const Icon = PACKAGE_ICONS[pkg.id] || Coins;
                  const isConfirming = confirmingId === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className={`relative rounded-xl border-2 p-5 sm:p-6 transition-all duration-200 ${
                        pkg.popular
                          ? 'border-purple-400 ring-2 ring-purple-200 shadow-md scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <div className={`w-12 h-12 ${colors.light} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{pkg.name}</h3>

                        <div className="mb-3">
                          <span className="text-3xl sm:text-4xl font-bold text-gray-900">{pkg.credits}</span>
                          <span className="text-gray-500 ml-1 text-sm">credits</span>
                        </div>

                        <div className="mb-5">
                          <span className="text-2xl font-bold text-gray-900">
                            {pkg.currency === 'KWD' ? 'KD ' : pkg.currency === 'USD' ? '$' : ''}{pkg.price.toFixed(2)}
                          </span>
                        </div>

                        {isRedirecting ? (
                          <div className="flex items-center justify-center min-h-[44px] space-x-2">
                            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                            <span className="text-sm text-gray-600">Redirecting...</span>
                          </div>
                        ) : isConfirming ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-2">Confirm purchase?</p>
                            <button
                              onClick={() => handleConfirmPurchase(pkg)}
                              className={`w-full min-h-[44px] text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 ${colors.button}`}
                            >
                              Confirm - {pkg.currency === 'KWD' ? 'KD ' : pkg.currency === 'USD' ? '$' : ''}{pkg.price.toFixed(2)}
                            </button>
                            <button
                              onClick={() => setConfirmingId(null)}
                              className="w-full min-h-[44px] text-gray-600 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuyClick(pkg.id)}
                            className={`w-full min-h-[44px] text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 ${colors.button}`}
                          >
                            Buy Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 text-center mt-6">
                1 credit = 10 minutes of video processing
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditPackagesModal;
