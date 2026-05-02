# ERPNext Integration Requirements - Sales Portal (IGH Search App)

**CRITICAL**: The `ecommerce_business_store` app is NOT installed on this server. All portal functionality MUST be implemented within the `igh_search` custom app.

## 1. Overview
The portal is an internal sales tool. Since there is no dedicated e-commerce app, the `igh_search` app must act as the backend for cart management, product data, and quotation creation.

## 2. Mandatory API Endpoints (Python/Frappe)

Please implement all the following methods in `igh_search.api` (located in `apps/igh_search/igh_search/api.py`). All methods must be `@frappe.whitelist()`.

### 2.1 Cart Management
The frontend will now point all cart actions to these endpoints.

*   **`igh_search.api.get_cart_items`** (GET)
    *   Return: `{"message": {"status": "success", "cart": {"marketplace_items": [...]}, "total": 0, "grand_total": 0}}`
*   **`igh_search.api.update_cartitem`** (POST)
    *   Payload: `{"item_code": "...", "qty": 1}`
    *   Return: `{"message": {"status": "success", "message": "Updated"}}`
*   **`igh_search.api.insert_cart_items`** (POST)
    *   Payload: `{"item_code": "...", "qty": 1}`
*   **`igh_search.api.delete_cart_items`** (POST)
    *   Payload: `{"cart_id": "..."}`

### 2.2 Quotation & Opportunity Flow
*   **`igh_search.api.get_user_opportunities`** (GET)
    *   Return: A list of open Opportunities for the current user.
*   **`igh_search.api.create_quotation_from_portal`** (POST)
    *   Payload: `{"opportunity": "OPP-...", "items": [...]}`
    *   Description: Create a Quotation linked to the Opportunity and return the name.

### 2.3 Product & Customer (Optional Fallbacks)
If the portal requires specific customer data or product listings beyond search:
*   **`igh_search.api.get_customer_info`** (GET)
*   **`igh_search.api.get_product_details`** (GET)

## 3. Frontend Mapping
I have updated the frontend (`libs/api.js`) to point to `igh_search.api` for all calls. Please ensure the method names in Python match these exactly.

## 4. Implementation Guidelines
- **Authentication**: Use `frappe.session.user` to handle user-specific carts.
- **Data Integrity**: Ensure prices and taxes are recalculated on the server during `get_cart_items`.
- **App**: `igh_search` only.
