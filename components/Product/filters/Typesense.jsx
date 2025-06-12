// import React, { useEffect, useState, useRef, useCallback } from "react";
// import RangeSlider from "./RangeSlider";
// import { useSelector, useDispatch } from "react-redux";
// import { setFilter } from "@/redux/slice/filtersList";

// const TypesenseSearch = () => {
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true); // Track if more results are available
//   const observer = useRef(); // Ref for Intersection Observer

//   const filtersData = useSelector((state) => state.FiltersList);
//   const dispatch = useDispatch();

//   const [filters, setFilters] = useState({
//     ...filtersData,
//     price_range: { min: 0, max: 100000 },
//     stock_range: { min: 0, max: 200 },
//   });

//   const buildFilterQuery = () => {
//     const filterParams = [];
//     if (filters.item_code) filterParams.push(`item_code:${filters.item_code}*`);
//     if (filters.item_description)
//       filterParams.push(`item_description:${filters.item_description}*`);
//     if (filters.item_group) filterParams.push(`item_group:${filters.item_group}`);
//     if (filters.show_promotion) filterParams.push(`show_promotion:=true`);
//     if (filters.in_stock) filterParams.push(`in_stock:=true`);
//     if (filters.brands) filterParams.push(`brand:=[${filters.brands}]`);
//     if (filters.price_range && filters.price_range.min > 0) {
//       const { min, max } = filters.price_range;
//       filterParams.push(`rate:[${parseFloat(min)}...${parseFloat(max)}]`);
//     }
//     if (filters.stock_range && filters.stock_range.min > 0) {
//       const { min, max } = filters.stock_range;
//       filterParams.push(`stock:[${parseFloat(min)}...${parseFloat(max)}]`);
//     }
//     return filterParams.length > 0 ? filterParams.join(" && ") : "";
//   };

//   const fetchResults = async (pageNumber = 1) => {
//     setLoading(true);
//     setError(null);

//     const filterQuery = buildFilterQuery();
//     const queryParams = new URLSearchParams({
//       q: "*",
//       query_by: "item_name,item_description,brand",
//       page: pageNumber.toString(),
//       per_page: "30",
//       query_by_weights: "1,2,3",
//       ...(filterQuery && { filter_by: filterQuery }),
//     });

