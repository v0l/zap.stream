## How do i stream on zap.stream?

To start streaming on zap.stream, follow these steps:

1. Click on Log In
2. Create a new account if you don't have one already.
   If you already have an account, you can use a nostr extension to log in. If you already use a nostr extension, you will be automatically logged in. If you don't have a nostr extension set up, you can use nos2x or Alby.
3. Click the “Stream” button in the top right corner
4. Here you have a few options, using our in-house hosting, or your own (such as Cloudflare).
   1. For manual hosting all you need is the HLS URL for the Stream URL field. You should be able to find this in your hosting setup.
   2. If you use our in-house zap.stream hosting (cheapest and easiest), copy your stream URL and Stream Key to your OBS settings and you should be good to go.

## What is OBS?

OBS (Open Broadcaster Software) is a free and open source software for video recording and live streaming on Windows, Mac and Linux. It is a popular choice with streamers. You'll need to install this to capture your video, audio and anything else you'd like to add to your stream. Once installed and configured to preference, add your Stream URL and Stream Key from the Stream settings to OBS to form a connection with zap.stream.

## What does it cost to stream?

Each streaming provider has their own pricing modesl, please see [the providers page](https://zap.stream/providers) for more info

## What are sats?

Sats are small units of Bitcoin. Sending sats on zap.stream is referred to as “zapping” or zaps.

## How do i get more sats?

We've put together a list of easy-to-use exchanges that will allow you to buy a small amount of bitcoin (sats) and to transfer them to your wallet of choice.

## What are zaps?

Zaps are lightning payments, which are published on nostr as receipts.

## What is a nostr extension?

A nostr extension simply saves your keys so you can safely log in without having to re-enter them every time. ZapStream uses the extension to authorize actions on your behalf without ever seeing your key information. This has a significant advantage over having to trust that websites handle your credentials safely.

## Recommended Stream Settings

| Name              | Value |
| ----------------- | ----- |
| Video Codec       | h264  |
| Audio Codec       | AAC   |
| Max Video Bitrate | 7000k |
| Max Audio Bitrate | 320k  |
| Keyframe Interval | 2s    |
