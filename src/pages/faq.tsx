import { FormattedMessage } from "react-intl";

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-4 w-[35rem] mx-auto">
      <h1>
        <FormattedMessage defaultMessage="FAQ" description="Title: FAQ page" />
      </h1>
      <h2>
        <FormattedMessage defaultMessage="How do i stream on zap.stream?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="To start streaming on zap.stream, follow these steps:" />
      </p>
      <ol className="leading-6 list-inside list-decimal">
        <li>
          <FormattedMessage defaultMessage="Click on Log In" />
        </li>
        <li>
          <FormattedMessage defaultMessage="Create a new account if you don't have one already." />
        </li>
        <li>
          <FormattedMessage defaultMessage="If you already have an account, you can use a nostr extension to log in. If you already use a nostr extension, you will be automatically logged in. If you don't have a nostr extension set up, you can use nos2x or Alby." />
        </li>
        <li>
          <FormattedMessage defaultMessage="Click the “Stream” button in the top right corner" />
        </li>
        <li>
          <FormattedMessage defaultMessage="Here you have a few options, using our in-house hosting, or your own (such as Cloudflare)." />
        </li>
        <ol className="leading-6 list-inside list-decimal ml-6">
          <li>
            <FormattedMessage defaultMessage="For manual hosting all you need is the HLS URL for the Stream URL field. You should be able to find this in your hosting setup." />
          </li>
          <li>
            <FormattedMessage defaultMessage="If you use our in-house zap.stream hosting (cheapest and easiest), copy your stream URL and Stream Key to your OBS settings and you should be good to go." />
          </li>
        </ol>
      </ol>
      <h2>
        <FormattedMessage defaultMessage="What is OBS?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="OBS (Open Broadcaster Software)  is a free and open source software for video recording and live streaming on Windows, Mac and Linux. It is a popular choice with streamers. You'll need to install this to capture your video, audio and anything else you'd like to add to your stream. Once installed and configured to preference, add your Stream URL and Stream Key from the Stream settings to OBS to form a connection with zap.stream." />
      </p>
      <h2>
        <FormattedMessage defaultMessage="What does it cost to stream?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="zap.stream is free up to 2 hours of hosting at high quality and up to 8 hours of “source” quality. After that you have an option to stream for 5 sats per minute or 10 sats per minute depending on your chosen quality. If you do not use zap.stream to host, pricing will depend on your chosen streaming provider." />
      </p>
      <h2>
        <FormattedMessage defaultMessage="What are sats?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="Sats are small units of Bitcoin. Sending sats on zap.stream is referred to as “zapping” or zaps." />
      </p>
      <h2>
        <FormattedMessage defaultMessage="How do i get more sats?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="We've put together a list of easy-to-use exchanges that will allow you to buy a small amount of bitcoin (sats) and to transfer them to your wallet of choice." />
      </p>
      <h2>
        <FormattedMessage defaultMessage="What are zaps?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="Zaps are lightning payments, which are published on nostr as receipts." />
      </p>
      <h2>
        <FormattedMessage defaultMessage="What is a nostr extension?" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="A nostr extension simply saves your keys so you can safely log in without having to re-enter them every time. ZapStream uses the extension to authorize actions on your behalf without ever seeing your key information. This has a significant advantage over having to trust that websites handle your credentials safely." />
      </p>
      <h2>
        <FormattedMessage defaultMessage="Recommended Stream Settings" />
      </h2>
      <table className="table-auto">
        <thead>
          <tr>
            <th>
              <FormattedMessage defaultMessage="Name" description="Config name column header" />
            </th>
            <th>
              <FormattedMessage defaultMessage="Value" description="Config value column header" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <FormattedMessage defaultMessage="Video Codec" />
            </td>
            <td>h264</td>
          </tr>
          <tr>
            <td>
              <FormattedMessage defaultMessage="Audio Codec" />
            </td>
            <td>AAC</td>
          </tr>
          <tr>
            <td>
              <FormattedMessage defaultMessage="Max Video Bitrate" />
            </td>
            <td>7000k</td>
          </tr>
          <tr>
            <td>
              <FormattedMessage defaultMessage="Max Audio Bitrate" />
            </td>
            <td>320k</td>
          </tr>
          <tr>
            <td>
              <FormattedMessage defaultMessage="Keyframe Interval" />
            </td>
            <td>2s</td>
          </tr>
        </tbody>
      </table>
      <h3>
        <FormattedMessage defaultMessage="Example settings in OBS (Apple M1 Mac)" />
      </h3>
      <img src="https://void.cat/d/VQQ75R6tmbVQJ9eqiwJhoj.webp" alt="OBS Mac settings" />
    </div>
  );
}
