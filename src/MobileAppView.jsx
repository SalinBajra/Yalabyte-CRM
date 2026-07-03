import { useEffect, useMemo, useState } from 'react';

const androidApkPath = '/downloads/crmbyte.apk';

function isMissingApkResponse(response) {
  return response.status === 404 || response.headers.get('content-type')?.includes('text/html');
}

export default function MobileAppView() {
  const apkUrl = useMemo(() => {
    if (import.meta.env.VITE_ANDROID_APK_URL) return import.meta.env.VITE_ANDROID_APK_URL;
    return new URL(androidApkPath, window.location.origin).href;
  }, []);
  const testFlightUrl = import.meta.env.VITE_IOS_TESTFLIGHT_URL || '';
  const [qrImage, setQrImage] = useState('');
  const [apkReady, setApkReady] = useState(false);

  useEffect(() => {
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(apkUrl, { margin: 2, width: 220, color: { dark: '#0f172a', light: '#ffffff' } }))
      .then(setQrImage)
      .catch(() => setQrImage(''));
  }, [apkUrl]);

  useEffect(() => {
    fetch(apkUrl, { method: 'HEAD', cache: 'no-store' })
      .then((response) => setApkReady(response.ok && !isMissingApkResponse(response)))
      .catch(() => setApkReady(false));
  }, [apkUrl]);

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Team install</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Mobile App</h1>
        <p className="mt-1 text-sm text-slate-500">Android can install directly from CRMByte. iPhone installs stay with Xcode or TestFlight.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">Android</span>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-950">CRMByte APK</h2>
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
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Android build</span>
              <h3 className="mt-3 text-lg font-extrabold text-slate-950">Generate the file</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Run `npm run build:android:apk` after installing Java and Android Studio. The APK will be copied to `public/downloads/crmbyte.apk`.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600">iPhone</span>
              <h3 className="mt-3 text-lg font-extrabold text-slate-950">Use Xcode or TestFlight</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">APK files do not install on iPhone. For team installs, publish a TestFlight build and add the invite link here.</p>
              {testFlightUrl ? <a className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white" href={testFlightUrl}>Open TestFlight</a> : null}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Android may ask each teammate to allow installs from the browser. Use Play Console later if you want a smoother managed rollout.
          </div>
        </section>
      </div>
    </div>
  );
}
