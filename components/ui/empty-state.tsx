export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100/80 text-ink-400">
          {icon}
        </div>
      )}
      <h3 className="mt-3 text-sm font-extrabold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
