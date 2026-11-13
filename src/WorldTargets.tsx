import { masters, type Placement } from "./sprites";
import { targets, type TargetId } from "./levels";
export function WorldTargets({
  boxes,
  background,
}: {
  boxes: Record<TargetId, Placement>;
  background: string;
}) {
  return (
    <svg className="world-targets" viewBox="0 0 1536 1024" aria-hidden="true">
      <defs>
        {targets.map((t) => (
          <clipPath key={t.id} id={`occlude-${t.id}`}>
            {boxes[t.id].occluders?.map((o, i) => (
              <rect
                key={i}
                x={o.x * 1536}
                y={o.y * 1024}
                width={o.w * 1536}
                height={o.h * 1024}
              />
            ))}
          </clipPath>
        ))}
      </defs>
      {targets.map((t) => {
        const b = boxes[t.id],
          cx = (b.x + b.w / 2) * 1536,
          cy = (b.y + b.h / 2) * 1024;
        return (
          <g
            key={t.id}
            data-target={t.id}
            transform={`translate(${cx} ${cy}) rotate(${b.rotate || 0}) skewX(${b.skew || 0})`}
          >
            {(t.id === "santa" || t.id === "reindeer") && (
              <ellipse
                cx="0"
                cy={b.h * 1024 * 0.46}
                rx={b.w * 1536 * 0.3}
                ry="2"
                fill="#343345"
                opacity=".16"
              />
            )}
            <image
              className="world-sprite"
              data-object={t.id}
              href={masters[t.id]}
              x={(-b.w * 1536) / 2}
              y={(-b.h * 1024) / 2}
              width={b.w * 1536}
              height={b.h * 1024}
              preserveAspectRatio="none"
              style={{ filter: `brightness(${b.brightness || 1})` }}
            />
          </g>
        );
      })}
      {targets.map((t) =>
        boxes[t.id].occluders?.length ? (
          <image
            key={t.id}
            href={background}
            width="1536"
            height="1024"
            clipPath={`url(#occlude-${t.id})`}
          />
        ) : null,
      )}
    </svg>
  );
}
