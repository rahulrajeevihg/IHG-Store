import { NextResponse } from "next/server";

export default function middleware(req) {
  const token = req.cookies.get('api_key')?.valueOf();
//   const path = req.nextUrl.pathname;


        if (!token) {
          const response = NextResponse.redirect(new URL("/login", req.url));
          
          response.headers.set('Cache-Control', 'no-store, max-age=0');
          
          return response;
        }


  return NextResponse.next();
}

export const config = {
  matcher: [            
    '/:list',        
    '/list',        
    '/[...list]',        
    '/pr/:detail',               
    '/',
    '/brand',
    '/search',
    '/search/:search',
    '/tabs/:tab',
  ],
};
