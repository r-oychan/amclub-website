export function PhotoGallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  const mid = Math.ceil(images.length / 2);
  const row1 = images.slice(0, mid);
  const row2 = images.slice(mid);

  const resolveUrl = (url: string) =>
    url.startsWith('http') ? url : `${url}`;

  return (
    <section className="py-10 bg-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-10">
        <h2
          className="font-heading text-primary text-center mb-8"
          style={{ fontSize: '26.56px', fontWeight: 300, fontStyle: 'italic' }}
        >
          Photo Gallery
        </h2>

        <div className="flex flex-col gap-2.5">
          {/* Row 1 */}
          <div className="flex flex-row gap-2.5 items-stretch">
            {row1.map((img, i) => (
              <div
                key={i}
                className="flex-shrink-0 overflow-hidden"
                style={{ width: `${100 / row1.length}%`, aspectRatio: '4 / 3' }}
              >
                <img
                  src={resolveUrl(img)}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Row 2 */}
          {row2.length > 0 && (
            <div className="flex flex-row gap-2.5 items-stretch">
              {row2.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 overflow-hidden"
                  style={{ width: `${100 / row2.length}%`, aspectRatio: '4 / 3' }}
                >
                  <img
                    src={resolveUrl(img)}
                    alt={`Gallery ${mid + i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
