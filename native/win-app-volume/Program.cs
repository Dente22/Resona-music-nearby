using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;

/// <summary>
/// Sets per-app volume in the Windows Volume Mixer (WASAPI ISimpleAudioVolume).
/// Usage:
///   win-app-volume.exe set &lt;0-100&gt; [pid ...]
///   win-app-volume.exe set-name &lt;0-100&gt; &lt;processName&gt; [processName ...]
///   win-app-volume.exe list
/// Compatible with .NET Framework 4.x / C# 5.
///
/// Important: GetSession returns IAudioSessionControl. We QueryInterface to
/// IAudioSessionControl2 / ISimpleAudioVolume so we never call the wrong vtable
/// slots (that used to wipe session display names → "Name not available" /
/// missing now-playing in the Windows mixer panel).
/// </summary>
internal static class Program
{
    private static int Main(string[] args)
    {
        if (args.Length < 1)
        {
            Console.Error.WriteLine("usage: win-app-volume set <0-100> [pid ...] | set-name <0-100> <name>... | list");
            return 2;
        }

        string cmd = args[0].ToLowerInvariant();
        if (cmd == "list")
        {
            try
            {
                Console.WriteLine(VolumeMixer.ListSessions());
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
                return 1;
            }
        }

        if (args.Length < 2)
        {
            Console.Error.WriteLine("usage: win-app-volume set <0-100> [pid ...] | set-name <0-100> <name>... | list");
            return 2;
        }

        float percent;
        if (!float.TryParse(args[1], NumberStyles.Float, CultureInfo.InvariantCulture, out percent))
        {
            Console.Error.WriteLine("invalid percent");
            return 2;
        }

        percent = Math.Max(0f, Math.Min(100f, percent));
        float scalar = percent / 100f;
        bool mute = percent <= 0.001f;
        int touched = 0;

        try
        {
            if (cmd == "set")
            {
                HashSet<int> pids = new HashSet<int>();
                for (int i = 2; i < args.Length; i++)
                {
                    int pid;
                    if (int.TryParse(args[i], NumberStyles.Integer, CultureInfo.InvariantCulture, out pid) && pid > 0)
                        pids.Add(pid);
                }
                if (pids.Count == 0)
                    pids.Add(Process.GetCurrentProcess().Id);

                touched = VolumeMixer.ApplyToPids(pids, scalar, mute);
            }
            else if (cmd == "set-name")
            {
                HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 2; i < args.Length; i++)
                {
                    string n = args[i];
                    if (string.IsNullOrWhiteSpace(n)) continue;
                    if (n.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                        n = n.Substring(0, n.Length - 4);
                    names.Add(n);
                }
                if (names.Count == 0)
                {
                    Console.Error.WriteLine("missing process names");
                    return 2;
                }
                touched = VolumeMixer.ApplyToProcessNames(names, scalar, mute);
            }
            else
            {
                Console.Error.WriteLine("unknown command");
                return 2;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }

        Console.WriteLine("ok touched=" + touched + " percent=" + percent.ToString("0.##", CultureInfo.InvariantCulture));
        return 0;
    }
}

internal static class VolumeMixer
{
    private const float VolumeEpsilon = 0.001f;
    private static readonly Guid IidSessionControl2 = new Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d");
    private static readonly Guid IidSimpleAudioVolume = new Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8");

    public static int ApplyToProcessNames(HashSet<string> names, float scalar, bool mute)
    {
        HashSet<int> pids = new HashSet<int>();
        Process[] processes = Process.GetProcesses();
        for (int i = 0; i < processes.Length; i++)
        {
            Process proc = processes[i];
            try
            {
                if (names.Contains(proc.ProcessName))
                    pids.Add(proc.Id);
            }
            catch
            {
            }
            finally
            {
                try { proc.Dispose(); } catch { }
            }
        }
        return ApplyToPids(pids, scalar, mute);
    }

    public static string ListSessions()
    {
        System.Text.StringBuilder sb = new System.Text.StringBuilder();
        ForEachSession(delegate(int pid, bool isSystem, ISimpleAudioVolume volume)
        {
            float level = -1f;
            bool muted = false;
            try
            {
                volume.GetMasterVolume(out level);
                volume.GetMute(out muted);
            }
            catch { }

            string pname = "?";
            try { pname = Process.GetProcessById(pid).ProcessName; } catch { }
            sb.Append("pid=").Append(pid)
              .Append(" name=").Append(pname)
              .Append(" sys=").Append(isSystem ? 1 : 0)
              .Append(" vol=").Append(level.ToString("0.###", CultureInfo.InvariantCulture))
              .Append(" mute=").Append(muted ? 1 : 0)
              .AppendLine();
            return false;
        });
        return sb.ToString().TrimEnd();
    }

    public static int ApplyToPids(HashSet<int> pids, float scalar, bool mute)
    {
        if (pids == null || pids.Count == 0) return 0;

        int touched = 0;
        ForEachSession(delegate(int pid, bool isSystem, ISimpleAudioVolume volume)
        {
            if (isSystem) return false;
            if (pid <= 0 || !pids.Contains(pid)) return false;

            float current;
            int hr = volume.GetMasterVolume(out current);
            if (hr < 0) return false;

            bool currentMute;
            hr = volume.GetMute(out currentMute);
            if (hr < 0) return false;

            bool volumeChanged = Math.Abs(current - scalar) > VolumeEpsilon;
            bool muteChanged = currentMute != mute;
            if (!volumeChanged && !muteChanged) return false;

            Guid ctx = Guid.Empty;
            if (volumeChanged)
            {
                hr = volume.SetMasterVolume(scalar, ref ctx);
                if (hr < 0) return false;
            }
            if (muteChanged)
            {
                hr = volume.SetMute(mute, ref ctx);
                if (hr < 0) return false;
            }
            touched++;
            return false;
        });
        return touched;
    }

