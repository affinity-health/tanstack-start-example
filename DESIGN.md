---
name: Northstar demo telehealth platform
description: A copyable example telehealth clinic centered on a synthetic medication marketplace and patient cart.
colors:
  canvas: "#f4f7f6"
  surface: "#ffffff"
  surface-subtle: "#eef3f1"
  text: "#10221e"
  text-muted: "#52655f"
  border: "#d5dfdc"
  accent: "#0d6b5f"
  accent-hover: "#09554c"
  accent-soft: "#e2efeb"
  dark: "#131209"
typography:
  family: '"Manrope", sans-serif'
  hero: "48px / 1"
  hero-mobile: "36px / 40px"
  section: "36px / 40px"
  section-mobile: "30px / 36px"
  body-large: "18px / 28px"
  body: "16px / 24px"
  small: "14px / 20px"
  detail: "12px / 16px"
spacing:
  0: "0"
  25: "2px"
  50: "4px"
  75: "8px"
  100: "12px"
  200: "16px"
  300: "24px"
  400: "32px"
  500: "40px"
  600: "48px"
  700: "64px"
  800: "80px"
  900: "96px"
radius:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "999px"
motion:
  duration: "700ms"
  reveal-duration: "800ms"
  easing: "cubic-bezier(0.32, 0.72, 0, 1)"
---

# Design system: Northstar demo telehealth platform

## Conversion goal

The page presents one product: Northstar, a small example telehealth clinic that people can fork.
WebMCP Challenge judges and telehealth platform builders should sign in, enter the clinic, and use
the same marketplace and cart shipped in the repository. Affinity Test is the Test backend inside
Northstar. WebMCP is an optional integration already wired into the authenticated clinic.

The public page uses layout A: a classic hero, supporting sections, and a repeated sign in call to
action. The generated hero frame supports the story. The actual clinic starts after authentication
and uses the denser EmrShell system.

## Section order

1. Hero with the copyable clinic promise, primary action, trust line, and generated product frame
2. Three benefits covering the clinic, optional WebMCP access, and the clinical boundary
3. The mandatory word by word tagline reveal
4. Three step workflow explanation
5. Clear roles for Northstar, Affinity Test, WebMCP, and the clinician
6. Six plain language questions and answers
7. Final call to action for sign in and account creation

## Type

Manrope is the only interface family. Use regular through bold weights and never use italics or weight 900. Every size and paired line height follows the Tailwind scale recorded above. Headings use
balanced wrapping. Body copy uses pretty wrapping. Hero copy stays within 680px and breaks only where
the thought changes.

Visible copy uses sentence case and active voice. Do not use hyphens, exclamation marks, vague
transformation language, or generic claims. The terms Elevate, Seamless, and Unleash are prohibited.

## Color and surfaces

Backgrounds are flat. The pale green gray canvas supports white product surfaces, dark body text, and
one restrained clinical teal. The proof section uses the approved dark background. The hero heading
uses the Elaya light theme text treatment from black to gray. No other gradient is allowed.

Cards receive a complete border or no border. Never use a border on only one side of a card. Nested
corners follow the outer radius minus the inset gap when the result exceeds 2px.

## Spacing and shape

All padding, margin, and gap values resolve to the spacing table in the frontmatter. Primary buttons
use 8px vertical and 12px horizontal padding. Landing cards use 16px corners, the generated hero frame
uses 24px, and controls use 8px or 12px. The floating navigation and status dots use the full radius.

## Icons

Use Phosphor icons on the landing page and Lucide icons inside EmrShell. Icons clarify a named action
or state. They do not decorate headings.

## Motion

Interactive motion uses `cubic-bezier(0.32, 0.72, 0, 1)` and never a browser default easing. Hero
content enters once. Later sections use IntersectionObserver for a heavy fade and rise. The tagline
reveal activates individual words in reading order. Reduced motion removes transforms, blur, delay,
and animation while keeping every state visible.

## Product and safety states

The authenticated clinic must retain hover, active, focus, loading, empty, and specific inline error
states. Northstar is the example clinic and Affinity Test is its Test backend. Browser tools are
optional. They may search the marketplace, open a product, add it to a patient cart, and inspect the
cart. They may not confirm checkout, create an order, prescribe, sign, or transmit anything.
Affinity Test, synthetic data, clinician checkout, and never Live remain visible in the workflow.

## Ship requirements

Keep the skip link, branded favicon, title, description, social metadata, generated social image,
semantic landmarks, image alt text, legal links, custom not found experience, and a route back from
every public page. The landing page is evergreen and should remain indexable.
