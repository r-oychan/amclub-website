import type { ContactInfo } from '../../data/contactUs';

interface Props {
  info: ContactInfo;
}

export function MapGettingHere({ info }: Props) {
  return (
    <section className="bg-bg">
      <div className="max-w-7xl mx-auto px-10 pt-10 pb-[80px]">
        <div className="flex flex-col lg:flex-row" style={{ gap: '60px' }}>
          {/* Left — Map */}
          <div className="lg:w-[52%] shrink-0">
            <div className="overflow-hidden rounded-[12px] aspect-[4/3] lg:aspect-auto lg:h-[519px]">
              <iframe
                title="Map of The American Club Singapore"
                src={info.mapEmbedSrc}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </div>

          {/* Right — Getting Here */}
          <div className="flex flex-col" style={{ gap: '40px' }}>
            <h2
              className="font-heading text-primary"
              style={{
                fontSize: '38.4px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-1.152px',
                lineHeight: '42.24px',
              }}
            >
              Getting Here
            </h2>

            <InfoBlock title="Address" lines={info.address} />
            <InfoBlock title="Operating Hours" lines={info.operatingHours} />
            <InfoBlock
              title="Contact Details"
              lines={[`Tel: ${info.phone}`, `Email: ${info.email}`]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      <h3
        className="text-primary uppercase"
        style={{ fontSize: '14.4px', fontWeight: 700, letterSpacing: '0.576px', lineHeight: '20.16px' }}
      >
        {title}
      </h3>
      <div className="flex flex-col" style={{ gap: '4px' }}>
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-text-dark"
            style={{ fontSize: '17.6px', fontWeight: 400, lineHeight: '26.4px' }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
