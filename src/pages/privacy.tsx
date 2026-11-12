export function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6 grow w-full max-w-[72ch] mx-auto px-4 py-6">
      <h1>Privacy Policy</h1>
      <h2>Applies to the zap.stream website and the zap.stream mobile apps</h2>
      <p>
        <strong>Effective Date:</strong> 2026-11-12
      </p>
      <p>
        zap.stream shows live streams and chat that people publish on Nostr, an open protocol. This page explains what
        the website and the apps keep, and what they do not.
      </p>
      <ul className="list-disc pl-6 flex flex-col gap-3">
        <li>
          <b>Your keys:</b> Your Nostr private key (nsec) stays on your device. The apps never send it to us. If you
          log in with a signer app such as Amber or a remote signer, the key stays in that signer.
        </li>
        <li>
          <b>What you publish:</b> Your profile, chat messages, reactions, zaps, follows, mute lists, reports and
          stream details are Nostr events. They are sent to the Nostr relays you use and are public by design. Relays
          and other apps can keep copies. We do not control third party relays.
        </li>
        <li>
          <b>What we store:</b> We do not keep an account database of the people who only watch. The zap.stream
          streaming API stores the details needed to run a stream for people who go live: the public key, stream key,
          title, summary, tags, balance and payment records.
        </li>
        <li>
          <b>Payments:</b> Zaps are tips sent over the Lightning network from your own wallet. We do not see your
          wallet or your wallet credentials. A Nostr Wallet Connect string you paste in is stored on your device only.
        </li>
        <li>
          <b>No tracking:</b> The apps have no advertising and no analytics. We do not sell data and we do not share
          data with third parties for their own use.
        </li>
        <li>
          <b>Device data:</b> The apps store settings on your device: your language, the accounts you added, your
          follow and mute lists cache, and go live alert choices. Go live alerts are checked on your device against
          your relays.
        </li>
        <li>
          <b>Network traffic:</b> Servers you connect to (relays, our API, image and video hosts) see your IP address
          like any web server does. Connections use https or wss.
        </li>
        <li>
          <b>Reports and moderation:</b> A report is published to relays as a Nostr event and reviewed by the zap.stream
          team. You can block users and hide streams marked with a content warning in the app.
        </li>
        <li>
          <b>Children:</b> zap.stream is not directed at children under 13.
        </li>
        <li>
          <b>Deleting your data:</b> See <a className="text-primary underline" href="/delete-account">how to delete your account</a>.
        </li>
        <li>
          <b>Changes:</b> We may update this policy and will change the effective date when we do.
        </li>
      </ul>
      <p>
        Questions about privacy: <a className="text-primary underline" href="mailto:info@zap.stream">info@zap.stream</a>
      </p>
    </div>
  )
}
