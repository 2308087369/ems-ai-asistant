import { NextResponse } from "next/server";
import CryptoJS from "crypto-js";

export async function GET(request: Request) {
  const APPID = process.env.APPID;
  const API_SECRET = process.env.APISecret;
  const API_KEY = process.env.APIKey;

  if (!APPID || !API_SECRET || !API_KEY) {
    return NextResponse.json(
      { error: "Missing Xunfei TTS credentials" },
      { status: 500 }
    );
  }

  const hostUrl = "wss://tts-api.xfyun.cn/v2/tts";
  const host = "tts-api.xfyun.cn";
  const date = new Date().toUTCString();
  const algorithm = "hmac-sha256";
  const headers = "host date request-line";
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);
  const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
  const authorization = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationOrigin)
  );

  const finalUrl = `${hostUrl}?authorization=${authorization}&date=${encodeURI(
    date
  )}&host=${host}`;

  return NextResponse.json({ url: finalUrl, app_id: APPID });
}
