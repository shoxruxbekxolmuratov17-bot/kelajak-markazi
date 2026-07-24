module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // SDK 54 ships Hermes v0 compiler — it cannot emit bytecode for private class fields.
      // babel-preset-expo 57 defaults to hermes-v1 transforms when jsEngine=hermes.
      ['babel-preset-expo', { unstable_transformProfile: 'hermes-v0' }],
    ],
  };
};
