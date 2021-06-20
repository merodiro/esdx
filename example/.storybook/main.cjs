module.exports = {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  typescript: {
    check: true, // type-check stories during Storybook build
  },
  core: {
    builder: 'storybook-builder-vite',
  },
};
