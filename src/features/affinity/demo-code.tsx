import { Code2 } from "lucide-react";

export function DemoCode({ children, title }: { children: string; title: string }) {
  return (
    <details className="demo-code">
      <summary>
        <Code2 aria-hidden size={15} />
        {title}
      </summary>
      <pre>
        <code>{children.trim()}</code>
      </pre>
    </details>
  );
}
