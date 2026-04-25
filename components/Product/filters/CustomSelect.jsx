import style from '@/styles/Select.module.scss'
import { useState } from 'react'
const CustomSelect = ({ options, placeholder, value, onChnage, type = 'select' }) => {

    return (
        <>
            {type == 'multi' ? <MultiSelect onChnage={onChnage} options={options} placeholder={placeholder} value={value} /> :
                <div className={`${style.select_menu} ${style.active}`}>
                    <div className={`${style.select_btn}`}>
                        <span className={`${style.sBtn_text}`}>{value ? value : placeholder}</span>
                        <i className="bx bx-chevron-down"></i>
                    </div>

                    {options &&
                        <ul className={`${style.options}`}>
                            {options.map(res => (
                                <li className={`${style.option}`} key={res.name}>
                                    <span className={`${style.option_text}`}>{res.brand_name}</span>
                                </li>
                            ))}
                        </ul>
                    }

                </div>
            }
        </>
    )
}

const MultiSelect = ({ options, placeholder, onChnage, }) => {
    const [show, setShow] = useState(false)
    const activate = () => {
        setShow(prev => !prev)
    }

    const filteredData = (data) => {
        const datas = data.filter(res => { return res.isActive })

        return datas
    }

    return (
        <>
            <div id='select_menu' className={`${style.select_menu} ${style.active}`}>
                <div className={`${style.select_btn} `} onClick={activate}>
                    {options && filteredData(options) && filteredData(options).length > 0 ? <>
                        <div className='flex items-center gap-[10px] flex-wrap'>
                            {filteredData(options).map(res => (
                                <div key={res.name} className='bg-[#F0F0F0] p-[5px_10px] rounded-[5px] flex-[0_0_auto] flex items-center gap-[10px] justify-between'>
                                    <p className='text-[#000] text-[13px]'>{res.brand_name}</p>

                                    <p className='cursor-pointer' onClick={(e) => {
                                        e.stopPropagation()
                                        onChnage(res)
                                    }
                                    }>X</p>
                                </div>
                            ))}

                        </div>
                    </> :
                        <span className={`${style.sBtn_text}`}>{placeholder}</span>
                    }
                    <i className="bx bx-chevron-down"></i>
                </div>

                {(options && show) &&
                    <ul id='option_div' className={`${style.options} ${show ? style.active : ''}`}>
                        {options.map(res => (
                            <li onClick={() => {
                                setShow(false)
                                onChnage(res)
                            }} className={`${style.option} `} key={res.name}>
                                <span className={`${style.option_text} ${res.isActive ? 'font-semibold text-[14px] !text-[#000]' : ''}`}>{res.brand_name}</span>
                            </li>
                        ))}
                    </ul>
                }
            </div>
        </>
    )
}

export default CustomSelect