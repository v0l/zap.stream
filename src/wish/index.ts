import adapter from "webrtc-adapter";
import { CandidateInfo, SDPInfo } from "semantic-sdp";
import { TypedEventTarget, type StatusEvent, type LogEvent } from "./events";
import { parserLinkHeader } from "./parser";

export const DEFAULT_ICE_SERVERS = [
  "stun:stun.cloudflare.com:3478",
  "stun:stun.l.google.com:19302",
];

export const TRICKLE_BATCH_INTERVAL = 50;

enum Mode {
  Player = "player",
  Publisher = "publisher",
}

export class WISH extends TypedEventTarget {
  private peerConnection?: RTCPeerConnection;
  private iceServers: string[] = DEFAULT_ICE_SERVERS;

  private videoSender?: RTCRtpSender;

  private remoteTracks: MediaStreamTrack[] = [];
  private playerMedia?: MediaStream;

  private connecting: boolean = false;
  private connectedPromise!: Promise<void>;
  private connectedResolver!: (any: void) => void;
  private connectedRejector!: (reason?: any) => void;
  private gatherPromise!: Promise<void>;
  private gatherResolver!: (any: void) => void;

  private endpoint?: string;
  private resourceURL?: string;
  private mode: Mode = Mode.Player;
  private parsedOffer?: SDPInfo;
  private useTrickle: boolean = false;
  private etag?: string;

  private trickleBatchingJob?: ReturnType<typeof setInterval>;
  private batchedCandidates: RTCIceCandidate[] = [];

  private connectStartTime?: number;
  private iceStartTime?: number;

  constructor(iceServers?: string[]) {
    super();
    if (iceServers) {
      this.iceServers = iceServers ? iceServers : DEFAULT_ICE_SERVERS;
    }
    this.logMessage(
      `Enabling webrtc-adapter for ${adapter.browserDetails.browser}@${adapter.browserDetails.version}`
    );
    this.newResolvers();
  }

  private logMessage(str: string) {
    const now = new Date().toLocaleString();
    console.log(`${now}: ${str}`);
    this.dispatchEvent(
      new CustomEvent<LogEvent>("log", {
        detail: {
          message: str,
        },
      })
    );
  }

  private killConnection() {
    if (this.peerConnection) {
      this.logMessage("Closing RTCPeerConnection");
      this.peerConnection.close();
      this.peerConnection = undefined;
      this.parsedOffer = undefined;
      this.playerMedia = undefined;
      this.videoSender = undefined;
      this.connecting = false;
      this.remoteTracks = [];
      this.batchedCandidates = [];
      this.stopTrickleBatching();
    }
  }

