import { useEffect, useRef, useState } from "react";
import { api } from "./api";

const LIMIT_BYTES = 2 * 1024 * 1024;
const RECORDING_MS = 8000;
function selectCameraFormat() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of [
    "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4",
  ]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}
const actionButton = { padding: "10px 13px", borderRadius: 9, background: "#047857",
  color: "white", fontWeight: 750, border: 0, cursor: "pointer" };

export default function SellerIntentVideo({ listing, onComplete }) {
  const [challenge, setChallenge] = useState(null);
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const liveVideo = useRef(null);
  const camera = useRef(null);
  const recorder = useRef(null);
  const timer = useRef(null);

  const stopCamera = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    if (camera.current) camera.current.getTracks().forEach(track => track.stop());
    camera.current = null;
    setStream(null);
  };
  useEffect(() => {
    if (liveVideo.current && stream) liveVideo.current.srcObject = stream;
  }, [stream]);
  useEffect(() => {
    if (!clip) { setPreviewUrl(""); return undefined; }
    const objectUrl = URL.createObjectURL(clip);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [clip]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    camera.current?.getTracks().forEach(t => t.stop());
  }, []);

  async function getChallenge() {
    setLoading(true); setError(""); setNotice(""); setClip(null); setConsent(false);
    stopCamera();
    try {
      const issued = await api.issueSellerVideoChallenge(listing.id);
      setChallenge(issued);
      setNotice("Read the script aloud in your selfie video. The code expires in 10 minutes.");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function startRecording() {
    setError(""); setClip(null);
    if (!consent || !challenge) {
      setError("Consent and a valid challenge are required.");
      return;
    }
    if (new Date(challenge.expiresAt).getTime() <= Date.now()) {
      setError("Your challenge expired. Request another code.");
      return;
    }
    const mimeType = selectCameraFormat();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      setError("Your browser cannot record a suitable camera video. Use an updated Chrome or Safari browser with camera and microphone access.");
      return;
    }
    let captured;
    try {
      captured = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 },
          frameRate: { ideal: 15, max: 20 } },
        audio: true,
      });
      camera.current = captured;
      setStream(captured);
      const chunks = [];
      const media = new MediaRecorder(captured, {
        mimeType, videoBitsPerSecond: 240000, audioBitsPerSecond: 24000,
      });
      recorder.current = media;
      media.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      media.onerror = () => { stopCamera(); setRecording(false); setError("Video capture failed. Check your camera permission and try again."); };
      media.onstop = () => {
        const file = new Blob(chunks, { type: mimeType.split(";")[0] });
        if (file.size < 16 || file.size > LIMIT_BYTES) {
          setError("Recording is too large or empty. Record in better lighting at a lower resolution, then try again.");
        } else {
          setClip(file);
          setNotice("Preview your video, confirm that your face and one-time code are clear, then submit.");
        }
        setRecording(false);
        captured.getTracks().forEach(t => t.stop());
        camera.current = null;
        setStream(null);
        recorder.current = null;
      };
      media.start(1000);
      setRecording(true);
      timer.current = setTimeout(() => {
        if (media.state === "recording") media.stop();
      }, RECORDING_MS);
    } catch(e) {
      captured?.getTracks().forEach(t=>t.stop());
      camera.current = null; setStream(null); setRecording(false);
      setError("Camera and microphone access are needed for a fresh video. " +
        (e.name === "NotAllowedError" ? "Allow access in your browser settings." : "Try a supported browser."));
    }
  }
  async function upload() {
    if (!clip || !challenge || !consent) return;
    setLoading(true); setError("");
    try {
      await api.uploadSellerIntentVideo(listing.id, clip, challenge.challenge);
      setClip(null); setChallenge(null);
      setNotice("Your private selfie video is encrypted and submitted for owner review.");
      onComplete?.();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }
  async function erase() {
    if (!window.confirm("Erase your seller selfie video and revoke public listing approval?")) return;
    setLoading(true); setError("");
    try {
      await api.removeSellerIntentVideo(listing.id);
      setClip(null); setChallenge(null);
      setNotice("Selfie evidence erased and listing approval revoked.");
      onComplete?.();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <section className="cv-laptop-proof-box" aria-label="Seller authorisation video">
    <h4>Step 2 — Record your seller-authorisation selfie video</h4>
    <p><b>Required before management approval.</b> This fresh 8-second video shows you personally initiated the sale or swap of your {listing.brand} {listing.model}. The video and its challenge are private to the CampusVerse trading desk. A video does not independently prove your identity or lawful ownership.</p>
    <p>Recording is encrypted, limited to 2 MB and reviewed manually. It is not published to buyers, used for automated facial recognition or shared with advertisers. Avoid showing identity numbers, payment cards or other people.</p>
    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
      <button style={actionButton} type="button" disabled={loading || recording} onClick={getChallenge}>
        {challenge ? "Request a fresh challenge" : "1. Get a one-time video challenge"}
      </button>
      {listing.sellerVideoEvidence && <button className="cv-laptop-small" disabled={loading || recording} type="button" onClick={erase}>Erase my stored video</button>}
    </div>
    {challenge && <div style={{ padding:14, border:"1px solid #10b981",borderRadius:12,marginBottom:14 }}>
      <strong>Challenge code: {challenge.challenge}</strong>
      <p>Expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
      <p><b>Say this while showing your face:</b> “{challenge.prompt}”</p>
      <label style={{display:"flex",flexDirection:"row",alignItems:"flex-start",gap:10}}>
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
        I confirm that I am voluntarily recording this video to authorise my device listing and consent to its restricted storage and manual review by CampusVerse management.
      </label>
      {recording && <p role="status">🔴 Recording with camera and microphone (approximately 8 seconds)…</p>}
      <div style={{display:"flex",flexWrap:"wrap",gap:9,marginTop:12}}>
        <button type="button" style={actionButton} onClick={startRecording} disabled={!consent || loading || recording}>
          {recording ? "Recording…" : "2. Record live selfie video"}
        </button>
        {clip && <button type="button" style={actionButton} disabled={loading || recording} onClick={upload}>3. Submit video privately</button>}
      </div>
    </div>}
    {stream && <video ref={liveVideo} muted playsInline autoPlay aria-label="Live front camera preview"
      style={{maxWidth:340,width:"100%",margin:"10px 0",borderRadius:10}}/>}
    {previewUrl && <video controls playsInline src={previewUrl} aria-label="Review your seller selfie video"
      style={{maxWidth:340,width:"100%",margin:"10px 0",borderRadius:10}}/>}
    {error && <p role="alert" style={{color:"#fecaca"}}>{error}</p>}
    {notice && <p role="status" style={{color:"#a7f3d0"}}>{notice}</p>}
    {listing.sellerVideoEvidence && <p>✅ Private selfie video received on {new Date(listing.sellerVideoEvidence.uploadedAt).toLocaleDateString()}. Owner approval is still required.</p>}
  </section>;
}
