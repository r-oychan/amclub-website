import { PageFade } from '../components/shared/PageFade';

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ul-nested'; items: { text: string; sub?: string[] }[] };

const SECTIONS: Block[] = [
  { type: 'p', text: 'The purpose of this policy ("Data Protection Policy") is to inform you of how The American Club manages Personal Data (as defined below) which is subject to the Singapore Personal Data Protection Act (No. 26 of 2012) ("the Act"). Please take a moment to read this Data Protection Policy so that you know and understand the purposes for which we collect, use and disclose your Personal Data.' },
  { type: 'p', text: 'By interacting with us, submitting information to us, or signing up for any products and services offered by us, you agree and consent to The American Club as well as its representatives and/or agents (collectively referred to herein as "TAC", "us", "we" or "our") collecting, using, disclosing and sharing amongst themselves your Personal Data, and disclosing such Personal Data to The American Club’s authorized service providers and relevant third parties in the manner set forth in this Data Protection Policy.' },
  { type: 'p', text: 'This Data Protection Policy supplements but does not supersede nor replace any other consents you may have previously provided to The American Club in respect of your Personal Data, and your consents herein are additional to any rights which to any of the Companies may have at law to collect, use or disclose your Personal Data.' },
  { type: 'p', text: 'The American Club may from time to time update this Data Protection Policy to ensure that this Data Protection Policy is consistent with our future developments, industry trends and/or any changes in legal or regulatory requirements. Subject to your rights at law, you agree to be bound by the prevailing terms of the Data Protection Policy as updated from time to time on our website www.amclub.org.sg. Please check back regularly for updated information on the handling of your Personal Data.' },

  { type: 'h2', text: '1. Personal Data' },
  { type: 'h3', text: '1.1' },
  { type: 'p', text: 'In this Data Protection Policy, "Personal Data" refers to any data, whether true or not, about an individual who can be identified (a) from that data; or (b) from that data and other information to which we have or are likely to have access, including data in our records as may be updated from time to time.' },
  { type: 'h3', text: '1.2' },
  { type: 'p', text: 'Examples of such Personal Data you may provide to us include (depending on the nature of your interaction with us) name, NRIC, passport or other identification number, nationality, birth date, marital status, telephone number(s), residential/mailing address, email address, vehicle registration details, transactional data, network data and any other information relating to yourself and any individuals which you have provided us in any forms you may have submitted to us (including in the form of biometric data), or via other forms of interaction with you.' },

  { type: 'h2', text: '2. Collection of Personal Data' },
  { type: 'h3', text: '2.1' },
  { type: 'p', text: 'Generally, we collect Personal Data in the following ways:' },
  { type: 'ul', items: [
    'when you submit any form, including but not limited to application, registration, declaration or other forms;',
    'when you enter into any agreement or provide other documentation or information in respect of your interactions with us, or when you use our products and services;',
    'when you interact with our staff, for example, via telephone calls (which may be recorded), letters, face-to-face meetings, social media platforms and emails and at our events and in our outlets;',
    'when you use our electronic services, or interact with us via our app or website or use services on the same;',
    'when you request that we contact you or request that you be included in an email or other mailing list;',
    'when you respond to our promotions, initiatives or to any request for additional Personal Data;',
    'when your images are captured by us via CCTV cameras while you are within our premises, or via photographs or videos taken by us or our representatives when you attend events at our premises;',
    'when you are contacted by, and respond to, our staff;',
    'when we seek information about you and receive your Personal Data in connection with your relationship with us, including for our products and services or job applications, for example, from business partners, public agencies, your ex-employer, referral intermediaries and the relevant authorities; and/or',
    'when you submit your Personal Data to us for any other reason.',
  ] },
  { type: 'h3', text: '2.2' },
  { type: 'p', text: 'When you browse our website, you generally do so anonymously but please see the section below on cookies. We do not, on our website, automatically collect Personal Data unless you provide such information or login with your account credentials. Please note that our website may contain links to other websites. If you visit these other websites, different privacy policies would apply.' },
  { type: 'h3', text: '2.3' },
  { type: 'p', text: 'If you provide us with any Personal Data relating to a third party (e.g. information of your spouse, children, parents, guests and/or employees), by submitting such information to us, you represent to us that you are legally entitled to provide us with such Personal Data and/or have obtained the consent of the third party to provide us with their Personal Data for the respective purposes.' },
  { type: 'h3', text: '2.4' },
  { type: 'p', text: 'You should ensure that all Personal Data submitted to us is complete, accurate, true and correct. Failure on your part to do so may result in our inability to provide you with the products and services you have requested.' },

  { type: 'h2', text: '3. Consent Obligation' },
  { type: 'h3', text: '3.1' },
  { type: 'p', text: 'We may use or disclose your personal data in accordance with applicable laws, including for the following (as applicable):' },
  { type: 'ul-nested', items: [
    { text: 'detecting or preventing illegal activities (e.g. fraud or money laundering) or threats to physical safety and security, ensuring IT and network security, or preventing the misuse of services.' },
    { text: 'Business improvement where there is a need to:', sub: [
      'Carry out operational efficiency and service improvements;',
      'Develop or enhance products/services; or',
      'customer management.',
    ] },
    { text: 'Research – market research aimed at understanding potential customer segments.' },
  ] },

  { type: 'h2', text: '4. Purposes for the Collection, Use and Disclosure of Your Personal Data' },
  { type: 'h3', text: '4.1 Generally' },
  { type: 'p', text: 'The American Club collects, uses and discloses your Personal Data for the following purposes:' },
  { type: 'ul', items: [
    'verifying your identity, and responding to your queries, feedback, complaints and requests;',
    'processing membership applications, and administering memberships (including privileges, benefits and payments);',
    'managing the administrative and business operations of The American Club and complying with internal policies and procedures including administering the Club’s Constitution and By-Laws;',
    'marketing and advertising products and services to you, as well as requesting feedback or participation in surveys, as well as conducting market research and/or analysis for statistical, profiling or other purposes for us to design and improve our products and services, understand customer behavior, preferences and market trends, and to review, develop and improve the quality of our products and services;',
    'preventing, detecting and investigating crime and analysing and managing commercial risks;',
    'managing the safety and security of our premises and services (including but not limited to carrying out CCTV surveillance and conducting security clearances);',
    'monitoring or recording phone calls and customer-facing interactions for quality assurance and identity verification purposes;',
    'in connection with any claims, actions or proceedings (including but not limited to drafting and reviewing documents, transaction documentation, obtaining legal advice, and facilitating dispute resolution), and/or protecting and enforcing our contractual and legal rights and obligations;',
    'conducting investigations relating to disputes, billing, insurance claims, or fraud;',
    'meeting or complying with any applicable rules, laws, regulations, codes of practice or guidelines issued by any legal or regulatory bodies which are binding on The American Club (including but not limited to responding to regulatory complaints, disclosing to regulatory bodies and conducting audit checks, due diligence and investigations); and/or',
    'purposes which are reasonably related to the aforesaid.',
  ] },
  { type: 'h3', text: '4.2' },
  { type: 'p', text: 'In addition, The American Club collects, uses and discloses your Personal Data for the following purposes depending on the nature of our relationship:' },
  { type: 'h4', text: 'a) If you are an officer or owner of an external service provider or vendor outsourced or prospected by The American Club:' },
  { type: 'ul', items: [
    'assessing your suitability as an external service provider or vendor for The American Club;',
    'managing project tenders and quotations, processing orders or managing the supply of goods and services;',
    'processing and payment of vendor invoices and bills;',
    'managing business operations and product development;',
    'facilities management (including but not limited to maintaining the security of our premises); and/or',
    'purposes which are reasonably related to the aforesaid.',
  ] },
  { type: 'h4', text: 'b) If you submit an application to us as a candidate for employment:' },
  { type: 'ul', items: [
    'conducting interviews;',
    'processing your application (including but not limited to pre-recruitment checks involving your qualifications and facilitating interviews);',
    'obtaining employee references and for background screening;',
    'assessing your suitability for the position applied for;',
    'facilities management (including but not limited to maintaining the security of our premises and recording entries and exits); and/or',
    'purposes which are reasonably related to the aforesaid.',
  ] },
  { type: 'h4', text: 'c) If you sit on the General Committee of The American Club or any standing or subcommittee:' },
  { type: 'ul', items: [
    'facilitating your appointment and service as a committee member;',
    'arranging and scheduling meetings or communication;',
    'maintaining statutory registers and to manage the publication of directors’ statistics on annual reports and circulars;',
    'facilitating the execution of duties and administrative matters; and/or',
    'purposes which are reasonably related to the aforesaid.',
  ] },
  { type: 'h3', text: '4.3' },
  { type: 'p', text: 'If you have provided your Singapore telephone number(s) and have indicated that you consent to receiving marketing or promotional information via your Singapore telephone number(s), then from time to time, The American Club may contact you using such Singapore telephone number(s) (including via voice calls, text, fax or other means) with information about our products and services.' },
  { type: 'h3', text: '4.4' },
  { type: 'p', text: 'The consent that you provide for the collection, use and disclosure of your personal data will remain valid until such time it is being withdrawn by you in writing. You may withdraw consent and request us to stop using and/or disclosing your personal data for any or all of the purposes listed above by submitting your request in writing to our Data Protection Officer at dpo@amclub.org.sg. Please be aware that once we receive confirmation that you wish to withdraw your consent, it may take up to 10 working days for your withdrawal to be reflected in our systems. Therefore, you may still receive communication during this period of time. Please note that even if you withdraw your consent for the receipt of marketing or promotional materials, we may still contact you for other purposes in relation to the products and services that you have requested from The American Club.' },
  { type: 'h3', text: '4.5' },
  { type: 'p', text: 'Whilst we respect your decision to withdraw your consent, please note that depending on the nature and scope of your request, we may not be in a position to continue providing our goods or services to you and we shall, in such circumstances, notify you before completing the processing of your request. Should you decide to cancel your withdrawal of consent, please inform us in writing in the manner described in clause 4.4 above.' },
  { type: 'h3', text: '4.6' },
  { type: 'p', text: 'Please note that withdrawing consent does not affect our right to continue to collect, use and disclose personal data where such collection, use and disclose without consent is permitted or required under applicable laws.' },

  { type: 'h2', text: '5. Access to and Correction of Personal Data' },
  { type: 'h3', text: '5.1' },
  { type: 'p', text: 'If you wish to make (a) an access request for access to a copy of the personal data which we hold about you or information about the ways in which we use or disclose your personal data, or (b) a correction request to correct or update any of your personal data which we hold, you may submit your request in writing to our Data Protection Officer at dpo@amclub.org.sg.' },
  { type: 'h3', text: '5.2' },
  { type: 'p', text: 'Please note that a reasonable fee may be charged for an access request. If so, we will inform you of the fee before processing your request.' },
  { type: 'h3', text: '5.3' },
  { type: 'p', text: 'We will respond to your access request as soon as reasonably possible. Should we not be able to respond to your access request within thirty (30) days after receiving your access request, we will inform you in writing within thirty (30) days of the time by which we will be able to respond to your request. If we are unable to provide you with any personal data or to make a correction requested by you, we shall generally inform you of the reasons why we are unable to do so (except where we are not required to do so under the PDPA).' },
  { type: 'h3', text: '5.4' },
  { type: 'p', text: 'Please note that depending on the request that is being made, we will only need to provide you with access to the personal data contained in the documents requested, and not to the entire documents themselves. In those cases, it may be appropriate for us to simply provide you with confirmation of the personal data that our organization has on record, if the record of your personal data forms a negligible part of the document.' },

  { type: 'h2', text: '6. Accuracy of Personal Data' },
  { type: 'p', text: 'We generally rely on personal data provided by you (or your authorized representative). In order to ensure that your personal data is current, complete and accurate, please update us if there are changes to your personal data by informing our Data Protection Officer in writing at the contact details provided below.' },

  { type: 'h2', text: '7. Retention of Personal Data' },
  { type: 'h3', text: '7.1' },
  { type: 'p', text: 'We may retain your personal data for as long as it is necessary to fulfil the purpose for which it was collected, or as required or permitted by applicable laws.' },
  { type: 'h3', text: '7.2' },
  { type: 'p', text: 'We will cease to retain your personal data, or remove the means by which the data can be associated with you, as soon as it is reasonable to assume that such retention no longer serve the purpose for which the personal data was collected, and is no longer necessary for legal or business purposes.' },

  { type: 'h2', text: '8. Protection of Personal Data' },
  { type: 'h3', text: '8.1' },
  { type: 'p', text: 'To safeguard your personal data from unauthorized access, collection, use, disclosure, copying, modification, disposal or similar risks, we have introduced appropriate administrative, physical and technical measures such as up-to-date antivirus protection, encryption and the use of privacy filters to secure all storage and transmission of personal data by us, and disclosing personal data both internally and to our authorized third party service providers and agents only on a need-to-know basis.' },
  { type: 'h3', text: '8.2' },
  { type: 'p', text: 'You should be aware, however, that no method of transmission over the Internet or method of electronic storage is completely secure. While security cannot be guaranteed, we strive to protect the security of your information and are constantly reviewing and enhancing our information security measures.' },

  { type: 'h2', text: '9. Disclosure of Personal Data' },
  { type: 'p', text: 'The American Club will take reasonable steps to protect your Personal Data against unauthorized disclosure. Subject to the provisions of any applicable law, your Personal Data may be disclosed, for the purposes listed above (where applicable), to the following entities or parties, whether they are located overseas or in Singapore:' },
  { type: 'ul', items: [
    'companies providing services related to insurance to The American Club as well as agents, contractors or third party service providers who provide operational services to The American Club, such as courier services, telecommunications, information technology, payment, printing, billing, technical services, training, market research, call center, security or other services to The American Club;',
    'vendors or third party service providers in connection with services offered by The American Club;',
    'our merchant partners including banks, credit card companies, secretarial agents, billing organizations and their respective service providers;',
    'any business partner, investor, assignee or transferee (actual or prospective) to facilitate business asset transactions;',
    'our professional advisers and partners such as consultants, auditors and lawyers, as well as our insurers;',
    'relevant government ministries, regulators, statutory boards or authorities or law enforcement agencies to comply with any laws, rules, guidelines and regulations or schemes imposed by any governmental authority; and/or',
    'reciprocal and affiliated clubs of The American Club, in circumstances relating to your use of these clubs, or to confirm your membership of the Club;',
    'any other party to whom you authorize us to disclose your Personal Data to.',
  ] },
  { type: 'p', text: 'The purposes listed in the above clauses may continue to apply even in situations where your relationship with us (for example, pursuant to a contract) has been terminated or altered in any way, for a reasonable period thereafter (including, where applicable, a period to enable us to enforce our rights under any contract with you).' },

  { type: 'h2', text: '10. Transfers of Personal Data Outside Singapore' },
  { type: 'p', text: 'We generally do not transfer your personal data to countries outside of Singapore. However, if we do so, including for example due to the use of cloud-based storage, systems or services, we will take steps to ensure that your personal data continues to receive a standard of protection that is at least comparable to that provided under the PDPA.' },

  { type: 'h2', text: '11. Use of Cookies' },
  { type: 'h3', text: '11.1' },
  { type: 'p', text: 'When you interact with us on our websites, we automatically receive and record information on our server logs from your browser. We may employ cookies in order for our server to recognize a return visitor as a unique user including, without limitation, monitoring information relating to how a visitor arrives at the website, what kind of browser a visitor is on, what operating system a visitor is using, a visitor’s IP address, and a visitor’s click stream information and time stamp (for example, which pages they have viewed, the time the pages were accessed and the time spent per web page).' },
  { type: 'h3', text: '11.2' },
  { type: 'p', text: 'Cookies are small text files stored in your computing or other electronic devices which allow us to remember you. The cookies placed by our server are readable only by us, and cookies cannot access, read or modify any other data on an electronic device. All web-browsers offer the option to refuse any cookie, and if you refuse our cookie then we do not gather any information on you.' },
  { type: 'h3', text: '11.3' },
  { type: 'p', text: 'Should you wish to disable the cookies associated with these technologies, you may do so by changing the setting on your browser. However, you may not be able to enter certain part(s) of our website.' },

  { type: 'h2', text: '12. Contacting Us – Feedback, Withdrawal of Consent, Access and Correction of Your Personal Data' },
  { type: 'h3', text: '12.1' },
  { type: 'p', text: 'If you:' },
  { type: 'ul', items: [
    'have any questions or feedback relating to your Personal Data or our Data Protection Policy;',
    'would like to withdraw your consent to any use of your Personal Data as set out in this Data Protection Policy; or',
    'would like to obtain access and make corrections to your Personal Data records, you can approach our DPO via the following channels: Email: dpo@amclub.org.sg.',
  ] },
  { type: 'p', text: 'You may write to our Data Protection Officer at:' },
  { type: 'p', text: 'Data Protection Officer\n10 Claymore Hill, Singapore 229573' },
  { type: 'h3', text: '12.2' },
  { type: 'p', text: 'Please note that if your Personal Data has been provided to us by a third party (e.g. a referrer, or your company), you should contact such party directly to make any queries, feedback, complaints, and access and correction requests to The American Club on your behalf.' },
  { type: 'h3', text: '12.3' },
  { type: 'p', text: 'If you withdraw your consent to any or all use of your Personal Data, depending on the nature of your request, The American Club may not be in a position to continue to provide its products and services to you, administer any contractual relationship in place, which in turn may also result in the termination of any agreements with The American Club, and your being in breach of your contractual obligations or undertakings. The American Club’s legal rights and remedies in such event are expressly reserved.' },

  { type: 'h2', text: '13. Effect of Notice and Changes to Notice' },
  { type: 'h3', text: '13.1' },
  { type: 'p', text: 'This Notice applies in conjunction with any other notices, contractual clauses and consent clauses that apply in relation to the collection, use and disclosure of your personal data by us.' },
  { type: 'h3', text: '13.2' },
  { type: 'p', text: 'We may revise this Notice from time to time without any prior notice. You may determine if any such revision has taken place by referring to the date on which this Notice was last updated. Your continued use of our services constitutes your acknowledgement and acceptance of such changes.' },

  { type: 'h2', text: '14. Governing Law' },
  { type: 'p', text: 'This Data Protection Policy and your use of this website shall be governed in all respects by the laws of Singapore.' },
];

