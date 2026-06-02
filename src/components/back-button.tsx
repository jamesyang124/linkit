import Link from "next/link";

export function BackButton() {
  return (
    <Link href="/" className="back-button">
      ← Back
    </Link>
  );
}
