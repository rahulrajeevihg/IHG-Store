const { createSlice } = require("@reduxjs/toolkit");

const initialState = {
    data: {}
}
const ProductDetails = createSlice({
    name: "ProductDetails",
    initialState,
    reducers:{
        setProductDetail(state, action){
            const payload = action.payload;
            state.data = payload;
            console.log(payload,'pay')
        }
    }
})

export const {setProductDetail} = ProductDetails.actions;
export default ProductDetails.reducer;