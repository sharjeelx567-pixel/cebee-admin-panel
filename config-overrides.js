const { override } = require('customize-cra');

const webpackConfig = override(
  (config) => {
    // Fix source-map-loader issues with date-fns and other packages
    const sourceMapLoader = config.module.rules.find(
      (rule) => rule.enforce === 'pre' && rule.loader && rule.loader.includes('source-map-loader')
    );

    if (sourceMapLoader) {
      sourceMapLoader.exclude = /node_modules/;
    }

    return config;
  }
);

const devServerConfig = (configFunction) => {
  return function (proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);

    // Resolve deprecation warning: use setupMiddlewares instead of onBefore/AfterSetupMiddleware
    config.setupMiddlewares = (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      if (config.onBeforeSetupMiddleware) {
        config.onBeforeSetupMiddleware(devServer);
      }

      if (config.onAfterSetupMiddleware) {
        config.onAfterSetupMiddleware(devServer);
      }

      return middlewares;
    };

    delete config.onBeforeSetupMiddleware;
    delete config.onAfterSetupMiddleware;

    return config;
  };
};

module.exports = {
  webpack: webpackConfig,
  devServer: devServerConfig,
};
