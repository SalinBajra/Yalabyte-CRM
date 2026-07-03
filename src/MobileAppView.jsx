import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const androidApkPath = '/downloads/crmbyte.apk';
const fallbackWebOrigin = 'https://crm.yalabyte.com';

function isMissingApkResponse(response) {
  return response.status === 404 || response.headers.get('content-type')?.includes('text/html');
}

export default function MobileAppView() {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const isIosApp = isNative && platform === 'ios';
  const isAndroidApp = isNative && platform === 'android';
  const apkUrl = useMemo(() => {
    if (import.meta.env.VITE_ANDROID_APK_URL) return import.meta.env.VITE_ANDROID_APK_URL;
    if (Capacitor.isNativePlatform()) return new URL(androidApkPath, import.meta.env.VITE_CRM_WEB_URL || fallbackWebOrigin).href;
    return new URL(androidApkPath, window.location.origin).href;
  }, []);
  const testFlightUrl = import.meta.env.VITE_IOS_TESTFLIGHT_URL || '';
  const [qrImage, setQrImage] = useState('');
  const [apkReady, setApkReady] = useState(false);

  useEffect(() => {
    if (isIosApp) return undefined;
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(apkUrl, { margin: 2, width: 220, color: { dark: '#0f172a', light: '#ffffff' } }))
      .then(setQrImage)
      .catch(() => setQrImage(''));
  }, [apkUrl, isIosApp]);

  useEffect(() => {
    if (isIosApp) return undefined;
    fetch(apkUrl, { method: 'HEAD', cache: 'no-store' })
      .then((response) => setApkReady(response.ok && !isMissingApkResponse(response)))
      .catch(() => setApkReady(false));
  }, [apkUrl, isIosApp]);

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">CRM install</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Mobile App</h1>
        <p className="mt-1 text-sm text-slate-500">{isIosApp ? 'This iPhone already has CRMByte installed.' : 'Android teammates can download the APK from this page after signing in on their phone.'}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        {isIosApp ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex flex-col items-center text-center">
              <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-700">iPhone</span>
              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-950">CRMByte is installed</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">You are already using the iOS app. Other iPhones need Xcode for now, or TestFlight after the Apple Developer account is ready.</p>
              {testFlightUrl ? <a className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white" href={testFlightUrl}>Open TestFlight</a> : null}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">Android</span>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-950">{isAndroidApp ? 'CRMByte is installed' : 'CRMByte APK'}</h2>
            {isAndroidApp ? (
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">You are already using the Android app. Web download QR is for teammates who still need to install it.</p>
            ) : (
              <>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  {qrImage ? <img className="h-[220px] w-[220px]" src={qrImage} alt="Android APK download QR code" /> : <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-slate-100" />}
                </div>
                <a
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-extrabold shadow-sm transition sm:w-auto ${apkReady ? 'bg-cyanbrand-500 text-navy-950 hover:-translate-y-0.5 hover:bg-cyanbrand-400 hover:shadow-md' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                  href={apkReady ? apkUrl : undefined}
                  aria-disabled={!apkReady}
                >
                  {apkReady ? 'Download APK' : 'APK not uploaded yet'}
                </a>
                <p className="mt-3 break-all text-xs font-semibold text-slate-400">{apkUrl}</p>
              </>
            )}
          </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Team install</span>
          <h3 className="mt-3 text-lg font-extrabold text-slate-950">How Android teammates install</h3>
          <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-500">
            <li><span className="font-extrabold text-slate-950">1.</span> Open the CRMByte website on the Android phone.</li>
            <li><span className="font-extrabold text-slate-950">2.</span> Sign in with the YalaByte account.</li>
            <li><span className="font-extrabold text-slate-950">3.</span> Open <span className="font-bold text-slate-950">Mobile App</span> and tap <span className="font-bold text-slate-950">Download APK</span>.</li>
            <li><span className="font-extrabold text-slate-950">4.</span> If Android asks, allow installs from the browser, then open the downloaded file.</li>
          </ol>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            iPhone cannot install APK files. iPhone teammates need Xcode for now or TestFlight later.
          </div>
        </section>
      </div>
    </div>
  );
}
