export function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function ConversationListSkeleton() {
  return (
    <div className="flex-col gap-2" style={{ padding: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="flex items-center gap-3" key={i} style={{ padding: '8px 4px' }}>
          <Skeleton width={44} height={44} radius={999} />
          <div className="flex-col gap-1" style={{ flex: 1 }}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="85%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex-col gap-3" style={{ padding: 24 }}>
      {[1, 0, 1, 1, 0].map((out, i) => (
        <div key={i} className={`flex ${out ? '' : ''}`} style={{ justifyContent: out ? 'flex-end' : 'flex-start' }}>
          <Skeleton width={Math.random() * 120 + 120} height={38} radius={16} />
        </div>
      ))}
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="flex items-center gap-3" key={i}>
          <Skeleton width={36} height={36} radius={999} />
          <Skeleton width="50%" height={12} />
        </div>
      ))}
    </div>
  );
}
