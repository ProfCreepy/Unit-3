export default function Divider({ direction = 'vertical' }) {
  const className = direction === 'vertical' ? 'divider-vertical' : 'divider-horizontal';
  return <div className={className}></div>;
}
