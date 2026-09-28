/** Brand mark. Dark variant on the light theme, original light mark on dark (see .logo-* in globals.css). */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <>
      <img src="/img-dark.png" alt="Karthik Iyer" className={`logo-dark ${className}`} />
      <img src="/img.png" alt="Karthik Iyer" className={`logo-light ${className}`} />
    </>
  );
}