const LAST_REVISION = 'Monday, September 1, 2025';

function Heading2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-heading italic text-primary mt-14 mb-5"
      style={{
        fontSize: 'clamp(1.5rem, 1.6vw + 1rem, 1.875rem)',
        fontWeight: 300,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
      }}
    >
      {children}
    </h2>
  );
}

function Heading3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-body font-bold text-primary mt-6 mb-2"
      style={{ fontSize: '14.4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
    >
      {children}
    </h3>
  );
}

function Heading4({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="font-body font-bold text-primary mt-5 mb-2"
      style={{ fontSize: '15.2px', lineHeight: '1.4' }}
    >
      {children}
    </h4>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-body text-primary whitespace-pre-line mb-4"
      style={{ fontSize: '17.6px', fontWeight: 300, lineHeight: '28px' }}
    >
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2 mb-5 marker:text-accent">
      {items.map((it) => (
        <li
          key={it.slice(0, 30)}
          className="font-body text-primary"
          style={{ fontSize: '17.6px', fontWeight: 300, lineHeight: '28px' }}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

function NestedBulletList({ items }: { items: { text: string; sub?: string[] }[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2 mb-5 marker:text-accent">
      {items.map((it) => (
        <li
          key={it.text.slice(0, 30)}
          className="font-body text-primary"
          style={{ fontSize: '17.6px', fontWeight: 300, lineHeight: '28px' }}
        >
          {it.text}
          {it.sub && it.sub.length > 0 && (
            <ul className="list-[circle] pl-6 mt-2 space-y-2 marker:text-accent">
              {it.sub.map((s) => (
                <li key={s.slice(0, 30)}>{s}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyStatementPage() {
  return (
    <PageFade loaded={true}>
      <section className="bg-bg pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-10 border-b border-primary/15 pb-8">
            <p
              className="font-body font-bold uppercase text-accent mb-4"
              style={{ fontSize: '13px', letterSpacing: '0.08em' }}
            >
              Data Protection Policy
            </p>
            <h1
              className="font-heading italic text-primary"
              style={{
                fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              Privacy Statement
            </h1>
            <p
              className="font-body text-primary/70 mt-3"
              style={{ fontSize: '14px', fontWeight: 300 }}
            >
              Last revision: {LAST_REVISION}
            </p>
          </header>

          <Heading2>Overview</Heading2>
          {SECTIONS.map((block, i) => {
            if (block.type === 'h2') return <Heading2 key={i}>{block.text}</Heading2>;
            if (block.type === 'h3') return <Heading3 key={i}>{block.text}</Heading3>;
            if (block.type === 'h4') return <Heading4 key={i}>{block.text}</Heading4>;
            if (block.type === 'p') return <Paragraph key={i}>{block.text}</Paragraph>;
            if (block.type === 'ul') return <BulletList key={i} items={block.items} />;
            if (block.type === 'ul-nested') return <NestedBulletList key={i} items={block.items} />;
            return null;
          })}
        </div>
      </section>
    </PageFade>
  );
}
