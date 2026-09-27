export default function ComicPanel({ comic }) {
  if (!comic) return null
  return (
    <div className="comic-overlay" aria-live="polite">
      <div className="comic-lines" />
      <div className="comic-dots" />
      <div className="comic-caption">{comic.caption}</div>
      <div className="comic-bang"><span className="onomatopeya">{comic.bang}</span></div>
    </div>
  )
}
