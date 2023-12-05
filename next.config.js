/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nextjs has an issue with pdfjs-dist which optionally uses the canvas package
  // for Node.js compatibility. This causes a "Module parse failed" error when
  // building the app. Since pdfjs-dist is only used on client side, we disable
  // the canvas package for webpack
  // https://github.com/mozilla/pdf.js/issues/16214
  output: 'standalone',

  async redirects() {
    return [
      {
        source: '/',
        destination: '/', // replace '/about' with your desired route
        permanent: true,
      },
    ]
  },

  webpack: (config) => {
    // Setting resolve.alias to false tells webpack to ignore a module
    // https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Add this line to change the pages directory
    //config.resolve.alias['~'] = path.resolve(__dirname, 'src/app');
    return config;
  },
};

module.exports = nextConfig;
