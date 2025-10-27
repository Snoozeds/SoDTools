export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-ui-dark text-ui-text text-center">
      <h1 className="text-4xl font-bold mb-4 drop-shadow-[0_0_6px_theme(colors.ui-border)]">
        404 - Page Not Found
      </h1>
      <p className="text-ui-text-dim mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="text-ui-text underline hover:text-ui-border transition-colors"
      >
        Return Home
      </a>
    </div>
  );
}
