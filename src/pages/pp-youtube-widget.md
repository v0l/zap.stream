**Effective:** January 12 2026  

Zap.Stream (“we”, “us”, “our”) provides a chat‑widget integration that reads YouTube Live‑chat messages through a **gRPC‑based protobuf proxy**. 

The widget sends the user’s YouTube **access‑token (read_only scope)** to our backend solely so that the proxy can forward the request to the YouTube Live‑chat gRPC endpoint. The token is never persisted, logged, or used for any purpose other than the real‑time request.

---

## 1. Information We Collect  

| Type of Data | Source | Why We Collect It |
|--------------|--------|-------------------|
| **YouTube Live‑chat messages** (text, timestamps, author channel ID) | YouTube Live‑chat gRPC endpoint (via our protobuf proxy) | To display the live chat inside the Zap.Stream widget. |
| **YouTube channel identifiers** (channel ID, display name) | YouTube API response | To attribute each message correctly in the widget. |
| **User’s YouTube access‑token (read_only)** | Supplied by the site that embeds the widget | Required by the protobuf proxy to authenticate the gRPC call to YouTube. |
| **Technical data** (IP address, browser user‑agent, page URL, widget configuration) | Your browser when the widget loads | To deliver the widget, troubleshoot issues, and protect against abuse. |

*We do **not** request any other YouTube account data (e.g., email address, private video list, subscriptions).*

---

## 2. How We Use the Data  

| Data | Use |
|------|-----|
| **Live‑chat messages & channel IDs** | Render the live‑chat stream in real time. |
| **Access‑token (read_only)** | Passed through our **protobuf proxy** to the YouTube Live‑chat gRPC endpoint. The token is used **once per request** and is **immediately discarded** after the gRPC call completes. |
| **Technical data** | Detect spam, enforce rate limits, debug, and maintain service stability. |
| **Aggregated anonymous analytics** (optional) | If you enable the “anonymous usage stats” toggle, we collect non‑identifiable counts (e.g., total messages per hour) solely for performance monitoring. No individual message content or token is stored. |

*We never store, log, or share individual chat messages, channel IDs, or the access‑token with any third party, except as required by law.*  

---

## 3. Data Flow & Token Handling  

1. **Widget loads** in the user’s browser.  
2. The page supplies the **YouTube OAuth 2.0 access‑token (read_only)** to the widget (usually via a JavaScript variable or a signed URL).  
3. The widget sends the token **over an HTTPS‑encrypted channel** to our **protobuf proxy server**.  
4. The proxy creates a **gRPC request** to the YouTube Live‑chat endpoint, attaching the token as the Bearer credential.  
5. YouTube validates the token and returns the live‑chat protobuf payload.  
6. The proxy forwards the payload back to the widget (still over HTTPS).  
7. **Immediately after the gRPC call finishes**, the proxy **purges the token from memory**; it is never written to disk, logs, or any persistent store.  

---

## 4. Data Retention  

| Data | Retention Period |
|------|------------------|
| Live‑chat messages & channel IDs | **In memory only** while the widget is active; discarded the moment the page is closed or the widget is removed. |
| Access‑token (read_only) | **Transient** – held only for the duration of the single gRPC request; erased instantly afterward. |
| Technical logs (IP, user‑agent, request timestamps) | Up to **30 days** for security and debugging. |
| Aggregated anonymous analytics (if enabled) | Up to **90 days** in an anonymous form. |

---

## 5. Security Measures  

- **Transport security** – All traffic (browser ⇢ proxy ⇢ YouTube) uses TLS 1.2+ (HTTPS & gRPC‑TLS).  
- **Token handling** – Tokens are accepted only via POST bodies, never as URL query strings; they are stored only in volatile RAM and cleared after use.  
- **No logging of tokens or chat content** – Our logging configuration explicitly redacts the Authorization header and any protobuf payload before writing to log files.  
- **Server hardening** – Proxy servers run behind a firewall, employ intrusion‑detection, and are regularly patched. Access to the proxy is restricted to a minimal set of service accounts.  
- **In‑memory processing** – Live‑chat data is processed in RAM and never written to persistent storage.  

---

## 6. Your Rights & Choices  

- **Remove the widget** – Deleting the widget from your site stops any further data transmission.  
- **Disable analytics** – Turn off the “anonymous usage stats” option in the widget configuration.  
- **Request deletion** – If you believe any of the technical logs contain personal data you wish removed, contact us (see § 8) and we will delete the relevant entries promptly.  
- **Control token exposure** – You may generate a short‑lived read‑only token for each session; once the widget is unloaded the token becomes unusable.  

---

## 7. Third‑Party Services  

The widget may load other third‑party scripts (e.g., YouTube’s embed player). Those services have their own privacy policies; Zap.Stream is not responsible for their data practices.

---

## 8. Changes to This Policy  

We may update this privacy policy as our service evolves. Significant changes will be posted on the Zap.Stream website and announced in the widget’s documentation. The “Effective Date” at the top reflects the latest revision.

---

## 9. Contact  

If you have questions, concerns, or requests regarding this privacy policy or our token handling practices, please contact us:

**Zap.Stream – Privacy & Security Team**  
Email: privacy@zap.stream

---

*By embedding and using the Zap.Stream widget, you acknowledge that you have read, understood, and agree to this privacy policy.*