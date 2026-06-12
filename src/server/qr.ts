import QRCode from "qrcode";

export async function createJoinQrDataUrl(joinUrl: string) {
  return QRCode.toDataURL(joinUrl, {
    width: 512,
    margin: 1,
    color: {
      dark: "#020617",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}
