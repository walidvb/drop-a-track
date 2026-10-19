// Imported files come out of the bundler as URLs.
declare module "*.otf" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}
declare module "*.css";
