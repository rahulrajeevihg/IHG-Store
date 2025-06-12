import Link from "next/link";

export default function Custom404() {
  return (
    <div className="h-[50vh] w-[100%] flex flex-col items-center justify-center gap-[5px]">
      <h1 className="text-center text-[22px]">404 - Page Not Found</h1>
      <Link href="/">
      <button className="primary_bg text-white px-[10px] py-[5px] rounded-[5px]">Go Back to Home</button>
      </Link>
    </div>
  );
}
