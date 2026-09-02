import { useEffect, useRef } from "react";

const tagline =
  "Let an agent prepare the work. Keep every prescribing decision with the clinician.";

export function LandingReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-landing-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}

export function TaglineReveal() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>("[data-reveal-word]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        words.forEach((word, index) => {
          window.setTimeout(() => word.classList.add("is-visible"), reduceMotion ? 0 : index * 55);
        });
        observer.disconnect();
      },
      { rootMargin: "0px 0px -24%", threshold: 0.2 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="tagline-reveal section-shell"
      ref={sectionRef}
      aria-label="Core promise"
      data-landing-reveal
    >
      <p>
        {tagline.split(" ").map((word, index) => (
          <span data-reveal-word key={`${word}-${index}`}>
            {word}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
