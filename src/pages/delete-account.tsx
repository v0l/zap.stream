export function DeleteAccountPage() {
  return (
    <div className="flex flex-col gap-6 grow w-full max-w-[72ch] mx-auto px-4 py-6">
      <h1>Delete your account</h1>
      <h2>zap.stream mobile apps and website</h2>
      <p>
        zap.stream uses Nostr, so your account is a key pair that you hold, not a row in our database. Deleting your
        account means erasing your profile, asking relays to delete your events, and removing your key from your
        device.
      </p>
      <h2>In the app</h2>
      <ol className="list-decimal pl-6 flex flex-col gap-2">
        <li>Open the zap.stream app and log in with a private key.</li>
        <li>Open Settings, then Delete account.</li>
        <li>Read the notice and confirm.</li>
      </ol>
      <p>The app then:</p>
      <ul className="list-disc pl-6 flex flex-col gap-2">
        <li>blanks your profile (name set to "deleted", no picture, about text or lightning address),</li>
        <li>publishes a deletion request (Nostr kind 5) for your profile, follow list, block list, streams and recent chat messages,</li>
        <li>removes your key from the device.</li>
      </ul>
      <p>
        Nostr has no central server. Relays may keep copies of your events even after a deletion request, and other
        apps may still show them. Your account cannot be restored unless you saved your key.
      </p>
      <h2>By email</h2>
      <p>
        If you cannot use the app, or you stream through the zap.stream service and want your stream account details
        removed (stream key, balance and payment records), write to <a className="text-primary underline" href="mailto:info@zap.stream">info@zap.stream</a>{" "}
        from a message that names your npub. We will confirm when it is done.
      </p>
      <h2>What we keep</h2>
      <p>
        Viewers have no server side account with us. For streamers, the streaming API deletes the stream account
        details on request. Payment records that we must keep by law are kept for as long as the law requires. See the{" "}
        <a className="text-primary underline" href="/privacy">privacy policy</a>.
      </p>
    </div>
  )
}
