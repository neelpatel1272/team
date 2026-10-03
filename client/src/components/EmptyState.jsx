export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <div className="font-bold" style={{ color: 'var(--color-text)', fontSize: 15 }}>{title}</div>
      {description && <div className="text-sm">{description}</div>}
      {action}
    </div>
  );
}
