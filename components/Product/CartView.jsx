import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { get_cart_items, check_Image, search_opportunities, create_quotation_from_portal, clear_cart, extractFrappeErrorMessage, getErpDeskQuotationUrl } from '@/libs/api';
import { setCartItems, resetCart } from '@/redux/slice/cartSettings';
import { toast } from 'react-toastify';
import CardButton from './CardButton';
import Dirham from '@/components/Common/Dirham';

const CartView = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const cartItems = useSelector((state) => state.cartSettings.cartItems);
    const cartValue = useSelector((state) => state.cartSettings.cartValue);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState(null); // { name, customer_name, title }
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(!!localStorage.getItem('full_name'));
        }
        loadCart();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadCart = async () => {
        setIsLoadingCart(true);
        try {
            const res = await get_cart_items();
            if (res && res.message && res.message.status === 'success') {
                dispatch(setCartItems(res.message));
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setIsLoadingCart(false);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setSelectedOpp(null);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!val.trim() || val.trim().length < 2) {
            setSearchResults([]);
            setDropdownOpen(false);
            return;
        }

        debounceRef.current = setTimeout(() => {
            doSearch(val.trim());
        }, 350);
    };

    const doSearch = async (query) => {
        setIsSearching(true);
        setDropdownOpen(true);
        try {
            const resp = await search_opportunities(query);
            if (resp && resp.message && resp.message.status === 'success') {
                setSearchResults(resp.message.data || []);
            } else {
                setSearchResults([]);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectOpportunity = (opp) => {
        setSelectedOpp(opp);
        setSearchQuery(opp.name);
        setDropdownOpen(false);
        setSearchResults([]);
    };

    const clearSelection = () => {
        setSelectedOpp(null);
        setSearchQuery('');
        setSearchResults([]);
        setDropdownOpen(false);
    };

    const handleCreateQuotation = async () => {
        if (!isLoggedIn) {
            toast.info('Please login to create a quotation');
            router.push('/login');
            return;
        }
        if (!selectedOpp) {
            toast.warning('Please search and select an opportunity first');
            return;
        }

        const quotationWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;
        setIsCreating(true);
        try {
            const payload = {
                opportunity: selectedOpp.name,
                items: cartItems.map(item => ({
                    item_code: item.item_code,
                    qty: item.quantity,
                    rate: item.rate
                }))
            };

            const resp = await create_quotation_from_portal(payload);
            if (resp && resp.message && resp.message.status === 'success') {
                const quotationName = resp.message.quotation;
                const quotationUrl = getErpDeskQuotationUrl(quotationName);
                if (quotationWindow && quotationUrl) {
                    quotationWindow.location.href = quotationUrl;
                } else if (quotationUrl) {
                    window.open(quotationUrl, '_blank', 'noopener,noreferrer');
                }
                toast.success(`Draft quotation ${quotationName} opened in ERPNext. Complete required fields and save it there.`);
                try { await clear_cart(); } catch (_) {}
                dispatch(resetCart());
                router.push('/tabs/my-orders');
            } else {
                if (quotationWindow) quotationWindow.close();
                toast.error(extractFrappeErrorMessage(resp, 'Failed to create quotation'));
            }
        } catch (error) {
            if (quotationWindow) quotationWindow.close();
            toast.error(extractFrappeErrorMessage(error, 'An error occurred while creating the quotation'));
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoadingCart) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-l-2 border-t-2 border-[#000]"></div>
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="relative w-48 h-48 mb-6">
                    <Image src="/Tabs/Cart-1.svg" layout="fill" objectFit="contain" className="opacity-20" alt="Empty Cart" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8 text-center max-w-xs">Looks like you haven't added anything to your cart yet.</p>
                <button
                    onClick={() => router.push('/')}
                    className="primary_bg text-white px-8 py-3 rounded-full font-semibold transition-transform hover:scale-105 active:scale-95"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="main-width lg:max-w-[1300px] py-6 px-4">
            <h1 className="text-2xl font-bold mb-8">Internal Sales Cart ({cartItems.length})</h1>

            <div className="lg:flex gap-8">
                <div className="lg:flex-grow">
                    <div className="space-y-4">
                        {cartItems.map((item, index) => (
                            <div key={item.name} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border">
                                    <Image
                                        src={check_Image(item.website_image_url || item.image)}
                                        layout="fill"
                                        objectFit="contain"
                                        alt={item.item_name}
                                    />
                                </div>
                                <div className="flex-grow flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.item_name}</h3>
                                        <p className="text-sm text-gray-500">{item.item_code}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-lg font-bold primary_color">
                                                <Dirham /> {parseFloat(item.amount).toFixed(2)}
                                            </span>
                                            {item.rate > item.amount && (
                                                <span className="text-sm text-gray-400 line-through">
                                                    AED {parseFloat(item.rate).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <CardButton item={{...item, count: item.quantity}} index={index} is_big={false} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:w-96 mt-8 lg:mt-0">
                    <div className="bg-gray-50 p-6 rounded-2xl sticky top-24 border border-gray-100">
                        <h2 className="text-xl font-bold mb-6">Quotation Details</h2>

                        {isLoggedIn ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Opportunity
                                </label>

                                <div className="relative" ref={searchRef}>
                                    <div className={`flex items-center gap-2 bg-white border rounded-xl px-3 transition-all ${dropdownOpen ? 'border-[#d11111] ring-2 ring-[#d11111]/20' : 'border-gray-200'}`}>
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onFocus={() => { if (searchResults.length > 0) setDropdownOpen(true); }}
                                            placeholder="Type OP number or customer name..."
                                            className="w-full py-3 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                                            disabled={!!selectedOpp}
                                        />
                                        {(searchQuery || selectedOpp) && (
                                            <button onClick={clearSelection} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M18 6 6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {dropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                            {isSearching ? (
                                                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-[#d11111] rounded-full animate-spin"></div>
                                                    Searching...
                                                </div>
                                            ) : searchResults.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-gray-500">No opportunities found</div>
                                            ) : (
                                                <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                                                    {searchResults.map(opp => (
                                                        <li
                                                            key={opp.name}
                                                            onClick={() => selectOpportunity(opp)}
                                                            className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                                        >
                                                            <p className="text-sm font-semibold text-gray-900">{opp.name}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{opp.customer_name || opp.customer}{opp.title ? ` — ${opp.title}` : ''}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected opportunity pill */}
                                {selectedOpp && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-green-800 truncate">{selectedOpp.name}</p>
                                            {selectedOpp.customer_name && <p className="text-xs text-green-600 truncate">{selectedOpp.customer_name}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                <p className="text-sm text-yellow-800">
                                    You must be logged in to access opportunities and create quotations.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span><Dirham /> {parseFloat(cartValue?.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Est. Total</span>
                                <span className="primary_color"><Dirham /> {parseFloat(cartValue?.grand_total || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                                isCreating ? 'bg-gray-400 cursor-not-allowed' : 'primary_bg text-white hover:opacity-90'
                            }`}
                            onClick={handleCreateQuotation}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating...
                                </>
                            ) : (
                                isLoggedIn ? 'Create Quotation' : 'Login to Create Quotation'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartView;
