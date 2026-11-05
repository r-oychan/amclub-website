import type { VenueData } from '../../lib/venue-types';
import { isHardLink } from '../../lib/links';
import { openChatbot } from '../../lib/chatbot-events';
import { DetailSection } from './DetailSection';
import { ContactRow } from './ContactRow';

/** "Need Help?" side section — forms, chat assistant, front desk, phone. */
export function HelpContactsSection({ data }: { data: NonNullable<VenueData['helpContacts']> }) {
  return (
    <DetailSection icon="help" title={data.heading ?? 'Need Help?'}>
      <div className="flex flex-col" style={{ gap: '16px' }}>
        {data.items.map((item, i) => {
          const icon = item.icon ?? 'form';
          return (
            <ContactRow
              key={`${item.text}-${i}`}
              icon={icon}
              text={item.text}
              href={item.href}
              external={isHardLink(item.href) && !/^(tel|mailto):/i.test(item.href ?? '')}
              onClick={item.action === 'open-chat' ? openChatbot : undefined}
            />
          );
        })}
      </div>
    </DetailSection>
  );
}
