export default function GameCard({
  title,
  children,
  className = "",
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}