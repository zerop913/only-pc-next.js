module.exports = {
  presets: [
    ["@babel/preset-env", { 
      targets: { node: "current" },
      modules: false // Отключаем трансформацию модулей для Next.js
    }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/plugin-syntax-import-attributes"],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { 
          targets: { node: "current" },
          modules: "commonjs" // Только для тестов используем CommonJS
        }],
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript",
      ]
    }
  }
};