  private createConnection() {
    this.logMessage("Creating a new RTCPeerConnection");
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: this.iceServers }],
    });
    if (!this.peerConnection) {
      throw new Error("Failed to create a new RTCPeerConnection");
    }
    this.addEventListeners();
    this.newResolvers();
  }

  private newResolvers() {
    this.connectedPromise = new Promise((resolve, reject) => {
      this.connectedResolver = resolve;
      this.connectedRejector = reject;
    });
    this.gatherPromise = new Promise((resolve) => {
      this.gatherResolver = resolve;
    });
  }

  private addEventListeners() {
    if (!this.peerConnection) {
      return;
    }
    this.peerConnection.addEventListener(
      "connectionstatechange",
      this.onConnectionStateChange.bind(this)
    );
    this.peerConnection.addEventListener(
      "iceconnectionstatechange",
      this.onICEConnectionStateChange.bind(this)
    );
    this.peerConnection.addEventListener(
      "icegatheringstatechange",
      this.onGatheringStateChange.bind(this)
    );
    this.peerConnection.addEventListener(
      "icecandidate",
      this.onICECandidate.bind(this)
    );
    this.peerConnection.addEventListener("track", this.onTrack.bind(this));
    this.peerConnection.addEventListener(
      "signalingstatechange",
      this.onSignalingStateChange.bind(this)
    );
  }

  private onGatheringStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `ICE Gathering State changed: ${this.peerConnection.iceGatheringState}`
    );
    switch (this.peerConnection.iceGatheringState) {
      case "complete":
        this.gatherResolver();
        break;
    }
  }

  private onConnectionStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `Peer Connection State changed: ${this.peerConnection.connectionState}`
    );
    const transportHandler = (
      track: MediaStreamTrack,
      transport: RTCDtlsTransport
    ) => {
      const ice = transport.iceTransport;
      if (!ice) {
        return;
      }
      const pair = ice.getSelectedCandidatePair();
      if (!pair) {
        return;
      }
      if (pair.local && pair.remote) {
        this.logMessage(
          `[${track.kind}] Selected Candidate: (local ${pair.local.address})-(remote ${pair.remote.candidate})`
        );
      }
    };
    switch (this.peerConnection.connectionState) {
      case "connected":
        switch (this.mode) {
          case Mode.Player:
            for (const receiver of this.peerConnection.getReceivers()) {
              const transport = receiver.transport;
              if (!transport) {
                continue;
              }
              transportHandler(receiver.track, transport);
            }
            break;
          case Mode.Publisher:
            for (const sender of this.peerConnection.getSenders()) {
              const transport = sender.transport;
              if (!transport) {
                continue;
              }
              if (!sender.track) {
                continue;
              }
              if (sender.track.kind === "video") {
                this.videoSender = sender;
              }
              transportHandler(sender.track, transport);
            }
            break;
        }
        break;
      case "failed":
        this.dispatchEvent(
          new CustomEvent<StatusEvent>("status", {
            detail: {
              status: "disconnected",
            },
          })
        );
        break;
    }
  }

  private onICECandidate(ev: RTCPeerConnectionIceEvent) {
    if (ev.candidate) {
      const candidate = ev.candidate;
      if (!candidate.candidate) {
        return;
      }
      this.logMessage(
        `Got ICE candidate: ${candidate.candidate.replace("candidate:", "")}`
      );
      if (!this.parsedOffer) {
        return;
      }
      if (!this.useTrickle) {
        return;
      }
      if (candidate.candidate.includes(".local")) {
        this.logMessage("Skipping mDNS candidate for trickle ICE");
        return;
      }
      this.batchedCandidates.push(candidate);
    } else {
      this.logMessage(`End of ICE candidates`);
    }
  }

  private startTrickleBatching() {
    if (this.trickleBatchingJob) {
      clearInterval(this.trickleBatchingJob);
    }
    this.logMessage(
      `Starting batching job to trickle candidates every ${TRICKLE_BATCH_INTERVAL}ms`
    );
    this.trickleBatchingJob = setInterval(
      this.trickleBatch.bind(this),
      TRICKLE_BATCH_INTERVAL
    );
  }

  private stopTrickleBatching() {
    if (!this.trickleBatchingJob) {
      return;
    }
    this.logMessage("Stopping trickle batching job");
    clearInterval(this.trickleBatchingJob);
    this.trickleBatchingJob = undefined;
  }

  private async trickleBatch() {
    if (!this.parsedOffer) {
      return;
    }
    if (!this.batchedCandidates.length) {
      return;
    }

    const fragSDP = new SDPInfo();
    const candidates = this.batchedCandidates.splice(0);
    this.logMessage(`Tricking with ${candidates.length} candidates`);

    for (const candidate of candidates) {
      const candidateObject = CandidateInfo.expand({
        foundation: candidate.foundation || "",
        componentId: candidate.component === "rtp" ? 1 : 2,
        transport: candidate.protocol || "udp",
        priority: candidate.priority || 0,
        address: candidate.address || "",
        port: candidate.port || 0,
        type: candidate.type || "host",
        relAddr: candidate.relatedAddress || undefined,
        relPort:
          typeof candidate.relatedPort !== "undefined" &&
          candidate.relatedPort !== null
            ? candidate.relatedPort.toString()
            : undefined,
      });
      fragSDP.addCandidate(candidateObject);
    }
    fragSDP.setICE(this.parsedOffer.getICE());

    const generated = fragSDP.toIceFragmentString();
    // for trickle-ice-sdpfrag, we need a psuedo m= line
    const lines = generated.split(/\r?\n/);
    lines.splice(2, 0, "m=audio 9 RTP/AVP 0");
    lines.splice(3, 0, "a=mid:0");
    const frag = lines.join("\r\n");
    try {
      await this.doSignalingPATCH(frag, false);
    } catch (e) {
      this.logMessage(`Failed to trickle: ${(e as Error).message}`);
    }
  }

  private onSignalingStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `Signaling State changed: ${this.peerConnection.signalingState}`
    );
  }

  private onICEConnectionStateChange() {
    if (!this.peerConnection) {
      return;
    }
    this.logMessage(
      `ICE Connection State changed: ${this.peerConnection.iceConnectionState}`
    );
    switch (this.peerConnection.iceConnectionState) {
      case "checking":
        this.iceStartTime = performance.now();
        break;
      case "connected":
        const connected = performance.now();
        if (this.connectStartTime) {
          const delta = connected - this.connectStartTime;
          this.logMessage(
            `Took ${(delta / 1000).toFixed(
              2
            )} seconds to establish PeerConnection (end-to-end)`
          );
        }
        if (this.iceStartTime) {
          const delta = connected - this.iceStartTime;
          this.logMessage(
            `Took ${(delta / 1000).toFixed(
              2
            )} seconds to establish PeerConnection (ICE)`
          );
        }
        this.dispatchEvent(
          new CustomEvent<StatusEvent>("status", {
            detail: {
              status: "connected",
            },
          })
        );
        this.connecting = false;
        this.connectedResolver();
        this.stopTrickleBatching();
        break;
      case "failed":
        if (this.connecting) {
          this.connectedRejector("ICE failed while trying to connect");
          this.stopTrickleBatching();
          this.connecting = false;
        }
        break;
    }
  }

  private onTrack(ev: RTCTrackEvent) {
    if (this.mode !== Mode.Player) {
      return;
    }
    this.remoteTracks.push(ev.track);

    if (this.remoteTracks.length === 2) {
      for (const track of this.remoteTracks) {
        this.logMessage(`Got remote ${track.kind} track`);
        if (this.playerMedia) {
          this.playerMedia.addTrack(track);
        }
      }
    }
  }

  private async waitForICEGather() {
    setTimeout(() => {
      this.gatherResolver();
    }, 1000);
    await this.gatherPromise;
  }

  private async doSignaling() {
    if (!this.peerConnection) {
      return;
    }
    this.connectStartTime = performance.now();
    const localOffer = await this.peerConnection.createOffer();
    if (!localOffer.sdp) {
      throw new Error("Fail to create offer");
    }

    this.parsedOffer = SDPInfo.parse(localOffer.sdp);
    let remoteOffer: string = "";

    if (!this.useTrickle) {
      await this.peerConnection.setLocalDescription(localOffer);
      await this.waitForICEGather();
      const offer = this.peerConnection.localDescription;
      if (!offer) {
        throw new Error("no LocalDescription");
      }
      remoteOffer = await this.doSignalingPOST(offer.sdp);
    } else {
      // ensure that resourceURL is set before trickle happens
      remoteOffer = await this.doSignalingPOST(localOffer.sdp, true);
      this.startTrickleBatching();
      await this.peerConnection.setLocalDescription(localOffer);
    }
    await this.peerConnection.setRemoteDescription({
      sdp: remoteOffer,
      type: "answer",
    });
    this.connecting = true;
  }

  private setVideoCodecPreference(transceiver: RTCRtpTransceiver) {
    if (
      typeof RTCRtpSender.getCapabilities === "undefined" ||
      typeof transceiver.setCodecPreferences === "undefined"
    ) {
      return;
    }
    const capability = RTCRtpSender.getCapabilities("video");
    const codecs = capability ? capability.codecs : [];
    this.logMessage(
      `Available codecs for outbound video: ${codecs
        .map((c) => c.mimeType)
        .join(", ")}`
    );
    for (let i = 0; i < codecs.length; i++) {
      const codec = codecs[i];
      if (codec.mimeType === "video/VP9") {
        codecs.unshift(codecs.splice(i, 1)[0]);
      }
    }
    transceiver.setCodecPreferences(codecs);
  }

  private async whipOffer(src: MediaStream) {
    if (!this.peerConnection) {
      return;
    }
    for (const track of src.getTracks()) {
      this.logMessage(`Adding local ${track.kind} track`);
      const transceiver = this.peerConnection.addTransceiver(track, {
        direction: "sendonly",
      });
      if (track.kind === "video") {
        this.setVideoCodecPreference(transceiver);
      }
    }
    await this.doSignaling();
  }

  private async whepClientOffer() {
    if (!this.peerConnection) {
      return;
    }
    this.peerConnection.addTransceiver("video", {
      direction: "recvonly",
    });
    this.peerConnection.addTransceiver("audio", {
      direction: "recvonly",
    });
    await this.doSignaling();
  }

  private updateETag(resp: Response) {
    const etag = resp.headers.get("etag");
    if (etag) {
      try {
        this.etag = JSON.parse(etag);
      } catch (e) {
        this.logMessage("Failed to parse ETag header for PATCH");
      }
    }
    if (this.etag) {
      this.logMessage(`Got ${this.etag} as ETag`);
    }
  }

  private async doSignalingPOST(
    sdp: string,
    useLink?: boolean
  ): Promise<string> {
    if (!this.endpoint) {
      throw new Error("No WHIP/WHEP endpoint has been set");
    }
    const signalStartTime = performance.now();
    const resp = await fetch(this.endpoint, {
      method: "POST",
      mode: "cors",
      body: sdp,
      headers: {
        "content-type": "application/sdp",
      },
    });
    const body = await resp.text();
    if (resp.status != 201) {
      throw new Error(`Unexpected status code ${resp.status}: ${body}`);
    }

    const resource = resp.headers.get("location");
    if (resource) {
      if (resource.startsWith("http")) {
        // absolute path
        this.resourceURL = resource;
      } else {
        // relative path
        const parsed = new URL(this.endpoint);
        parsed.pathname = resource;
        this.resourceURL = parsed.toString();
      }
      this.logMessage(`Using ${this.resourceURL} as WHIP/WHEP Resource URL`);
    } else {
      this.logMessage("No Location header in response");
    }

    this.updateETag(resp);

    if (resp.headers.get("accept-post") || resp.headers.get("accept-patch")) {
      switch (this.mode) {
        case Mode.Publisher:
          this.logMessage(
            `WHIP version draft-ietf-wish-whip-05 (Accept-Post/Accept-Patch)`
          );
          break;
        case Mode.Player:
          this.logMessage(
            `WHEP version draft-murillo-whep-01 (Accept-Post/Accept-Patch)`
          );
          break;
      }
    }

    if (this.peerConnection && useLink) {
      const link = resp.headers.get("link");
      if (link) {
        const links = parserLinkHeader(link);
        if (links["ice-server"]) {
          const url = links["ice-server"].url;
          this.logMessage(`Endpoint provided ice-server ${url}`);
          this.peerConnection.setConfiguration({
            iceServers: [
              {
                urls: [url],
              },
            ],
          });
        }
      }
    }

    const signaled = performance.now();
    const delta = signaled - signalStartTime;
    this.logMessage(
      `Took ${(delta / 1000).toFixed(2)} seconds to exchange SDP`
    );

    return body;
  }

  private async doSignalingPATCH(frag: string, iceRestart: boolean) {
    if (!this.resourceURL) {
      throw new Error("No resource URL");
    }
    const headers: HeadersInit = {
      "content-type": "application/trickle-ice-sdpfrag",
    };
    if (this.etag) {
      headers["if-match"] = this.etag;
    }
    const resp = await fetch(this.resourceURL, {
      method: "PATCH",
      mode: "cors",
      body: frag,
      headers,
    });
    switch (resp.status) {
      case 200:
        if (iceRestart) {
          this.updateETag(resp);
          return;
        }
        // if we are doing an ice restart, we expect 200 OK
        break;
      case 204:
        if (!iceRestart) {
          return;
        }
        // if we are doing trickle ice, we expect 204 No Content
        break;
      case 405:
      case 501:
        this.logMessage("Trickle ICE not supported, disabling");
        this.useTrickle = false;
        break;
      case 412:
        this.logMessage("Resource returns 412, session is outdated");
        this.useTrickle = false;
        break;
    }
    const body = await resp.text();
    throw new Error(`Unexpected status code ${resp.status}: ${body}`);
  }

  async WithEndpoint(endpoint: string, trickle: boolean) {
    if (endpoint === "") {
      throw new Error("Endpoint cannot be empty");
    }
    try {
      const parsed = new URL(endpoint);
      this.logMessage(`Using ${parsed.toString()} as the WHIP/WHEP Endpoint`);
      this.useTrickle = trickle;
      this.logMessage(`${trickle ? "Enabling" : "Disabling"} trickle ICE`);
    } catch (e) {
      throw new Error("Invalid Endpoint URL");
    }
    this.endpoint = endpoint;
    this.resourceURL = "";
  }

  async Disconnect() {
    this.endpoint = "";
    this.killConnection();
    if (!this.resourceURL) {
      throw new Error("No resource URL");
    }
    const resp = await fetch(this.resourceURL, {
      method: "DELETE",
      mode: "cors",
    });
    if (resp.status != 200) {
      const body = await resp.text();
      throw new Error(`Unexpected status code ${resp.status}: ${body}`);
    }
    this.logMessage(`----- Disconnected via DELETE -----`);
    this.resourceURL = "";
  }

  async Play(): Promise<MediaStream> {
    this.mode = Mode.Player;
    this.killConnection();
    this.playerMedia = new MediaStream();
    this.createConnection();
    await this.whepClientOffer();
    await this.connectedPromise;
    return this.playerMedia;
  }

  async Publish(src: MediaStream) {
    this.mode = Mode.Publisher;
    this.killConnection();
    this.createConnection();
    await this.whipOffer(src);
    await this.connectedPromise;
  }

  async ReplaceVideoTrack(src: MediaStream) {
    if (!this.videoSender) {
      throw new Error("Publisher is not active");
    }
    const tracks = src.getTracks();
    if (tracks.length < 1) {
      throw new Error("No tracks in MediaStream");
    }
    return await this.videoSender.replaceTrack(tracks[0]);
  }
}
