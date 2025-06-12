import Image from "next/image";
import { check_Image } from "@/libs/api";
import { useState } from "react";
import Link from "next/link";

export default function ListStyle({ data }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleClick = (i) => {
    if (openIndex === i) {
      setOpenIndex(null);
    } else {
      setOpenIndex(i);
    }
  };
  return (
    <>
      <div className="main-width ">
        {data.section_name == "List Style 1" && (
          <div className="flex md:flex-col gap-[10px] w-[90%] mx-auto my-[40px]">
            <div className="lg:flex-[0_0_calc(40%_-_10px)] lg:mr-[100px]">
              <div>
                <Image
                  src={check_Image(data.image)}
                  width={30}
                  height={30}
                  alt="image"
                  className="w-[100%] rounded-[10px]"
                />
              </div>
            </div>
            <div className="lg:flex-[0_0_calc(50%_-_10px)]">
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold text-[#121828]">
                {data.title}
              </h1>
              <p className="text-[16px] text[#4e565f]">{data.subtitle}</p>
              {data.list_data.map((item, i) => {
                return (
                  <div
                    onClick={() => toggleClick(i)}
                    className="cursor-pointer bg-[#fafafa] my-[10px] p-[10px] rounded-[10px]"
                  >
                    <h1
                      className={`text-[14px] ${
                        openIndex === i ? "primary_color" : "text-[#121828]"
                      } `}
                    >
                      {item.title}
                    </h1>
                    {openIndex === i && (
                      <p className="text-[14px]">{item.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.section_name == "List Style 2" && (
          <div className="flex md:flex-col gap-[10px] w-[90%] mx-auto my-[40px]">
            <div className="lg:flex-[0_0_calc(50%_-_10px)] ">
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold text-[#121828]">
                {data.title}
              </h1>
              <p className="text-[16px] text-[#4e565f] ">{data.subtitle}</p>
              <div className="flex md:flex-col gap-[20px] my-[20px]">
                {data.list_data.map((item, i) => {
                  return (
                    <div className="lg:flex-[0_0_calc(50%_-_20px)]">
                      <div className="w-[60px] h-[60px] rounded-[50%] primary_bg flex items-center justify-center">
                        <Image
                          src={check_Image(item.icon)}
                          width={30}
                          height={30}
                          alt="icon"
                          className=""
                        />
                      </div>
                      <h1 className="text-[22px] my-[10px] text-[#121828]">
                        {item.title}
                      </h1>
                      <p className="text-[16px] my-[10px] text-[#4e565f]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button className="primary_bg text-white text-[14px] font-medium px-[10px] py-[5px] rounded-[5px]">
                {JSON.parse(data.btn).btn_text}
              </button>
            </div>
            <div className="lg:flex-[0_0_calc(40%_-_10px)] lg:ml-[100px]">
              <div>
                <Image
                  src={check_Image(data.image)}
                  width={30}
                  height={30}
                  alt="image"
                  className="w-[100%] rounded-[10px]"
                />
              </div>
            </div>
          </div>
        )}
        {data.section_name == "List Style 3" && (
          <div className="w-[90%] mx-auto">
            <div className="flex flex-col items-center justify-center gap-[10px] my-[20px]">
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold text-[#121828]">
                {data.title}
              </h1>
              <p className="text-[16px] text-[#4e565f]">{data.subtitle}</p>
            </div>
            <div className="flex md:flex-col lg:flex-wrap gap-[25px]">
              {data.list_data.map((item, i) => {
                return (
                  <div key={i} className="lg:flex-[0_0_calc(50%_-_15px)] ">
                    <div className="flex items-center md:p-[10px] lg:p-[25px] bg-[#f1f5ff] shadow-[#00000014_0_5px_6px] rounded-[15px]">
                      <div className="flex-[0_0_calc(40%_-_10px)] text-center">
                        <Image
                          src={check_Image(item.image)}
                          width={30}
                          height={30}
                          alt="image"
                          className=" md:h-[80px] md:w-[80px] lg:h-[150px] lg:w-[150px] rounded-[50%] object-cover"
                        />
                      </div>
                      <div>
                        <h1 className="text-[18px] lg:text-[22px] font-semibold text-[#121828]">
                          {item.title}
                        </h1>
                        <p className="text-[13px] text-[#4e565f]">
                          {item.description}
                        </p>
                        <Link href={item.redirect_url}>
                          <button className="cursor-pointer flex items-center text-primary gap-[10px] ">
                            {item.button}
                            <Image
                              src={"/leftArrow.svg"}
                              width={10}
                              height={10}
                              alt="rightarrow"
                            />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.section_name == "List Style 4" && (
          <div className="flex md:flex-col-reverse gap-[10px] w-[90%] mx-auto my-[40px]">
            <div className="lg:flex-[0_0_calc(50%_-_10px)]">
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold text-[#121828]">
                {data.title}
              </h1>
              <p className="text-[16px] text-[#4e565f]">{data.subtitle}</p>
              {data.list_data.map((item, i) => {
                return (
                  <div
                    onClick={() => toggleClick(i)}
                    className="cursor-pointer "
                  >
                    <div className="bg-[#fafafa] my-[10px] p-[10px] rounded-[10px]">
                      <h1
                        className={`text-[14px] flex justify-between items-center ${
                          openIndex === i ? "primary_color" : "text-[#121828]"
                        } `}
                      >
                        {item.title}{" "}
                        {openIndex === i ? (
                          <Image
                            src={"/down.svg"}
                            width={10}
                            height={10}
                            alt="down"
                            className="w-[10px] h-[10px]"
                          />
                        ) : (
                          <Image
                            src={"/right.svg"}
                            width={10}
                            height={10}
                            className="w-[10px] h-[10px]"
                            alt="right"
                          />
                        )}{" "}
                      </h1>
                    </div>
                    {openIndex === i && (
                      <p className="text-[14px] p-[10px]">{item.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="lg:flex-[0_0_calc(40%_-_10px)] lg:ml-[100px]">
              <div>
                <Image
                  src={check_Image(data.image)}
                  width={30}
                  height={30}
                  alt="image"
                  className="w-[100%] rounded-[10px]"
                />
              </div>
            </div>
          </div>
        )}

        {data.section_name == "List Style 5" && (
          <div className="w-[90%] mx-auto my-[40px]">
            <div className="text-center my-[20px]">
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold text-[#121828]">{data.title}</h1>
            </div>
            <div className="flex md:flex-col gap-[25px] ">
              {data.list_data.map((item, i) => {
                return (
                  <div
                    key={i}
                    className="lg:flex-[0_0_calc(33.33%_-_15px)] p-[40px] flex flex-col gap-[20px] items-center justify-center group hover:bg-primary rounded-[10px] cursor-pointer"
                  >
                    <div className="w-[90px] h-[90px] rounded-[50%] flex items-center justify-center border group-hover:bg-white">
                      <Image
                        src={check_Image(item.icon)}
                        width={30}
                        height={30}
                        alt="icon"
                      />
                    </div>
                    <div className="text-center">
                      <h1 className="text-[22px] font-semibold group-hover:text-white text-[#121828]">
                        {item.title}
                      </h1>
                      <p className="text-[13px] my-[5px] group-hover:text-white text-[#4e565f]">
                        {item.description}
                      </p>
                      <Link href={item.redirect_url}>
                        <button className="w-[100%] text-[16px] group-hover:text-white text-[#4e565f] flex items-center cursor-pointer justify-center">
                          {item.button}
                          <Image
                            src={"/leftArrow.svg"}
                            width={10}
                            height={10}
                            alt="rightarrow"
                          />
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.section_name == "List Style 6" && (
          <div className="flex md:flex-col-reverse gap-[10px] w-[90%] mx-auto my-[40px]">
            <div className="lg:flex-[0_0_calc(50%_-_10px)]">
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold text-[#121828]">
                {data.title}
              </h1>
              <p className="text-[16px] text-[#4e565f]">{data.subtitle}</p>
              {data.list_data.map((item, i) => {
                return (
                  <div
                    className="cursor-pointer flex  items-center justify-around border my-[20px] p-[15px] rounded-[15px] group"
                    key={i}
                  >
                    <div className=" flex items-center justify-center group-hover:bg-primary md:h-[80px] md:w-[50px] lg:h-[60px] lg:w-[60px] p-[10px] rounded-[50%]">
                      <Image
                        src={check_Image(item.icon)}
                        width={30}
                        height={30}
                        alt="image"
                      />
                    </div>
                    <div className="flex-[0_0_calc(70%_-_10px)] ">
                      <h1 className={`text-[18px]  lg:text-[22px] text-[#121828] font-semibold  `}>
                        {item.title}
                      </h1>
                      <p className="text-[14px] text-[#4e565f]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="lg:flex-[0_0_calc(40%_-_10px)] lg:ml-[100px]">
              <div>
                <Image
                  src={check_Image(data.image)}
                  width={30}
                  height={30}
                  alt="image"
                  className="w-[100%] rounded-[10px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
