import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["server.ts"],
  target: "bun",
  outdir: "dist",
  minify: true,
  plugins: [tailwind],
});
if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log(`Built ${result.outputs.length} files.`);
