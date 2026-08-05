// Animated geometric shapes background — CSS-only, performant.
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent)/20%,transparent_60%)]" />
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className={`geo-shape ${s.shape}`}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            background: s.color,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}

const SHAPES = [
  {
    shape: "square",
    top: "8%",
    left: "5%",
    size: "80px",
    delay: 0,
    duration: 22,
    color: "var(--color-primary)",
    opacity: 0.12,
  },
  {
    shape: "circle",
    top: "20%",
    left: "80%",
    size: "120px",
    delay: 3,
    duration: 28,
    color: "var(--color-chart-1)",
    opacity: 0.15,
  },
  {
    shape: "triangle",
    top: "60%",
    left: "10%",
    size: "100px",
    delay: 1,
    duration: 26,
    color: "var(--color-chart-2)",
    opacity: 0.14,
  },
  {
    shape: "circle",
    top: "75%",
    left: "70%",
    size: "150px",
    delay: 5,
    duration: 32,
    color: "var(--color-chart-4)",
    opacity: 0.12,
  },
  {
    shape: "square",
    top: "40%",
    left: "45%",
    size: "70px",
    delay: 2,
    duration: 20,
    color: "var(--color-chart-3)",
    opacity: 0.13,
  },
  {
    shape: "triangle",
    top: "12%",
    left: "55%",
    size: "90px",
    delay: 4,
    duration: 30,
    color: "var(--color-chart-5)",
    opacity: 0.14,
  },
  {
    shape: "circle",
    top: "50%",
    left: "88%",
    size: "60px",
    delay: 6,
    duration: 24,
    color: "var(--color-primary)",
    opacity: 0.12,
  },
  {
    shape: "square",
    top: "85%",
    left: "30%",
    size: "100px",
    delay: 2.5,
    duration: 27,
    color: "var(--color-chart-2)",
    opacity: 0.13,
  },
];
