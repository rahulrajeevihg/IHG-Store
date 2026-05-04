import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Head from "next/head";
import { get_cart_items, insert_cart_items } from "@/libs/api";
import { setCartItems } from "@/redux/slice/cartSettings";
import V2SearchPage from "@/components/Search/v2/V2SearchPage";
import CartSidebar from "@/components/Sales/CartSidebar";

export default function SalesWorkspace() {
  const dispatch = useDispatch();

  // Load cart on mount
  useEffect(() => {
    let active = true;
    const loadCart = async () => {
      try {
        const resp = await get_cart_items();
        if (active && resp?.message) dispatch(setCartItems(resp.message));
      } catch {
        // silently ignore — user might not be logged in yet
      }
    };
    loadCart();
    return () => { active = false; };
  }, [dispatch]);

  const handleAddToCart = useCallback(async (document, qty) => {
    if (qty <= 0) return;
    try {
      const resp = await insert_cart_items({
        item_code: document.item_code,
        qty,
        qty_type: "",
        cart_type: "Shopping Cart",
        customer: typeof window !== "undefined" ? localStorage.getItem("customerRefId") : null,
        attribute: "",
        attribute_id: "",
        business: "",
      });
      if (resp?.message) {
        dispatch(setCartItems(resp.message));
      } else {
        // fallback: refresh from server
        const cartResp = await get_cart_items();
        if (cartResp?.message) dispatch(setCartItems(cartResp.message));
      }
    } catch (err) {
      toast.error(err?.message || "Could not update cart.");
    }
  }, [dispatch]);

  return (
    <>
      <Head>
        <title>Sales Workspace</title>
      </Head>
      <V2SearchPage
        salesMode
        onAddToCart={handleAddToCart}
        rightPanel={<CartSidebar />}
      />
    </>
  );
}