//     try {
//       const response = await fetch(
//         `http://178.128.108.196:8108/collections/product/documents/search?${queryParams.toString()}`,
//         {
//           method: "GET",
//           headers: {
//             "x-typesense-api-key": "xyz",
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Error: ${response.status} ${response.statusText}`);
//       }

//       const data = await response.json();
//       if (data.hits.length === 0) {
//         setHasMore(false); // No more results to fetch
//       } else {
//         setResults((prevResults) => [...prevResults, ...data.hits]); // Append new results
//       }
//     } catch (err) {
//       setError(err.message || "An error occurred while fetching data.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     dispatch(setFilter(filters));
//   }, [filters, dispatch]);

//   useEffect(() => {
//     fetchResults(page); // Fetch results for the current page
//   }, [page]);

//   // Infinite scroll logic
//   const lastResultRef = useCallback(
//     (node) => {
//       if (loading) return; // Don't trigger if already loading
//       if (observer.current) observer.current.disconnect(); // Disconnect previous observer

//       observer.current = new IntersectionObserver((entries) => {
//         if (entries[0].isIntersecting && hasMore) {
//           setPage((prevPage) => prevPage + 1); // Increment page number
//         }
//       });

//       if (node) observer.current.observe(node); // Observe the last result element
//     },
//     [loading, hasMore]
//   );

//   return (
//     <div className="p-4">
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Item Code"
//           value={filters.item_code || ""}
//           onChange={(e) => setFilters({ ...filters, item_code: e.target.value })}
//           className="border p-2 mr-2"
//         />
//         <input
//           type="text"
//           placeholder="Item Description"
//           value={filters.item_description || ""}
//           onChange={(e) =>
//             setFilters({ ...filters, item_description: e.target.value })
//           }
//           className="border p-2 mr-2"
//         />
//         <input
//           type="text"
//           placeholder="Item Name"
//           value={filters.item_name || ""}
//           onChange={(e) => setFilters({ ...filters, item_name: e.target.value })}
//           className="border p-2 mr-2"
//         />

//         <div>
//           <label>
//             <input
//               type="checkbox"
//               checked={filters.show_promotion || false}
//               onChange={(e) =>
//                 setFilters({ ...filters, show_promotion: e.target.checked })
//               }
//               className="mr-2"
//             />
//             Show Promotion
//           </label>
//           <label>
//             <input
//               type="checkbox"
//               checked={filters.in_stock || false}
//               onChange={(e) =>
//                 setFilters({ ...filters, in_stock: e.target.checked })
//               }
//               className="mr-2"
//             />
//             In Stock
//           </label>
//         </div>

//         <select
//           value={filters.brands || ""}
//           onChange={(e) => setFilters({ ...filters, brands: e.target.value })}
//           className="border p-2 mr-2"
//         >
//           <option value="">Select Brand</option>
//           <option value="LTECH">LTECH</option>
//         </select>
//         <select
//           value={filters.item_group || ""}
//           onChange={(e) =>
//             setFilters({ ...filters, item_group: e.target.value })
//           }
//           className="border p-2 mr-2"
//         >
//           <option value="">Select Item Group</option>
//           <option value="ELECTRICAL">Electrical</option>
//         </select>

//         <div className="w-60">
//           <RangeSlider
//             MIN={0}
//             MAX={100}
//             ranges={filters.price_range}
//             setRanges={(ranges) =>
//               setFilters({ ...filters, price_range: ranges })
//             }
//             label={"Price"}
//           />
//         </div>

//         <div className="w-60">
//           <RangeSlider
//             MIN={0}
//             MAX={100000}
//             ranges={filters.stock_range}
//             setRanges={(ranges) =>
//               setFilters({ ...filters, stock_range: ranges })
//             }
//             label={"Price"}
//           />
//         </div>

//         <button onClick={() => fetchResults(1)} className="p-2 bg-blue-500 text-white">
//           Submit
//         </button>
//       </div>

//       {loading && <p>Loading...</p>}
//       {error && <p className="text-red-500">Error: {error}</p>}
//       {!loading && !error && (
//         <div>
//           {results.length > 0 ? (
//             <ul className="list-disc pl-5">
//               {results.map((result, index) => {
//                 if (results.length === index + 1) {
//                   // Attach the ref to the last result element
//                   return (
//                     <li
//                       key={index}
//                       ref={lastResultRef}
//                       className="mb-2"
//                     >
//                       <strong>{result.document.item_name}</strong>:{" "}
//                       {result.document.item_description} (Brand:{" "}
//                       {result.document.brand})
//                     </li>
//                   );
//                 } else {
//                   return (
//                     <li key={index} className="mb-2">
//                       <strong>{result.document.item_name}</strong>:{" "}
//                       {result.document.item_description} (Brand:{" "}
//                       {result.document.brand})
//                     </li>
//                   );
//                 }
//               })}
//             </ul>
//           ) : (
//             <p>No results found.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default TypesenseSearch;













// const fetchResults = async (reset = false) => {
//   setLoading(true);
//   setError(null);

//   // Reset page number and results if filters are applied
//   if (reset) {
//     setPageNo(1); // Reset to the first page
//     setResults([]); // Clear existing results
//     setHasMore(true); // Reset hasMore flag
//   }

//   const queryParams = new URLSearchParams({
//     q: '*',
//     query_by: "item_name,item_description,brand",
//     page: pageNo.toString(), // Ensure pageNo is a string
//     per_page: "5", // Fetch 5 items per page
//     query_by_weights: "1,2,3",
//     ...(buildFilterQuery() && { filter_by: buildFilterQuery() }), // Add filter query if it exists
//   });

//   try {
//     console.log('query', buildFilterQuery());
//     const data = await typesense_search_items(queryParams);

//     if (data.hits.length === 0) {
//       setHasMore(false); // No more results to fetch
//     } else {
//       // Append new results if not resetting, otherwise replace results
//       setResults((prevResults) => reset ? data.hits : [...prevResults, ...data.hits]);
//     }
//   } catch (err) {
//     setError(err.message || "An error occurred while fetching data.");
//     setResults([]); // Clear results on error
//   } finally {
//     setLoading(false);
//   }
// };

// // Call this function when filters are applied
// const applyFilters = () => {
//   fetchResults(true); // Reset pagination and fetch new results
// };

// // Call this function for infinite scroll
// const loadMoreResults = () => {
//   if (hasMore && !loading) {
//     setPageNo((prevPageNo) => prevPageNo + 1); // Increment page number
//   }
// };

// // Use useEffect to trigger fetchResults when pageNo changes
// useEffect(() => {
//   fetchResults();
// }, [pageNo]);

// // Use useEffect to trigger fetchResults when filters change
// useEffect(() => {
//   applyFilters(); // Reset and fetch results when filters change
// }, [filters]);