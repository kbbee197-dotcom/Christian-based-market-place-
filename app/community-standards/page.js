const sections = [
  { title: "Our Foundation", paras: [
    "AB(SOUL)UTE is a Christian marketplace created to connect people with purpose-driven businesses, creators, products, and eventually services and experiences.",
    "Our Christian identity is not simply a category within the marketplace—it is the foundation upon which the AB(SOUL)UTE community is built.",
    "We believe commerce can be more than a transaction. Behind every business is a person. Behind every creation is a story. And behind meaningful work is purpose.",
    "Our goal is to create a marketplace where faith, integrity, creativity, entrepreneurship, and community can thrive together.",
    "Anyone is welcome to visit, discover, follow, and shop on AB(SOUL)UTE. Sellers and creators who participate in the marketplace are expected to respect its Christian foundation and abide by these Community Standards.",
    "AB(SOUL)UTE does not attempt to determine or certify an individual’s personal relationship with God. Participation as a seller or creator means agreeing to conduct yourself and your business in a manner consistent with the standards of this marketplace.",
  ]},
  { title: "Our Community Values", paras: [
    "AB(SOUL)UTE is guided by six core principles:",
    "Faith · Integrity · Purpose · Respect · Stewardship · Community",
    "We expect members of our marketplace to conduct themselves honestly, treat others with dignity, accurately represent their businesses and products, fulfill their commitments to customers, communicate respectfully, and contribute to a community built on trust.",
  ]},
  { title: "Seller & Creator Conduct", paras: [
    "Sellers and creators must provide accurate information about themselves, their businesses, products, prices, availability, shipping practices, and policies.",
    "Members may not intentionally misrepresent products, manipulate reviews, impersonate another person or business, engage in fraudulent transactions, or make knowingly deceptive claims.",
    "Orders and customer concerns should be handled professionally and in accordance with the seller’s stated policies and AB(SOUL)UTE marketplace requirements.",
  ]},
  { title: "Respectful Community", paras: [
    "AB(SOUL)UTE welcomes people from different backgrounds and experiences while maintaining its Christian identity.",
    "Harassment, bullying, threats, intimidation, targeted abuse, or degrading treatment of others is not permitted.",
    "Disagreement does not excuse disrespectful conduct.",
    "Content or behavior intended primarily to attack, provoke, demean, or harass individuals or groups is inconsistent with the community we are building.",
  ]},
  { title: "Products and Content", paras: [
    "Products, listings, videos, messages, profiles, and other content offered or shared through AB(SOUL)UTE must be appropriate for a Christian marketplace.",
    "The following are not permitted:",
  ], list: [
    "Pornographic, sexually explicit, or obscene products or content",
    "Products or content promoting occult practices, witchcraft, divination, or similar spiritual practices inconsistent with the Christian foundation of the marketplace",
    "Illegal goods or services",
    "Counterfeit or stolen goods",
    "Fraudulent or intentionally deceptive products, services, or claims",
    "Products or content that promote violence, exploitation, abuse, or criminal activity",
    "Content that harasses, threatens, or targets others with hateful or degrading treatment",
    "Deceptive fundraising or financial schemes",
    "Products that infringe copyrights, trademarks, or other intellectual-property rights",
    "Spam, scams, phishing, or attempts to manipulate users or the marketplace",
    "Other products, services, or content that AB(SOUL)UTE reasonably determines are inconsistent with the safety, integrity, purpose, or Christian character of the marketplace",
  ], after: [
    "AB(SOUL)UTE reserves the right to review marketplace content and determine whether it is appropriate for the platform.",
  ]},
  { title: "Faith-Related Content", paras: [
    "Christian creators, ministries, businesses, authors, artists, and organizations are encouraged to share their faith authentically.",
    "AB(SOUL)UTE is not intended to become a platform for theological hostility or religious arguments.",
    "Members may discuss and express Christian beliefs without using the marketplace to harass, threaten, or deliberately demean others.",
    "Individuals of other faiths or no faith are welcome to shop and engage respectfully with the marketplace. Participation does not require customers to adopt AB(SOUL)UTE’s Christian beliefs.",
  ]},
  { title: "Reviews & Marketplace Integrity", paras: [
    "Reviews should reflect genuine experiences.",
    "Users may not purchase, sell, manufacture, manipulate, exchange, or otherwise artificially influence reviews or ratings.",
    "Sellers may respond respectfully to criticism but may not threaten, harass, or retaliate against customers for leaving an honest review.",
  ]},
  { title: "Messaging & Communication", paras: [
    "Marketplace messaging should primarily support legitimate interaction between buyers, sellers, creators, and businesses.",
    "Spam, unwanted solicitation, harassment, sexually explicit communications, fraudulent requests, and attempts to obtain sensitive information improperly are prohibited.",
    "Users should never be asked to provide passwords, security codes, or other account credentials through marketplace messaging.",
  ]},
  { title: "Safety & Reporting", paras: [
    "Members can report content, listings, sellers, buyers, or other activity they believe violates these standards.",
    "Where available, users may also block accounts they do not wish to interact with.",
    "AB(SOUL)UTE may review reported activity and take appropriate action.",
  ]},
  { title: "Enforcement", paras: [
    "Depending on the nature and severity of a violation, AB(SOUL)UTE may take actions including:",
    "Warning → Content or listing removal → Selling restrictions → Temporary suspension → Permanent account removal",
    "Serious violations may result in immediate suspension or removal without a prior warning.",
    "AB(SOUL)UTE may also take reasonable action when necessary to protect customers, sellers, the marketplace, or the integrity of the platform.",
  ]},
  { title: "Our Commitment", paras: [
    "AB(SOUL)UTE exists because we believe purpose belongs in the marketplace.",
    "We want entrepreneurs to build. Creators to create. Businesses to grow. Customers to discover.",
    "And a community to intentionally support the people and purposes behind what they purchase.",
    "When you participate in AB(SOUL)UTE, you’re helping us build a marketplace where faith and business don’t have to exist in separate worlds.",
  ]},
];

export const metadata = { title: "AB(SOUL)UTE Community Standards" };

export default function CommunityStandardsPage() {
  return (
    <main className="min-h-dvh bg-ink text-parchment px-6 pt-8 pb-16 max-w-2xl mx-auto">
      <a href="/" className="font-body text-sm text-wick underline">← Back</a>
      <h1 className="font-display text-2xl font-semibold mt-6 mb-1">AB(SOUL)UTE Community Standards</h1>
      <p className="font-body text-sm text-slate mb-8">Where Purpose Meets Marketplace</p>

      {sections.map((s) => (
        <section key={s.title} className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-3">{s.title}</h2>
          {s.paras.map((t) => (
            <p key={t} className="font-body text-sm text-parchment/80 mb-3">{t}</p>
          ))}
          {s.list && (
            <ul className="list-disc pl-5 mb-3 space-y-1">
              {s.list.map((t) => (
                <li key={t} className="font-body text-sm text-parchment/80">{t}</li>
              ))}
            </ul>
          )}
          {s.after && s.after.map((t) => (
            <p key={t} className="font-body text-sm text-parchment/80 mb-3">{t}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
