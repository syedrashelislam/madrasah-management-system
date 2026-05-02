const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      <ul className="absolute inset-0 overflow-hidden" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const sizes = [80, 20, 20, 60, 20, 10, 150, 25, 15, 45];
          const lefts = [25, 10, 70, 40, 65, 75, 35, 55, 20, 85];
          const delays = [0, 2, 4, 0, 0, 3, 7, 15, 2, 0];
          const durations = [25, 12, 25, 18, 25, 25, 11, 45, 35, 18];
          return (
            <li
              key={i}
              style={{
                position: 'absolute',
                display: 'block',
                width: sizes[i],
                height: sizes[i],
                background: 'rgba(212, 175, 55, 0.12)',
                animation: `animate ${durations[i]}s linear infinite`,
                bottom: -150,
                left: `${lefts[i]}%`,
                borderRadius: '50%',
                animationDelay: `${delays[i]}s`,
              }}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default BackgroundAnimation;
