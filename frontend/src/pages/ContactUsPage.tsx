import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { MapGettingHere } from '../components/contact/MapGettingHere';
import { OutletOperatingHours } from '../components/contact/OutletOperatingHours';
import { TalkToUsBanner } from '../components/contact/TalkToUsBanner';
import { contactInfo, outletGroups } from '../data/contactUs';

export default function ContactUsPage() {
  return (
    <>
      <DetailHeroBanner />
      <DetailBreadcrumb
        parentLabel="The American Club"
        parentHref="/home"
        currentName="Contact Us"
      />
      <MapGettingHere info={contactInfo} />
      <OutletOperatingHours groups={outletGroups} defaultGroupId="dining" />
      <TalkToUsBanner />
    </>
  );
}
