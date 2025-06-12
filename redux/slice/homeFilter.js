import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    filtersValue: {
        sort_by: '',
        hot_product: false,
        brand: [],
        item_group: [],
    }
};

const HomeFilter = createSlice({
    name: "HomeFilter",
    initialState,
    reducers: {
        setFilter(state, action) {
            // console.log("setFilter action triggered");
            const payload = action.payload;

            if (!state.filtersValue) {
                state.filtersValue = {};
            }

            Object.entries(payload).forEach(([key, value]) => {
                if (key in state.filtersValue) {
                    state.filtersValue[key] = value;
                } else {
                    console.warn(`Unknown filter key: ${key}`);
                }
            });
        },
        resetFilter(state) {
            state.filtersValue = {
                sort_by: '',
                hot_product: false,
                brand: [],
                item_group: [],
            }
        },
    },
});

export const { setFilter, resetFilter } = HomeFilter.actions;
export default HomeFilter.reducer;

