// Uses YouTube's privacy-enhanced domain (no cookies until play).
// Rendered server-side — iframes are valid RSC output.
export function YouTubeEmbed({ videoId, title = 'Project video' }: { videoId: string; title?: string }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2" style={{ paddingTop: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
