module.exports = {
  webpack: (config) => {
    // Suppress source-map-loader warnings for react-zoom-pan-pinch
    config.module.rules = config.module.rules.map((rule) => {
      if (rule.use && Array.isArray(rule.use)) {
        rule.use = rule.use.map((useItem) => {
          if (
            typeof useItem === 'object' &&
            useItem.loader &&
            useItem.loader.includes('source-map-loader')
          ) {
            return {
              ...useItem,
              filter: {
                include: /node_modules\/react-zoom-pan-pinch/,
                exclude: /node_modules\/react-zoom-pan-pinch/,
              },
            };
          }
          return useItem;
        });
      }
      return rule;
    });
    return config;
  },
};
