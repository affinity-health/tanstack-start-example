# Prescribing demo design

The reference is the Affinity clinic dashboard, specifically `packages/ui/src/styles.css` and `packages/product/src/shell` in the Affinity monorepo. Use its actual blue (#0365fc), neutral backgrounds, system typography, rounded controls, and Affinity mark. The logo is served from https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp.

Keep the demo to a single 660px prescription form. Patient selection sits above medication selection in reading order. Patient details are one quiet caption, not a separate panel or repeated identity card. The practice is a compact heading above the form. Keep the environment switch in the toolbar. The page fills the viewport with one continuous background; the documentation footer sits at the bottom and follows content on longer pages.

The page uses a #fafafa canvas, white form, #262626 text, #686868 secondary text, and thin neutral borders. Controls are 46px tall with 10px corners. Primary actions are blue and rounded; Preview spans the form width. The page title is 30px, controls 15px, labels 13px, and supporting details 12px. The system font follows the requested clinic reference.

Defaults appear in a neutral inset with directions followed by quantity, days supply, and refills. Optional edits remain collapsed. Prescriber and signing fields appear only after a complete preview. Preserve all existing workflow checks and explicit signing intent.

At mobile widths, retain the same reading order, reduce padding, and hide the optional brand subtitle. Coss components supply selects, menus, inputs, and checkboxes. No decorative navigation, extra setup controls, JSON editor, or new configuration.

Visual verification is pending because the browser connection has failed authentication. Build and type checks do not certify appearance or interaction.
