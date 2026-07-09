export function GlassCard({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={`glass-card ${className}`} {...props}>
      {children}
    </Component>
  );
}
