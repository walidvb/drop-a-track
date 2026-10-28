// PROTOTYPE, wipe me: Google Fonts stand-in for offline dev (`pnpm prototype`): local system fonts instead.
const face = (family) => `@font-face { font-family: '${family}'; src: local('Helvetica Neue'); font-weight: 100 900; }`;
module.exports = {
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap": face("Archivo"),
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap": face("IBM Plex Mono"),
};
