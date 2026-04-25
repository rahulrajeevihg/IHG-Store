import { useState, useEffect, useRef } from 'react';

const RangeSlider = ({ MIN = 0, MAX = 100000, label, label_classname, setRanges, ranges, filters }) => {
    // console.log('priceRange', filters);
    const COLOR_TRACK = "#f1f1f1";
    const COLOR_RANGE = "#ddd";



    // Create references for sliders and tooltips
    const fromSliderRef = useRef(null);
    const toSliderRef = useRef(null);
    const fromTooltipRef = useRef(null);
    const toTooltipRef = useRef(null);

    // State for slider values
    const [fromValue, setFromValue] = useState(Number(ranges && ranges.min ? ranges.min : MIN));
    const [toValue, setToValue] = useState(Number(ranges && ranges.max ? ranges.max : MAX));

    // State to control tooltip visibility
    const [showFromTooltip, setShowFromTooltip] = useState(false);
    const [showToTooltip, setShowToTooltip] = useState(false);

    useEffect(() => {
        setFromValue(ranges.min)
        setToValue(ranges.max)
        // console.log("range", fromValue, toValue)
    }, [ranges])

    // Update the slider background to represent the range
    const fillSlider = (from, to) => {
        const rangeDistance = MAX - MIN;
        const fromPosition = from - MIN;
        const toPosition = to - MIN;

        const toSlider = toSliderRef.current;

        toSlider.style.background = `linear-gradient(
      to right,
      ${COLOR_TRACK} 0%,
      ${COLOR_TRACK} ${(fromPosition) / rangeDistance * 100}%,
      ${COLOR_RANGE} ${(fromPosition) / rangeDistance * 100}%,
      ${COLOR_RANGE} ${(toPosition) / rangeDistance * 100}%, 
      ${COLOR_TRACK} ${(toPosition) / rangeDistance * 100}%, 
      ${COLOR_TRACK} 100%)`;
    };

    // Toggle accessibility based on slider values
    const setToggleAccessible = (slider) => {
        if (Number(slider.value) <= 0) {
            slider.style.zIndex = 2;
        } else {
            slider.style.zIndex = 0;
        }
    };

    // Set the tooltip position and value
    const setTooltip = (slider, tooltip) => {
        const value = slider.value;
        tooltip.textContent = `${value}`;
        const thumbPosition = (value - slider.min) / (slider.max - slider.min);
        const percent = thumbPosition * 100;
        const markerWidth = 20; // Width of the marker in pixels
        const offset = (((percent - 50) / 50) * markerWidth) / 2;
        tooltip.style.left = `calc(${percent}% - ${offset}px)`;
    };

    // Handle slider input change
    const handleFromSliderChange = (e) => {
        const newFromValue = Math.min(Number(e.target.value), toValue); // Ensure fromValue <= toValue
        setFromValue(newFromValue);
        setRanges({ ...ranges, min: newFromValue, max: toValue });
    };
    
    const handleToSliderChange = (e) => {
        const newToValue = Math.max(Number(e.target.value), fromValue); // Ensure toValue >= fromValue
        setToValue(newToValue);
        setRanges({ ...ranges, min: fromValue, max: newToValue });
    };

    useEffect(() => {
        fillSlider(fromValue, toValue);
        setToggleAccessible(toSliderRef.current);
        setTooltip(fromSliderRef.current, fromTooltipRef.current);
        setTooltip(toSliderRef.current, toTooltipRef.current);
    }, [fromValue, toValue]);

    const handleFromInputChange = (e) => {
        let value = Number(e.target.value);
        if (value < MIN) value = MIN;
        if (value > toValue) value = toValue;
        setFromValue(value);
        setRanges({ min: value, max: toValue });
    };

    const handleToInputChange = (e) => {
        let value = Number(e.target.value);
        if (value > MAX) value = MAX;
        if (value < fromValue) value = fromValue;
        setToValue(value);
        setRanges({ min: fromValue, max: value });
    };

    return (
        <>
            <label htmlFor="range" className={`${label_classname}`}>{label}</label>

            <div className='flex items-center gap-[10px] justify-between pb-[15px]'>
                <input
                    min={MIN}
                    // readOnly
                    onChange={handleFromInputChange}
                    max={MAX}
                    type="number"
                    className='border text-[#504a4a] border-[1px] border-[#0000001F] rounded-[5px] w-[50%] h-[35px] px-[10px]'
                    value={fromValue}
                />
                <input
                    min={MIN}
                    // readOnly
                    onChange={handleToInputChange}
                    max={MAX}
                    type="number"
                    className='border text-[#504a4a] border-[1px] border-[#0000001F] rounded-[5px] w-[50%] h-[35px] px-[10px]'
                    value={toValue}
                />
            </div>

            <div className="range_container">
                <div className="sliders_control">
                    <div
                        ref={fromTooltipRef}
                        className={`slider-tooltip ${showFromTooltip ? 'visible' : 'hidden'}`}
                    >
                        {`$${fromValue}`}
                    </div>
                    <input
                        ref={fromSliderRef}
                        id="fromSlider"
                        type="range"
                        value={fromValue}
                        min={MIN}
                        max={MAX}
                        step={10}
                        onChange={handleFromSliderChange}
                        onMouseEnter={() => setShowFromTooltip(true)}  // Show tooltip on hover
                        onMouseLeave={() => setShowFromTooltip(false)} // Hide tooltip when not hovering
                        onFocus={() => setShowFromTooltip(true)} // Show tooltip when active
                        onBlur={() => setShowFromTooltip(false)} // Hide tooltip when not active
                    />
                    <div
                        ref={toTooltipRef}
                        className={`slider-tooltip ${showToTooltip ? 'visible' : 'hidden'}`}
                    >
                        {`$${toValue}`}
                    </div>
                    <input
                        ref={toSliderRef}
                        id="toSlider"
                        type="range"
                        value={toValue}
                        min={MIN}
                        max={MAX}
                        step={10}
                        onChange={handleToSliderChange}
                        onMouseEnter={() => setShowToTooltip(true)}  // Show tooltip on hover
                        onMouseLeave={() => setShowToTooltip(false)} // Hide tooltip when not hovering
                        onFocus={() => setShowToTooltip(true)} // Show tooltip when active
                        onBlur={() => setShowToTooltip(false)} // Hide tooltip when not active
                    />
                </div>
            </div>
        </>
    );
};