    private delegate bool SessionVisitor(int pid, bool isSystem, ISimpleAudioVolume volume);

    private static void ForEachSession(SessionVisitor visitor)
    {
        IMMDeviceEnumerator deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
        IMMDevice speakers;
        int hr = deviceEnumerator.GetDefaultAudioEndpoint(EDataFlow.eRender, ERole.eMultimedia, out speakers);
        if (hr < 0 || speakers == null)
        {
            Marshal.ReleaseComObject(deviceEnumerator);
            return;
        }

        Guid iid = typeof(IAudioSessionManager2).GUID;
        object o;
        hr = speakers.Activate(ref iid, ClsCtx.INPROC_SERVER, IntPtr.Zero, out o);
        if (hr < 0 || o == null)
        {
            Marshal.ReleaseComObject(speakers);
            Marshal.ReleaseComObject(deviceEnumerator);
            return;
        }

        IAudioSessionManager2 mgr = (IAudioSessionManager2)o;
        IAudioSessionEnumerator sessionEnumerator;
        hr = mgr.GetSessionEnumerator(out sessionEnumerator);
        if (hr < 0 || sessionEnumerator == null)
        {
            Marshal.ReleaseComObject(mgr);
            Marshal.ReleaseComObject(speakers);
            Marshal.ReleaseComObject(deviceEnumerator);
            return;
        }

        int count;
        sessionEnumerator.GetCount(out count);

        for (int i = 0; i < count; i++)
        {
            IntPtr unk = IntPtr.Zero;
            IAudioSessionControl2 ctl2 = null;
            ISimpleAudioVolume volume = null;
            try
            {
                // GetSession returns IUnknown* to IAudioSessionControl — use IntPtr + QI.
                hr = sessionEnumerator.GetSession(i, out unk);
                if (hr < 0 || unk == IntPtr.Zero) continue;

                IntPtr pCtl2;
                Guid iidCtl2 = IidSessionControl2;
                hr = Marshal.QueryInterface(unk, ref iidCtl2, out pCtl2);
                if (hr < 0 || pCtl2 == IntPtr.Zero) continue;
                ctl2 = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(pCtl2);
                Marshal.Release(pCtl2);

                int cpid;
                hr = ctl2.GetProcessId(out cpid);
                if (hr < 0) continue;

                // S_OK (0) ⇒ system sounds session.
                bool isSystem = ctl2.IsSystemSoundsSession() == 0;

                IntPtr pVol;
                Guid iidVol = IidSimpleAudioVolume;
                hr = Marshal.QueryInterface(unk, ref iidVol, out pVol);
                if (hr < 0 || pVol == IntPtr.Zero) continue;
                volume = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(pVol);
                Marshal.Release(pVol);

                visitor(cpid, isSystem, volume);
            }
            catch
            {
            }
            finally
            {
                if (volume != null) Marshal.ReleaseComObject(volume);
                if (ctl2 != null) Marshal.ReleaseComObject(ctl2);
                if (unk != IntPtr.Zero) Marshal.Release(unk);
            }
        }

        Marshal.ReleaseComObject(sessionEnumerator);
        Marshal.ReleaseComObject(mgr);
        Marshal.ReleaseComObject(speakers);
        Marshal.ReleaseComObject(deviceEnumerator);
    }
}

[ComImport]
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
internal class MMDeviceEnumerator
{
}

internal enum EDataFlow
{
    eRender,
    eCapture,
    eAll,
}

internal enum ERole
{
    eConsole,
    eMultimedia,
    eCommunications,
}

internal static class ClsCtx
{
    public const int INPROC_SERVER = 1;
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumerator
{
    int NotImpl1();

    [PreserveSig]
    int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice ppDevice);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDevice
{
    [PreserveSig]
    int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioSessionManager2
{
    int NotImpl1();
    int NotImpl2();

    [PreserveSig]
    int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioSessionEnumerator
{
    [PreserveSig]
    int GetCount(out int SessionCount);

    /// <summary>Native returns IAudioSessionControl*; marshal as IUnknown pointer for safe QI.</summary>
    [PreserveSig]
    int GetSession(int SessionCount, out IntPtr Session);
}

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface ISimpleAudioVolume
{
    [PreserveSig]
    int SetMasterVolume(float fLevel, ref Guid EventContext);

    [PreserveSig]
    int GetMasterVolume(out float pfLevel);

    [PreserveSig]
    int SetMute(bool bMute, ref Guid EventContext);

    [PreserveSig]
    int GetMute(out bool pbMute);
}

// Do NOT use C# interface inheritance here — ComImport vtables break when inherited.
[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioSessionControl2
{
    // IAudioSessionControl
    [PreserveSig] int GetState(out int pRetVal);
    [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetGroupingParam(out Guid pRetVal);
    [PreserveSig] int SetGroupingParam([MarshalAs(UnmanagedType.LPStruct)] Guid Override, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int RegisterAudioSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int UnregisterAudioSessionNotification(IntPtr NewNotifications);
    // IAudioSessionControl2
    [PreserveSig] int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetProcessId(out int pRetVal);
    /// <summary>Returns S_OK (0) when this is the system-sounds session.</summary>
    [PreserveSig] int IsSystemSoundsSession();
    [PreserveSig] int SetDuckingPreference(bool optOut);
}
