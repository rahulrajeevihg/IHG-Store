import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {

  return (
    <Html lang="en">
      <Head >
        {/* <link rel="stylesheet"  href="https://cdnjs.cloudflare.com/ajax/libs/lightgallery/1.6.12/css/lightgallery.min.css"/> */}
        {/* <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min.js"></script> */}
        {/* <script src="https://cdn.jsdelivr.net/npm/lightgallery@1.6.12/dist/js/lightgallery.min.js"></script> */}
        {/* <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js"></script> */}
        {/* <script src="https://cdnjs.cloudflare.com/ajax/libs/lg-thumbnail/1.1.0/lg-thumbnail.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lg-fullscreen/1.1.0/lg-fullscreen.min.js"></script> */}
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&display=swap"
          rel="preload"
          as="style"
        /> */}
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />


        {/* <link rel="preload" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap" as="style" /> */}
        {/* <link rel="preload" as='style' href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap" /> */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" />


        {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lightgallery/1.6.12/css/lightgallery.min.css" /> */}

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index,follow" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

        {/* <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCJ8kAd5UrYk_dQJxiNYVj3ISaZj9xOMDg&libraries=places"></script> */}

      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