export default RangeSlider;












// import { useState, useEffect, useRef } from 'react';

// const RangeSlider = ({ MIN = 0, MAX = 100, label, label_classname, setRanges, ranges }) => {
//     const COLOR_TRACK = "#CBD5E1";
//     const COLOR_RANGE = "#000";

//     const fromSliderRef = useRef(null);
//     const toSliderRef = useRef(null);
//     const fromTooltipRef = useRef(null);
//     const toTooltipRef = useRef(null);

//     const [fromValue, setFromValue] = useState(Number(ranges?.min ?? MIN));
//     const [toValue, setToValue] = useState(Number(ranges?.max ?? MAX));

//     const [showFromTooltip, setShowFromTooltip] = useState(false);
//     const [showToTooltip, setShowToTooltip] = useState(false);

//     const fillSlider = (from, to) => {
//         const rangeDistance = MAX - MIN;
//         const fromPosition = ((from - MIN) / rangeDistance) * 100;
//         const toPosition = ((to - MIN) / rangeDistance) * 100;

//         toSliderRef.current.style.background = `linear-gradient(
//             to right,
//             ${COLOR_TRACK} 0%,
//             ${COLOR_TRACK} ${fromPosition}%,
//             ${COLOR_RANGE} ${fromPosition}%,
//             ${COLOR_RANGE} ${toPosition}%,
//             ${COLOR_TRACK} ${toPosition}%,
//             ${COLOR_TRACK} 100%)`;
//     };

//     const setTooltip = (slider, tooltip) => {
//         const value = slider.value;
//         tooltip.textContent = `${value}`;
//         const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
//         const offset = (((percent - 50) / 50) * 20) / 2;
//         tooltip.style.left = `calc(${percent}% - ${offset}px)`;
//     };

//     const handleFromSliderChange = (e) => {
//         const newValue = Math.min(Number(e.target.value), toValue);
//         setFromValue(newValue);
//         setRanges({ min: newValue, max: toValue });
//     };

//     const handleToSliderChange = (e) => {
//         const newValue = Math.max(Number(e.target.value), fromValue);
//         setToValue(newValue);
//         setRanges({ min: fromValue, max: newValue });
//     };

//     const handleFromInputChange = (e) => {
//         let value = Number(e.target.value);
//         if (value < MIN) value = MIN;
//         if (value > toValue) value = toValue;
//         setFromValue(value);
//         setRanges({ min: value, max: toValue });
//     };

//     const handleToInputChange = (e) => {
//         let value = Number(e.target.value);
//         if (value > MAX) value = MAX;
//         if (value < fromValue) value = fromValue;
//         setToValue(value);
//         setRanges({ min: fromValue, max: value });
//     };

//     useEffect(() => {
//         fillSlider(fromValue, toValue);
//         setTooltip(fromSliderRef.current, fromTooltipRef.current);
//         setTooltip(toSliderRef.current, toTooltipRef.current);
//     }, [fromValue, toValue]);

//     return (
//         <>
//             <label htmlFor="range" className={label_classname}>{label}</label>

//             <div className="flex items-center gap-2 pb-4">
//                 <input
//                     type="number"
//                     className="border text-gray-600 border-gray-300 rounded-md w-20 h-9 px-2"
//                     value={fromValue}
//                     min={MIN}
//                     max={MAX}
//                     onChange={handleFromInputChange}
//                 />
//                 <input
//                     type="number"
//                     className="border text-gray-600 border-gray-300 rounded-md w-20 h-9 px-2"
//                     value={toValue}
//                     min={MIN}
//                     max={MAX}
//                     onChange={handleToInputChange}
//                 />
//             </div>

//             <div className="range_container">
//                 <div className="sliders_control">
//                     <div ref={fromTooltipRef} className={`slider-tooltip ${showFromTooltip ? 'visible' : 'hidden'}`}>
//                         {fromValue}
//                     </div>
//                     <input
//                         ref={fromSliderRef}
//                         type="range"
//                         value={fromValue}
//                         min={MIN}
//                         max={MAX}
//                         step={1}
//                         onChange={handleFromSliderChange}
//                         onMouseEnter={() => setShowFromTooltip(true)}
//                         onMouseLeave={() => setShowFromTooltip(false)}
//                     />
//                     <div ref={toTooltipRef} className={`slider-tooltip ${showToTooltip ? 'visible' : 'hidden'}`}>
//                         {toValue}
//                     </div>
//                     <input
//                         ref={toSliderRef}
//                         type="range"
//                         value={toValue}
//                         min={MIN}
//                         max={MAX}
//                         step={1}
//                         onChange={handleToSliderChange}
//                         onMouseEnter={() => setShowToTooltip(true)}
//                         onMouseLeave={() => setShowToTooltip(false)}
//                     />
//                 </div>
//             </div>
//         </>
//     );
// };

// export default RangeSlider;
