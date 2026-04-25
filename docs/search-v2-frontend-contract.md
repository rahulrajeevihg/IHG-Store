# Search V2 Frontend Contract

Frontend V2 listing for `/list?search_v2=1` uses `igh_search.igh_search.api.search_products_v2` with:

- `query`
- `filters`
- `sort_by`
- `page`
- `page_length`
- `include_inactive`
- `item_code_hint`
- `feature_flag_override`

## Sort Values

- `""`
- `creation:desc`
- `creation:asc`
- `rate:asc`
- `rate:desc`
- `offer_rate:asc`
- `offer_rate:desc`
- `stock:asc`
- `stock:desc`
- `sold_last_30_days:asc`
- `sold_last_30_days:desc`
- `discount_percentage:asc`
- `discount_percentage:desc`
- `priority_score:asc`
- `priority_score:desc`
- `popularity_score:asc`
- `popularity_score:desc`
- `business_score:asc`
- `business_score:desc`
- `modified_ts:asc`
- `modified_ts:desc`

## Filter Fields

Array and boolean filters:

- `brand`
- `item_group`
- `category_list`
- `product_type`
- `power`
- `color_temp`
- `ip_rate`
- `beam_angle`
- `mounting`
- `body_finish`
- `input_voltage`
- `output_voltage`
- `output_current`
- `lamp_type`
- `material`
- `warranty`
- `variant_of`
- `in_stock`

Range filters:

- `rate_range`
- `offer_rate_range`
- `discount_percentage_range`
- `stock_range`
- `sold_last_30_days_range`
- `inventory_value_range`
- `priority_score_range`
- `popularity_score_range`
- `business_score_range`
- `power_value_range`
- `color_temp_kelvin_range`
- `ip_rating_numeric_range`

## Notes

- `filters` must be sent as a JSON stringified object.
- For SKU-like input, frontend sends `query: ""` and uses `item_code_hint`.
- `query_debug` is only used for diagnostics and developer logging.
